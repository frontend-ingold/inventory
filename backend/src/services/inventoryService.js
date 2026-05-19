import { createId } from "../utils/id.js";
import { comparePassword, createAuthToken } from "../utils/auth.js";
import { HttpError } from "../utils/httpError.js";

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
    return this.repository.list(collection);
  }

  async createEntity(collection, payload) {
    const item = {
      id: createId(collections[collection]),
      ...payload
    };

    if (collection === "products") {
      item.createdAt = new Date().toISOString();
    }

    return this.repository.createEntity(collection, item);
  }

  async updateEntity(collection, id, payload) {
    return this.repository.updateEntity(collection, id, {
      ...payload,
      id
    });
  }

  async deleteEntity(collection, id) {
    return this.repository.deleteEntity(collection, id);
  }

  async createPurchase(payload) {
    return this.repository.createPurchase(payload);
  }

  async createSale(payload) {
    return this.repository.createSale(payload);
  }

  async createAdjustment(payload) {
    return this.repository.createAdjustment(payload);
  }

  async getDashboard() {
    return this.repository.getDashboard();
  }

  async login(payload) {
    const email = payload?.email?.trim().toLowerCase();
    const password = payload?.password || "";

    if (!email || !password) {
      throw new HttpError(400, "Email and password are required");
    }

    const user = await this.repository.getUserByEmail(email);

    if (!user || !user.isActive) {
      throw new HttpError(401, "Invalid email or password");
    }

    const matches = await comparePassword(password, user.passwordHash);

    if (!matches) {
      throw new HttpError(401, "Invalid email or password");
    }

    const safeUser = this.#sanitizeUser(user);

    return {
      token: createAuthToken(safeUser),
      user: safeUser
    };
  }

  async getCurrentUser(userId) {
    if (!userId) {
      throw new HttpError(401, "Authentication required");
    }

    const user = await this.repository.getUserById(userId);

    if (!user || !user.isActive) {
      throw new HttpError(401, "User not available");
    }

    return this.#sanitizeUser(user);
  }

  #sanitizeUser(user) {
    return {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role
    };
  }
}
