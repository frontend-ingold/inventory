const API_BASE_URL = "http://localhost:5000/api";

async function request(path, options = {}) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {})
    },
    ...options
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: "Request failed" }));
    throw new Error(error.message || "Request failed");
  }

  return response.json();
}

export const api = {
  getDashboard: () => request("/dashboard"),
  getProducts: () => request("/products"),
  createProduct: (payload) => request("/products", { method: "POST", body: JSON.stringify(payload) }),
  updateProduct: (id, payload) =>
    request(`/products/${id}`, { method: "PUT", body: JSON.stringify(payload) }),
  deleteProduct: (id) => request(`/products/${id}`, { method: "DELETE" }),

  getCategories: () => request("/categories"),
  createCategory: (payload) => request("/categories", { method: "POST", body: JSON.stringify(payload) }),
  updateCategory: (id, payload) =>
    request(`/categories/${id}`, { method: "PUT", body: JSON.stringify(payload) }),
  deleteCategory: (id) => request(`/categories/${id}`, { method: "DELETE" }),

  getSuppliers: () => request("/suppliers"),
  createSupplier: (payload) => request("/suppliers", { method: "POST", body: JSON.stringify(payload) }),
  updateSupplier: (id, payload) =>
    request(`/suppliers/${id}`, { method: "PUT", body: JSON.stringify(payload) }),
  deleteSupplier: (id) => request(`/suppliers/${id}`, { method: "DELETE" }),

  getCustomers: () => request("/customers"),
  createCustomer: (payload) => request("/customers", { method: "POST", body: JSON.stringify(payload) }),
  updateCustomer: (id, payload) =>
    request(`/customers/${id}`, { method: "PUT", body: JSON.stringify(payload) }),
  deleteCustomer: (id) => request(`/customers/${id}`, { method: "DELETE" }),

  getPurchases: () => request("/purchases"),
  createPurchase: (payload) => request("/purchases", { method: "POST", body: JSON.stringify(payload) }),
  getSales: () => request("/sales"),
  createSale: (payload) => request("/sales", { method: "POST", body: JSON.stringify(payload) }),
  getAdjustments: () => request("/adjustments"),
  createAdjustment: (payload) => request("/adjustments", { method: "POST", body: JSON.stringify(payload) }),
  getStockMovements: () => request("/stock-movements")
};
