import { useEffect, useMemo, useState } from "react";
import { DataTable } from "../components/DataTable";
import { FormModal } from "../components/FormModal";
import { SectionHeader } from "../components/SectionHeader";
import { api } from "../services/api";

const initialForm = {
  sku: "",
  name: "",
  categoryId: "",
  supplierId: "",
  unit: "pcs",
  price: 0,
  costPrice: 0,
  quantity: 0,
  reorderLevel: 0,
  status: "active",
  description: ""
};

export function ProductsPage() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [form, setForm] = useState(initialForm);
  const [selectedId, setSelectedId] = useState(null);
  const [open, setOpen] = useState(false);
  const [error, setError] = useState("");

  const load = () =>
    Promise.all([api.getProducts(), api.getCategories(), api.getSuppliers()])
      .then(([productData, categoryData, supplierData]) => {
        setProducts(productData);
        setCategories(categoryData);
        setSuppliers(supplierData);
        setError("");
      })
      .catch((requestError) => setError(requestError.message));

  useEffect(() => {
    load();
  }, []);

  const categoryMap = useMemo(
    () => Object.fromEntries(categories.map((category) => [category.id, category.name])),
    [categories]
  );
  const supplierMap = useMemo(
    () => Object.fromEntries(suppliers.map((supplier) => [supplier.id, supplier.name])),
    [suppliers]
  );

  const openCreate = () => {
    setSelectedId(null);
    setForm(initialForm);
    setOpen(true);
  };

  const openEdit = (product) => {
    setSelectedId(product.id);
    setForm(product);
    setOpen(true);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const payload = {
      ...form,
      price: Number(form.price),
      costPrice: Number(form.costPrice),
      quantity: Number(form.quantity),
      reorderLevel: Number(form.reorderLevel)
    };

    try {
      if (selectedId) {
        await api.updateProduct(selectedId, payload);
      } else {
        await api.createProduct(payload);
      }
      setOpen(false);
      setForm(initialForm);
      load();
    } catch (requestError) {
      setError(requestError.message);
    }
  };

  const handleDelete = async (id) => {
    await api.deleteProduct(id);
    load();
  };

  return (
    <div className="page-stack">
      <SectionHeader
        title="Products"
        description="Manage SKUs, pricing, stock levels, reorder points, and supplier/category assignment."
        action={<button onClick={openCreate}>Add Product</button>}
      />
      {error ? <div className="panel error-panel">{error}</div> : null}
      <DataTable
        columns={[
          { key: "sku", label: "SKU" },
          { key: "name", label: "Name" },
          { key: "categoryId", label: "Category", render: (row) => categoryMap[row.categoryId] || "-" },
          { key: "supplierId", label: "Supplier", render: (row) => supplierMap[row.supplierId] || "-" },
          { key: "quantity", label: "Qty" },
          { key: "price", label: "Price", render: (row) => `$${Number(row.price).toFixed(2)}` }
        ]}
        rows={products}
        emptyMessage="No products found."
        actions={(row) => (
          <>
            <button className="ghost-button" onClick={() => openEdit(row)}>
              Edit
            </button>
            <button className="danger-button" onClick={() => handleDelete(row.id)}>
              Delete
            </button>
          </>
        )}
      />
      <FormModal
        title={selectedId ? "Edit Product" : "Add Product"}
        open={open}
        onClose={() => setOpen(false)}
        onSubmit={handleSubmit}
      >
        <div className="form-grid">
          <label>
            SKU
            <input value={form.sku} onChange={(event) => setForm({ ...form, sku: event.target.value })} required />
          </label>
          <label>
            Name
            <input value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} required />
          </label>
          <label>
            Category
            <select
              value={form.categoryId}
              onChange={(event) => setForm({ ...form, categoryId: event.target.value })}
              required
            >
              <option value="">Select category</option>
              {categories.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
            </select>
          </label>
          <label>
            Supplier
            <select
              value={form.supplierId}
              onChange={(event) => setForm({ ...form, supplierId: event.target.value })}
              required
            >
              <option value="">Select supplier</option>
              {suppliers.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
            </select>
          </label>
          <label>
            Unit
            <input value={form.unit} onChange={(event) => setForm({ ...form, unit: event.target.value })} />
          </label>
          <label>
            Status
            <select value={form.status} onChange={(event) => setForm({ ...form, status: event.target.value })}>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </label>
          <label>
            Price
            <input
              type="number"
              min="0"
              step="0.01"
              value={form.price}
              onChange={(event) => setForm({ ...form, price: event.target.value })}
            />
          </label>
          <label>
            Cost Price
            <input
              type="number"
              min="0"
              step="0.01"
              value={form.costPrice}
              onChange={(event) => setForm({ ...form, costPrice: event.target.value })}
            />
          </label>
          <label>
            Quantity
            <input
              type="number"
              min="0"
              value={form.quantity}
              onChange={(event) => setForm({ ...form, quantity: event.target.value })}
            />
          </label>
          <label>
            Reorder Level
            <input
              type="number"
              min="0"
              value={form.reorderLevel}
              onChange={(event) => setForm({ ...form, reorderLevel: event.target.value })}
            />
          </label>
          <label className="full-span">
            Description
            <textarea
              value={form.description}
              onChange={(event) => setForm({ ...form, description: event.target.value })}
            />
          </label>
        </div>
        <button type="submit">{selectedId ? "Update Product" : "Create Product"}</button>
      </FormModal>
    </div>
  );
}
