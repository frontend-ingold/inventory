import { HttpError } from "../utils/httpError.js";

const tableMap = {
  categories: "categories",
  suppliers: "suppliers",
  customers: "customers",
  products: "products",
  purchases: "purchases",
  sales: "sales",
  adjustments: "adjustments",
  stockMovements: "stock_movements"
};

const selectMap = {
  categories: `
    select id, name, description
    from categories
    order by created_at desc
  `,
  suppliers: `
    select id, name, email, phone, address
    from suppliers
    order by created_at desc
  `,
  customers: `
    select id, name, email, phone, address
    from customers
    order by created_at desc
  `,
  products: `
    select
      id,
      sku,
      name,
      category_id as "categoryId",
      supplier_id as "supplierId",
      unit,
      price,
      cost_price as "costPrice",
      quantity,
      reorder_level as "reorderLevel",
      status,
      description,
      created_at as "createdAt"
    from products
    order by created_at desc
  `,
  purchases: `
    select
      p.id,
      p.supplier_id as "supplierId",
      p.notes,
      p.total_amount as "totalAmount",
      p.created_at as "createdAt",
      coalesce(
        json_agg(
          json_build_object(
            'productId', pi.product_id,
            'productName', pi.product_name,
            'quantity', pi.quantity,
            'unitPrice', pi.unit_price,
            'lineTotal', pi.line_total
          )
        ) filter (where pi.id is not null),
        '[]'::json
      ) as items
    from purchases p
    left join purchase_items pi on pi.purchase_id = p.id
    group by p.id
    order by p.created_at desc
  `,
  sales: `
    select
      s.id,
      s.customer_id as "customerId",
      s.notes,
      s.total_amount as "totalAmount",
      s.created_at as "createdAt",
      coalesce(
        json_agg(
          json_build_object(
            'productId', si.product_id,
            'productName', si.product_name,
            'quantity', si.quantity,
            'unitPrice', si.unit_price,
            'lineTotal', si.line_total
          )
        ) filter (where si.id is not null),
        '[]'::json
      ) as items
    from sales s
    left join sale_items si on si.sale_id = s.id
    group by s.id
    order by s.created_at desc
  `,
  adjustments: `
    select
      id,
      product_id as "productId",
      quantity,
      type,
      reason,
      created_at as "createdAt"
    from adjustments
    order by created_at desc
  `,
  stockMovements: `
    select
      id,
      product_id as "productId",
      type,
      direction,
      quantity,
      reference,
      note,
      created_at as "createdAt"
    from stock_movements
    order by created_at desc
  `
};

export class PostgresRepository {
  constructor(pool) {
    this.pool = pool;
  }

  async list(collection) {
    const query = selectMap[collection];
    const { rows } = await this.pool.query(query);
    return rows;
  }

  async createEntity(collection, entity) {
    switch (collection) {
      case "categories":
        return this.#insertSimpleEntity("categories", entity, ["id", "name", "description"]);
      case "suppliers":
      case "customers":
        return this.#insertSimpleEntity(tableMap[collection], entity, [
          "id",
          "name",
          "email",
          "phone",
          "address"
        ]);
      case "products":
        return this.#insertProduct(entity);
      default:
        throw new HttpError(400, "Unsupported entity type");
    }
  }

  async updateEntity(collection, id, entity) {
    switch (collection) {
      case "categories":
        return this.#updateSimpleEntity("categories", id, entity, ["name", "description"]);
      case "suppliers":
      case "customers":
        return this.#updateSimpleEntity(tableMap[collection], id, entity, ["name", "email", "phone", "address"]);
      case "products":
        return this.#updateProduct(id, entity);
      default:
        throw new HttpError(400, "Unsupported entity type");
    }
  }

  async deleteEntity(collection, id) {
    const table = tableMap[collection];

    if (!table || ["purchases", "sales", "adjustments", "stockMovements"].includes(collection)) {
      throw new HttpError(400, "Unsupported entity type");
    }

    const { rows } = await this.pool.query(`delete from ${table} where id = $1 returning id`, [id]);
    if (!rows.length) {
      throw new HttpError(404, `${collection.slice(0, -1)} not found`);
    }

    return { id };
  }

  async getProductById(productId, client = this.pool) {
    const { rows } = await client.query(
      `
        select
          id,
          sku,
          name,
          category_id as "categoryId",
          supplier_id as "supplierId",
          unit,
          price,
          cost_price as "costPrice",
          quantity,
          reorder_level as "reorderLevel",
          status,
          description,
          created_at as "createdAt"
        from products
        where id = $1
      `,
      [productId]
    );

    return rows[0] || null;
  }

  async getUserByEmail(email) {
    const { rows } = await this.pool.query(
      `
        select
          id,
          name,
          email,
          password_hash as "passwordHash",
          role,
          is_active as "isActive",
          created_at as "createdAt"
        from users
        where lower(email) = lower($1)
      `,
      [email]
    );

    return rows[0] || null;
  }

  async getUserById(id) {
    const { rows } = await this.pool.query(
      `
        select
          id,
          name,
          email,
          password_hash as "passwordHash",
          role,
          is_active as "isActive",
          created_at as "createdAt"
        from users
        where id = $1
      `,
      [id]
    );

    return rows[0] || null;
  }

  async createPurchase(payload) {
    return this.#createTransaction("purchase", payload);
  }

  async createSale(payload) {
    return this.#createTransaction("sale", payload);
  }

  async createAdjustment(payload) {
    const client = await this.pool.connect();

    try {
      await client.query("begin");
      const { rows } = await client.query(
        "select id, name, quantity from products where id = $1 for update",
        [payload.productId]
      );
      const product = rows[0];

      if (!product) {
        throw new HttpError(400, "Product does not exist");
      }

      const quantity = Number(payload.quantity);
      const type = payload.type === "decrease" ? "decrease" : "increase";
      const nextQuantity = type === "increase" ? Number(product.quantity) + quantity : Number(product.quantity) - quantity;

      if (nextQuantity < 0) {
        throw new HttpError(400, "Adjustment exceeds available stock");
      }

      await client.query("update products set quantity = $1 where id = $2", [nextQuantity, payload.productId]);

      const adjustmentResult = await client.query(
        `
          insert into adjustments (product_id, quantity, type, reason)
          values ($1, $2, $3, $4)
          returning
            id,
            product_id as "productId",
            quantity,
            type,
            reason,
            created_at as "createdAt"
        `,
        [payload.productId, quantity, type, payload.reason || ""]
      );

      const adjustment = adjustmentResult.rows[0];

      await client.query(
        `
          insert into stock_movements (product_id, type, direction, quantity, reference, note)
          values ($1, 'adjustment', $2, $3, $4, $5)
        `,
        [
          payload.productId,
          type === "increase" ? "in" : "out",
          quantity,
          adjustment.id,
          payload.reason || "Manual stock adjustment"
        ]
      );

      await client.query("commit");
      return adjustment;
    } catch (error) {
      await client.query("rollback");
      throw error;
    } finally {
      client.release();
    }
  }

  async getDashboard() {
    const [
      productsResult,
      categoriesResult,
      suppliersResult,
      customersResult,
      inventoryValueResult,
      salesTotalResult,
      purchaseTotalResult,
      lowStockResult,
      recentMovementsResult,
      topProductsResult
    ] = await Promise.all([
      this.pool.query("select count(*)::int as count from products"),
      this.pool.query("select count(*)::int as count from categories"),
      this.pool.query("select count(*)::int as count from suppliers"),
      this.pool.query("select count(*)::int as count from customers"),
      this.pool.query("select coalesce(sum(quantity * cost_price), 0)::float as total from products"),
      this.pool.query("select coalesce(sum(total_amount), 0)::float as total from sales"),
      this.pool.query("select coalesce(sum(total_amount), 0)::float as total from purchases"),
      this.pool.query(`
        select
          id,
          sku,
          name,
          category_id as "categoryId",
          supplier_id as "supplierId",
          unit,
          price,
          cost_price as "costPrice",
          quantity,
          reorder_level as "reorderLevel",
          status,
          description,
          created_at as "createdAt"
        from products
        where quantity <= reorder_level
        order by quantity asc, created_at desc
      `),
      this.pool.query(`
        select
          id,
          product_id as "productId",
          type,
          direction,
          quantity,
          reference,
          note,
          created_at as "createdAt"
        from stock_movements
        order by created_at desc
        limit 8
      `),
      this.pool.query(`
        select
          id,
          sku,
          name,
          category_id as "categoryId",
          supplier_id as "supplierId",
          unit,
          price,
          cost_price as "costPrice",
          quantity,
          reorder_level as "reorderLevel",
          status,
          description,
          created_at as "createdAt"
        from products
        order by quantity asc, created_at desc
        limit 5
      `)
    ]);

    return {
      metrics: {
        totalProducts: productsResult.rows[0].count,
        totalCategories: categoriesResult.rows[0].count,
        totalSuppliers: suppliersResult.rows[0].count,
        totalCustomers: customersResult.rows[0].count,
        inventoryValue: Number(inventoryValueResult.rows[0].total),
        salesTotal: Number(salesTotalResult.rows[0].total),
        purchaseTotal: Number(purchaseTotalResult.rows[0].total),
        lowStockCount: lowStockResult.rows.length
      },
      lowStock: lowStockResult.rows,
      recentMovements: recentMovementsResult.rows,
      topProducts: topProductsResult.rows
    };
  }

  async #insertSimpleEntity(table, entity, fields) {
    const columns = fields.join(", ");
    const params = fields.map((_, index) => `$${index + 1}`).join(", ");
    const values = fields.map((field) => entity[field] ?? null);
    const { rows } = await this.pool.query(
      `insert into ${table} (${columns}) values (${params}) returning *`,
      values
    );

    return rows[0];
  }

  async #updateSimpleEntity(table, id, entity, fields) {
    const assignments = fields.map((field, index) => `${field} = $${index + 2}`).join(", ");
    const values = [id, ...fields.map((field) => entity[field] ?? null)];
    const { rows } = await this.pool.query(
      `update ${table} set ${assignments} where id = $1 returning *`,
      values
    );

    if (!rows.length) {
      throw new HttpError(404, `${table.slice(0, -1)} not found`);
    }

    return rows[0];
  }

  async #insertProduct(entity) {
    const { rows } = await this.pool.query(
      `
        insert into products (
          id,
          sku,
          name,
          category_id,
          supplier_id,
          unit,
          price,
          cost_price,
          quantity,
          reorder_level,
          status,
          description,
          created_at
        )
        values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
        returning
          id,
          sku,
          name,
          category_id as "categoryId",
          supplier_id as "supplierId",
          unit,
          price,
          cost_price as "costPrice",
          quantity,
          reorder_level as "reorderLevel",
          status,
          description,
          created_at as "createdAt"
      `,
      [
        entity.id,
        entity.sku,
        entity.name,
        entity.categoryId,
        entity.supplierId,
        entity.unit,
        entity.price,
        entity.costPrice,
        entity.quantity,
        entity.reorderLevel,
        entity.status,
        entity.description,
        entity.createdAt
      ]
    );

    return rows[0];
  }

  async #updateProduct(id, entity) {
    const { rows } = await this.pool.query(
      `
        update products
        set
          sku = $2,
          name = $3,
          category_id = $4,
          supplier_id = $5,
          unit = $6,
          price = $7,
          cost_price = $8,
          quantity = $9,
          reorder_level = $10,
          status = $11,
          description = $12
        where id = $1
        returning
          id,
          sku,
          name,
          category_id as "categoryId",
          supplier_id as "supplierId",
          unit,
          price,
          cost_price as "costPrice",
          quantity,
          reorder_level as "reorderLevel",
          status,
          description,
          created_at as "createdAt"
      `,
      [
        id,
        entity.sku,
        entity.name,
        entity.categoryId,
        entity.supplierId,
        entity.unit,
        entity.price,
        entity.costPrice,
        entity.quantity,
        entity.reorderLevel,
        entity.status,
        entity.description
      ]
    );

    if (!rows.length) {
      throw new HttpError(404, "product not found");
    }

    return rows[0];
  }

  async #createTransaction(kind, payload) {
    const isPurchase = kind === "purchase";
    const headerTable = isPurchase ? "purchases" : "sales";
    const itemTable = isPurchase ? "purchase_items" : "sale_items";
    const foreignColumn = isPurchase ? "supplier_id" : "customer_id";
    const foreignValue = isPurchase ? payload.supplierId || null : payload.customerId || null;
    const referenceNote = isPurchase ? "Purchase transaction" : "Sale transaction";
    const client = await this.pool.connect();

    try {
      await client.query("begin");

      const normalizedItems = [];
      let totalAmount = 0;

      for (const item of payload.items || []) {
        const { rows } = await client.query(
          "select id, name, price, cost_price, quantity from products where id = $1 for update",
          [item.productId]
        );
        const product = rows[0];

        if (!product) {
          throw new HttpError(400, "Transaction contains an invalid product");
        }

        const quantity = Number(item.quantity);
        const unitPrice = Number(item.unitPrice ?? (isPurchase ? product.cost_price : product.price));
        const nextQuantity = isPurchase ? Number(product.quantity) + quantity : Number(product.quantity) - quantity;

        if (nextQuantity < 0) {
          throw new HttpError(400, `Insufficient stock for ${product.name}`);
        }

        totalAmount += quantity * unitPrice;
        normalizedItems.push({
          productId: product.id,
          productName: product.name,
          quantity,
          unitPrice,
          lineTotal: quantity * unitPrice,
          nextQuantity
        });
      }

      const headerResult = await client.query(
        `
          insert into ${headerTable} (${foreignColumn}, notes, total_amount)
          values ($1, $2, $3)
          returning id, notes, total_amount as "totalAmount", created_at as "createdAt"
        `,
        [foreignValue, payload.notes || "", totalAmount]
      );

      const header = headerResult.rows[0];

      for (const item of normalizedItems) {
        await client.query("update products set quantity = $1 where id = $2", [item.nextQuantity, item.productId]);
        await client.query(
          `
            insert into ${itemTable} (${isPurchase ? "purchase_id" : "sale_id"}, product_id, product_name, quantity, unit_price, line_total)
            values ($1, $2, $3, $4, $5, $6)
          `,
          [header.id, item.productId, item.productName, item.quantity, item.unitPrice, item.lineTotal]
        );
        await client.query(
          `
            insert into stock_movements (product_id, type, direction, quantity, reference, note)
            values ($1, $2, $3, $4, $5, $6)
          `,
          [item.productId, kind, isPurchase ? "in" : "out", item.quantity, header.id, referenceNote]
        );
      }

      await client.query("commit");

      return {
        id: header.id,
        [isPurchase ? "supplierId" : "customerId"]: foreignValue,
        notes: header.notes,
        items: normalizedItems.map(({ nextQuantity, ...rest }) => rest),
        totalAmount: Number(header.totalAmount),
        createdAt: header.createdAt
      };
    } catch (error) {
      await client.query("rollback");
      throw error;
    } finally {
      client.release();
    }
  }
}
