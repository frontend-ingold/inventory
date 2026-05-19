import { HttpError } from "../utils/httpError.js";
import { createId } from "../utils/id.js";

const collections = {
  categories: "cat",
  suppliers: "sup",
  customers: "cus",
  products: "prd",
  purchases: "pur",
  sales: "sal",
  adjustments: "adj"
};

export class InventoryService {
  constructor(repository) {
    this.repository = repository;
  }

  async list(collection) {
    const store = await this.repository.read();
    return store[collection];
  }

  async createEntity(collection, payload) {
    const store = await this.repository.read();
    const item = {
      id: createId(collections[collection]),
      ...payload
    };

    if (collection === "products") {
      item.createdAt = new Date().toISOString();
    }

    store[collection].unshift(item);
    await this.repository.write(store);
    return item;
  }

  async updateEntity(collection, id, payload) {
    const store = await this.repository.read();
    const index = store[collection].findIndex((item) => item.id === id);

    if (index === -1) {
      throw new HttpError(404, `${collection.slice(0, -1)} not found`);
    }

    store[collection][index] = {
      ...store[collection][index],
      ...payload,
      id
    };

    await this.repository.write(store);
    return store[collection][index];
  }

  async deleteEntity(collection, id) {
    const store = await this.repository.read();
    const index = store[collection].findIndex((item) => item.id === id);

    if (index === -1) {
      throw new HttpError(404, `${collection.slice(0, -1)} not found`);
    }

    const [removed] = store[collection].splice(index, 1);
    await this.repository.write(store);
    return removed;
  }

  async createPurchase(payload) {
    return this.#createTransaction("purchase", payload);
  }

  async createSale(payload) {
    return this.#createTransaction("sale", payload);
  }

  async createAdjustment(payload) {
    const store = await this.repository.read();
    const product = store.products.find((item) => item.id === payload.productId);

    if (!product) {
      throw new HttpError(400, "Product does not exist");
    }

    const quantity = Number(payload.quantity);
    const type = payload.type === "decrease" ? "decrease" : "increase";

    if (type === "decrease" && product.quantity < quantity) {
      throw new HttpError(400, "Adjustment exceeds available stock");
    }

    product.quantity += type === "increase" ? quantity : -quantity;

    const adjustment = {
      id: createId("adj"),
      productId: payload.productId,
      quantity,
      type,
      reason: payload.reason || "",
      createdAt: new Date().toISOString()
    };

    store.adjustments.unshift(adjustment);
    store.stockMovements.unshift({
      id: createId("mov"),
      productId: payload.productId,
      type: "adjustment",
      direction: type === "increase" ? "in" : "out",
      quantity,
      reference: adjustment.id,
      note: payload.reason || "Manual stock adjustment",
      createdAt: adjustment.createdAt
    });

    await this.repository.write(store);
    return adjustment;
  }

  async getDashboard() {
    const store = await this.repository.read();
    const inventoryValue = store.products.reduce(
      (sum, item) => sum + Number(item.quantity) * Number(item.costPrice),
      0
    );
    const lowStock = store.products.filter(
      (item) => Number(item.quantity) <= Number(item.reorderLevel)
    );
    const salesTotal = store.sales.reduce((sum, sale) => sum + Number(sale.totalAmount), 0);
    const purchaseTotal = store.purchases.reduce(
      (sum, purchase) => sum + Number(purchase.totalAmount),
      0
    );

    return {
      metrics: {
        totalProducts: store.products.length,
        totalCategories: store.categories.length,
        totalSuppliers: store.suppliers.length,
        totalCustomers: store.customers.length,
        inventoryValue,
        salesTotal,
        purchaseTotal,
        lowStockCount: lowStock.length
      },
      lowStock,
      recentMovements: store.stockMovements.slice(0, 8),
      topProducts: [...store.products]
        .sort((a, b) => Number(a.quantity) - Number(b.quantity))
        .slice(0, 5)
    };
  }

  async #createTransaction(kind, payload) {
    const store = await this.repository.read();
    const items = payload.items || [];

    if (!items.length) {
      throw new HttpError(400, "At least one item is required");
    }

    let totalAmount = 0;

    const normalizedItems = items.map((item) => {
      const product = store.products.find((entry) => entry.id === item.productId);

      if (!product) {
        throw new HttpError(400, "Transaction contains an invalid product");
      }

      const quantity = Number(item.quantity);
      const unitPrice = Number(item.unitPrice ?? (kind === "sale" ? product.price : product.costPrice));

      if (kind === "sale" && product.quantity < quantity) {
        throw new HttpError(400, `Insufficient stock for ${product.name}`);
      }

      totalAmount += quantity * unitPrice;

      return {
        productId: product.id,
        productName: product.name,
        quantity,
        unitPrice,
        lineTotal: quantity * unitPrice
      };
    });

    const entity = {
      id: createId(kind === "sale" ? "sal" : "pur"),
      supplierId: payload.supplierId || null,
      customerId: payload.customerId || null,
      notes: payload.notes || "",
      items: normalizedItems,
      totalAmount,
      createdAt: new Date().toISOString()
    };

    normalizedItems.forEach((item) => {
      const product = store.products.find((entry) => entry.id === item.productId);
      product.quantity += kind === "purchase" ? item.quantity : -item.quantity;
      store.stockMovements.unshift({
        id: createId("mov"),
        productId: item.productId,
        type: kind,
        direction: kind === "purchase" ? "in" : "out",
        quantity: item.quantity,
        reference: entity.id,
        note: `${kind === "purchase" ? "Purchase" : "Sale"} transaction`,
        createdAt: entity.createdAt
      });
    });

    store[kind === "purchase" ? "purchases" : "sales"].unshift(entity);
    await this.repository.write(store);
    return entity;
  }
}
