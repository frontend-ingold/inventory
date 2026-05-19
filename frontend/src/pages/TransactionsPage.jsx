import { useEffect, useState } from "react";
import { DataTable } from "../components/DataTable";
import { SectionHeader } from "../components/SectionHeader";
import { api } from "../services/api";

const purchaseForm = {
  supplierId: "",
  productId: "",
  quantity: 1,
  unitPrice: 0,
  notes: ""
};

const saleForm = {
  customerId: "",
  productId: "",
  quantity: 1,
  unitPrice: 0,
  notes: ""
};

export function TransactionsPage() {
  const [products, setProducts] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [purchases, setPurchases] = useState([]);
  const [sales, setSales] = useState([]);
  const [purchaseState, setPurchaseState] = useState(purchaseForm);
  const [saleState, setSaleState] = useState(saleForm);
  const [error, setError] = useState("");

  const load = () =>
    Promise.all([
      api.getProducts(),
      api.getSuppliers(),
      api.getCustomers(),
      api.getPurchases(),
      api.getSales()
    ])
      .then(([productData, supplierData, customerData, purchaseData, saleData]) => {
        setProducts(productData);
        setSuppliers(supplierData);
        setCustomers(customerData);
        setPurchases(purchaseData);
        setSales(saleData);
        setError("");
      })
      .catch((requestError) => setError(requestError.message));

  useEffect(() => {
    load();
  }, []);

  const submitPurchase = async (event) => {
    event.preventDefault();
    await api.createPurchase({
      supplierId: purchaseState.supplierId,
      notes: purchaseState.notes,
      items: [
        {
          productId: purchaseState.productId,
          quantity: Number(purchaseState.quantity),
          unitPrice: Number(purchaseState.unitPrice)
        }
      ]
    });
    setPurchaseState(purchaseForm);
    load();
  };

  const submitSale = async (event) => {
    event.preventDefault();
    await api.createSale({
      customerId: saleState.customerId,
      notes: saleState.notes,
      items: [
        {
          productId: saleState.productId,
          quantity: Number(saleState.quantity),
          unitPrice: Number(saleState.unitPrice)
        }
      ]
    });
    setSaleState(saleForm);
    load();
  };

  return (
    <div className="page-stack">
      <SectionHeader
        title="Transactions"
        description="Register stock-in purchases and stock-out sales while keeping product quantities in sync."
      />
      {error ? <div className="panel error-panel">{error}</div> : null}
      <div className="dashboard-grid">
        <div className="panel">
          <h3>Create Purchase</h3>
          <form className="stack-form" onSubmit={submitPurchase}>
            <select
              value={purchaseState.supplierId}
              onChange={(event) => setPurchaseState({ ...purchaseState, supplierId: event.target.value })}
              required
            >
              <option value="">Select supplier</option>
              {suppliers.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
            </select>
            <select
              value={purchaseState.productId}
              onChange={(event) => setPurchaseState({ ...purchaseState, productId: event.target.value })}
              required
            >
              <option value="">Select product</option>
              {products.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
            </select>
            <input
              type="number"
              min="1"
              value={purchaseState.quantity}
              onChange={(event) => setPurchaseState({ ...purchaseState, quantity: event.target.value })}
              placeholder="Quantity"
            />
            <input
              type="number"
              min="0"
              step="0.01"
              value={purchaseState.unitPrice}
              onChange={(event) => setPurchaseState({ ...purchaseState, unitPrice: event.target.value })}
              placeholder="Unit price"
            />
            <textarea
              value={purchaseState.notes}
              onChange={(event) => setPurchaseState({ ...purchaseState, notes: event.target.value })}
              placeholder="Notes"
            />
            <button type="submit">Record Purchase</button>
          </form>
        </div>
        <div className="panel">
          <h3>Create Sale</h3>
          <form className="stack-form" onSubmit={submitSale}>
            <select
              value={saleState.customerId}
              onChange={(event) => setSaleState({ ...saleState, customerId: event.target.value })}
              required
            >
              <option value="">Select customer</option>
              {customers.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
            </select>
            <select
              value={saleState.productId}
              onChange={(event) => setSaleState({ ...saleState, productId: event.target.value })}
              required
            >
              <option value="">Select product</option>
              {products.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
            </select>
            <input
              type="number"
              min="1"
              value={saleState.quantity}
              onChange={(event) => setSaleState({ ...saleState, quantity: event.target.value })}
              placeholder="Quantity"
            />
            <input
              type="number"
              min="0"
              step="0.01"
              value={saleState.unitPrice}
              onChange={(event) => setSaleState({ ...saleState, unitPrice: event.target.value })}
              placeholder="Unit price"
            />
            <textarea
              value={saleState.notes}
              onChange={(event) => setSaleState({ ...saleState, notes: event.target.value })}
              placeholder="Notes"
            />
            <button type="submit">Record Sale</button>
          </form>
        </div>
      </div>
      <div className="panel">
        <h3>Purchases</h3>
        <DataTable
          columns={[
            { key: "id", label: "Reference" },
            { key: "totalAmount", label: "Amount", render: (row) => `$${Number(row.totalAmount).toFixed(2)}` },
            { key: "createdAt", label: "Created", render: (row) => new Date(row.createdAt).toLocaleString() }
          ]}
          rows={purchases}
          emptyMessage="No purchase transactions recorded."
        />
      </div>
      <div className="panel">
        <h3>Sales</h3>
        <DataTable
          columns={[
            { key: "id", label: "Reference" },
            { key: "totalAmount", label: "Amount", render: (row) => `$${Number(row.totalAmount).toFixed(2)}` },
            { key: "createdAt", label: "Created", render: (row) => new Date(row.createdAt).toLocaleString() }
          ]}
          rows={sales}
          emptyMessage="No sale transactions recorded."
        />
      </div>
    </div>
  );
}
