import { useEffect, useState } from "react";
import { DataTable } from "../components/DataTable";
import { SectionHeader } from "../components/SectionHeader";
import { api } from "../services/api";

const adjustmentForm = {
  productId: "",
  quantity: 1,
  type: "increase",
  reason: ""
};

export function StockPage() {
  const [products, setProducts] = useState([]);
  const [movements, setMovements] = useState([]);
  const [form, setForm] = useState(adjustmentForm);

  const load = () =>
    Promise.all([api.getProducts(), api.getStockMovements()]).then(([productData, movementData]) => {
      setProducts(productData);
      setMovements(movementData);
    });

  useEffect(() => {
    load();
  }, []);

  const submit = async (event) => {
    event.preventDefault();
    await api.createAdjustment({
      ...form,
      quantity: Number(form.quantity)
    });
    setForm(adjustmentForm);
    load();
  };

  return (
    <div className="page-stack">
      <SectionHeader
        title="Stock Control"
        description="Run manual adjustments and inspect the movement history across purchases, sales, and corrections."
      />
      <div className="dashboard-grid">
        <div className="panel">
          <h3>Manual Adjustment</h3>
          <form className="stack-form" onSubmit={submit}>
            <select
              value={form.productId}
              onChange={(event) => setForm({ ...form, productId: event.target.value })}
              required
            >
              <option value="">Select product</option>
              {products.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
            </select>
            <select value={form.type} onChange={(event) => setForm({ ...form, type: event.target.value })}>
              <option value="increase">Increase</option>
              <option value="decrease">Decrease</option>
            </select>
            <input
              type="number"
              min="1"
              value={form.quantity}
              onChange={(event) => setForm({ ...form, quantity: event.target.value })}
            />
            <textarea
              value={form.reason}
              onChange={(event) => setForm({ ...form, reason: event.target.value })}
              placeholder="Reason"
            />
            <button type="submit">Apply Adjustment</button>
          </form>
        </div>
        <div className="panel">
          <h3>Current Stock Snapshot</h3>
          <div className="chip-row">
            {products.map((item) => (
              <span className="chip" key={item.id}>
                {item.name} · {item.quantity} {item.unit}
              </span>
            ))}
          </div>
        </div>
      </div>
      <div className="panel">
        <h3>Movement History</h3>
        <DataTable
          columns={[
            { key: "type", label: "Type" },
            { key: "direction", label: "Direction" },
            { key: "quantity", label: "Quantity" },
            { key: "reference", label: "Reference" },
            { key: "note", label: "Note" },
            { key: "createdAt", label: "Created", render: (row) => new Date(row.createdAt).toLocaleString() }
          ]}
          rows={movements}
          emptyMessage="No stock movements found."
        />
      </div>
    </div>
  );
}
