import { getPool } from "../config/database.js";
import { env } from "../config/env.js";
import { hashPassword } from "../utils/auth.js";

const CATEGORY_COUNT = 120;
const SUPPLIER_COUNT = 120;
const CUSTOMER_COUNT = 120;
const PRODUCT_COUNT = 150;
const USER_COUNT = 120;
const PURCHASE_COUNT = 120;
const SALE_COUNT = 120;
const ADJUSTMENT_COUNT = 120;

const units = ["pcs", "box", "pack", "unit", "carton"];
const productNames = [
  "Bearing Kit",
  "Valve Set",
  "Control Panel",
  "Sensor Module",
  "Hydraulic Pump",
  "Cable Roll",
  "Fastener Pack",
  "Relay Unit",
  "Filter Core",
  "Tool Case"
];

function formatDate(offsetDays, offsetMinutes = 0) {
  const now = Date.now();
  return new Date(now - offsetDays * 24 * 60 * 60 * 1000 + offsetMinutes * 60 * 1000).toISOString();
}

function textId(prefix, stamp, index) {
  return `${prefix}-${stamp}-${String(index).padStart(4, "0")}`;
}

function pick(items, index) {
  return items[index % items.length];
}

function chunk(items, size) {
  const chunks = [];
  for (let index = 0; index < items.length; index += size) {
    chunks.push(items.slice(index, index + size));
  }
  return chunks;
}

async function seedBaseTables(client, stamp) {
  const categories = Array.from({ length: CATEGORY_COUNT }, (_, index) => ({
    id: textId("cat", stamp, index + 1),
    name: `Category ${index + 1}`,
    description: `Generated category ${index + 1} for seeded inventory data`,
    createdAt: formatDate(210 - index)
  }));

  const suppliers = Array.from({ length: SUPPLIER_COUNT }, (_, index) => ({
    id: textId("sup", stamp, index + 1),
    name: `Supplier ${index + 1}`,
    email: `supplier${stamp}${index + 1}@mns.local`,
    phone: `+1-555-${String(3000 + index).padStart(4, "0")}`,
    address: `${100 + index} Industrial Street, Warehouse District`,
    createdAt: formatDate(205 - index)
  }));

  const customers = Array.from({ length: CUSTOMER_COUNT }, (_, index) => ({
    id: textId("cus", stamp, index + 1),
    name: `Customer ${index + 1}`,
    email: `customer${stamp}${index + 1}@mns.local`,
    phone: `+1-555-${String(5000 + index).padStart(4, "0")}`,
    address: `${10 + index} Commerce Avenue, Retail City`,
    createdAt: formatDate(200 - index)
  }));

  const products = Array.from({ length: PRODUCT_COUNT }, (_, index) => ({
    id: textId("prd", stamp, index + 1),
    sku: `MNS-${stamp}-${String(index + 1).padStart(5, "0")}`,
    name: `${pick(productNames, index)} ${index + 1}`,
    categoryId: categories[index % categories.length].id,
    supplierId: suppliers[index % suppliers.length].id,
    unit: pick(units, index),
    price: Number((45 + (index % 17) * 6.75).toFixed(2)),
    costPrice: Number((20 + (index % 13) * 4.2).toFixed(2)),
    quantity: 0,
    reorderLevel: 20 + (index % 12) * 5,
    status: "active",
    description: `Generated stock item ${index + 1} for MNS inventory testing`,
    createdAt: formatDate(195 - index)
  }));

  const passwordHash = await hashPassword(env.adminPassword);
  const users = Array.from({ length: USER_COUNT }, (_, index) => ({
    name: `MNS User ${index + 1}`,
    email: `user${stamp}${index + 1}@mns.local`,
    passwordHash,
    role: index % 5 === 0 ? "manager" : "staff",
    isActive: true,
    createdAt: formatDate(190 - index)
  }));

  for (const batch of chunk(categories, 40)) {
    const values = [];
    const placeholders = batch.map((item, index) => {
      const start = index * 4;
      values.push(item.id, item.name, item.description, item.createdAt);
      return `($${start + 1}, $${start + 2}, $${start + 3}, $${start + 4})`;
    });

    await client.query(
      `insert into categories (id, name, description, created_at) values ${placeholders.join(", ")}`,
      values
    );
  }

  for (const batch of chunk(suppliers, 40)) {
    const values = [];
    const placeholders = batch.map((item, index) => {
      const start = index * 6;
      values.push(item.id, item.name, item.email, item.phone, item.address, item.createdAt);
      return `($${start + 1}, $${start + 2}, $${start + 3}, $${start + 4}, $${start + 5}, $${start + 6})`;
    });

    await client.query(
      `insert into suppliers (id, name, email, phone, address, created_at) values ${placeholders.join(", ")}`,
      values
    );
  }

  for (const batch of chunk(customers, 40)) {
    const values = [];
    const placeholders = batch.map((item, index) => {
      const start = index * 6;
      values.push(item.id, item.name, item.email, item.phone, item.address, item.createdAt);
      return `($${start + 1}, $${start + 2}, $${start + 3}, $${start + 4}, $${start + 5}, $${start + 6})`;
    });

    await client.query(
      `insert into customers (id, name, email, phone, address, created_at) values ${placeholders.join(", ")}`,
      values
    );
  }

  for (const batch of chunk(products, 30)) {
    const values = [];
    const placeholders = batch.map((item, index) => {
      const start = index * 13;
      values.push(
        item.id,
        item.sku,
        item.name,
        item.categoryId,
        item.supplierId,
        item.unit,
        item.price,
        item.costPrice,
        item.quantity,
        item.reorderLevel,
        item.status,
        item.description,
        item.createdAt
      );
      return `($${start + 1}, $${start + 2}, $${start + 3}, $${start + 4}, $${start + 5}, $${start + 6}, $${start + 7}, $${start + 8}, $${start + 9}, $${start + 10}, $${start + 11}, $${start + 12}, $${start + 13})`;
    });

    await client.query(
      `
        insert into products (
          id, sku, name, category_id, supplier_id, unit, price, cost_price, quantity, reorder_level, status, description, created_at
        ) values ${placeholders.join(", ")}
      `,
      values
    );
  }

  for (const batch of chunk(users, 40)) {
    const values = [];
    const placeholders = batch.map((item, index) => {
      const start = index * 6;
      values.push(item.name, item.email, item.passwordHash, item.role, item.isActive, item.createdAt);
      return `($${start + 1}, $${start + 2}, $${start + 3}, $${start + 4}, $${start + 5}, $${start + 6})`;
    });

    await client.query(
      `
        insert into users (name, email, password_hash, role, is_active, created_at)
        values ${placeholders.join(", ")}
      `,
      values
    );
  }

  return { categories, suppliers, customers, products };
}

async function seedTransactions(client, stamp, products, suppliers, customers) {
  const productState = new Map(
    products.map((product) => [
      product.id,
      {
        ...product,
        quantity: 0
      }
    ])
  );

  for (let index = 0; index < PURCHASE_COUNT; index += 1) {
    const supplierId = suppliers[index % suppliers.length].id;
    const createdAt = formatDate(120 - index, index);
    const lineItems = [0, 1].map((offset) => {
      const product = productState.get(products[(index * 2 + offset) % products.length].id);
      const quantity = 20 + ((index + offset) % 7) * 5;
      const unitPrice = Number(product.costPrice);
      return {
        product,
        quantity,
        unitPrice,
        lineTotal: Number((quantity * unitPrice).toFixed(2))
      };
    });

    const totalAmount = Number(lineItems.reduce((sum, item) => sum + item.lineTotal, 0).toFixed(2));
    const purchaseResult = await client.query(
      `
        insert into purchases (supplier_id, notes, total_amount, created_at)
        values ($1, $2, $3, $4)
        returning id
      `,
      [supplierId, `Seed purchase batch ${stamp}-${index + 1}`, totalAmount, createdAt]
    );

    const purchaseId = purchaseResult.rows[0].id;

    for (const item of lineItems) {
      item.product.quantity += item.quantity;
      await client.query(
        `
          insert into purchase_items (purchase_id, product_id, product_name, quantity, unit_price, line_total)
          values ($1, $2, $3, $4, $5, $6)
        `,
        [purchaseId, item.product.id, item.product.name, item.quantity, item.unitPrice, item.lineTotal]
      );

      await client.query(
        `
          insert into stock_movements (product_id, type, direction, quantity, reference, note, created_at)
          values ($1, 'purchase', 'in', $2, $3, $4, $5)
        `,
        [item.product.id, item.quantity, purchaseId, "Seed purchase transaction", createdAt]
      );
    }
  }

  for (let index = 0; index < SALE_COUNT; index += 1) {
    const customerId = customers[index % customers.length].id;
    const createdAt = formatDate(80 - index, index);
    const lineItems = [0, 1].map((offset) => {
      const product = productState.get(products[(index * 3 + offset) % products.length].id);
      const maxSale = Math.max(Math.floor(product.quantity / 3), 4);
      const quantity = Math.min(3 + ((index + offset) % 6) * 2, maxSale);
      const unitPrice = Number(product.price);
      return {
        product,
        quantity,
        unitPrice,
        lineTotal: Number((quantity * unitPrice).toFixed(2))
      };
    });

    const totalAmount = Number(lineItems.reduce((sum, item) => sum + item.lineTotal, 0).toFixed(2));
    const saleResult = await client.query(
      `
        insert into sales (customer_id, notes, total_amount, created_at)
        values ($1, $2, $3, $4)
        returning id
      `,
      [customerId, `Seed sales batch ${stamp}-${index + 1}`, totalAmount, createdAt]
    );

    const saleId = saleResult.rows[0].id;

    for (const item of lineItems) {
      item.product.quantity -= item.quantity;
      await client.query(
        `
          insert into sale_items (sale_id, product_id, product_name, quantity, unit_price, line_total)
          values ($1, $2, $3, $4, $5, $6)
        `,
        [saleId, item.product.id, item.product.name, item.quantity, item.unitPrice, item.lineTotal]
      );

      await client.query(
        `
          insert into stock_movements (product_id, type, direction, quantity, reference, note, created_at)
          values ($1, 'sale', 'out', $2, $3, $4, $5)
        `,
        [item.product.id, item.quantity, saleId, "Seed sales transaction", createdAt]
      );
    }
  }

  for (let index = 0; index < ADJUSTMENT_COUNT; index += 1) {
    const product = productState.get(products[(index * 5) % products.length].id);
    const type = index % 3 === 0 ? "decrease" : "increase";
    const availableDecrease = Math.max(product.quantity - 2, 1);
    const quantity =
      type === "decrease" ? Math.min(1 + (index % 4), availableDecrease) : 2 + (index % 5);
    const createdAt = formatDate(40 - index, index);

    product.quantity += type === "increase" ? quantity : -quantity;

    const adjustmentResult = await client.query(
      `
        insert into adjustments (product_id, quantity, type, reason, created_at)
        values ($1, $2, $3, $4, $5)
        returning id
      `,
      [product.id, quantity, type, `Seed adjustment ${stamp}-${index + 1}`, createdAt]
    );

    await client.query(
      `
        insert into stock_movements (product_id, type, direction, quantity, reference, note, created_at)
        values ($1, 'adjustment', $2, $3, $4, $5, $6)
      `,
      [
        product.id,
        type === "increase" ? "in" : "out",
        quantity,
        adjustmentResult.rows[0].id,
        `Seed adjustment ${stamp}-${index + 1}`,
        createdAt
      ]
    );
  }

  for (const product of productState.values()) {
    await client.query("update products set quantity = $1 where id = $2", [product.quantity, product.id]);
  }
}

async function main() {
  const pool = getPool();
  const client = await pool.connect();
  const stamp = Date.now().toString().slice(-8);

  try {
    await client.query("begin");
    const { suppliers, customers, products } = await seedBaseTables(client, stamp);
    await seedTransactions(client, stamp, products, suppliers, customers);
    await client.query("commit");
    console.log(`Database seed completed with stamp ${stamp}.`);
  } catch (error) {
    await client.query("rollback");
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch((error) => {
  console.error("Failed to seed database.");
  console.error(error);
  process.exit(1);
});
