import { useEffect, useState } from "react";
import { SectionHeader } from "../components/SectionHeader";
import { StatCard } from "../components/StatCard";
import { api } from "../services/api";

export function DashboardPage() {
  const [dashboard, setDashboard] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    api
      .getDashboard()
      .then(setDashboard)
      .catch((requestError) => setError(requestError.message));
  }, []);

  if (error) {
    return <div className="panel error-panel">{error}</div>;
  }

  if (!dashboard) {
    return <div className="panel">Loading dashboard...</div>;
  }

  const { metrics, lowStock, recentMovements, topProducts } = dashboard;

  return (
    <div className="page-stack">
      <SectionHeader
        title="Dashboard"
        description="Operational snapshot of your inventory levels, stock exposure, and transaction activity."
      />
      <div className="stats-grid">
        <StatCard label="Products" value={metrics.totalProducts} accent="blue" />
        <StatCard label="Categories" value={metrics.totalCategories} accent="orange" />
        <StatCard label="Suppliers" value={metrics.totalSuppliers} accent="green" />
        <StatCard label="Customers" value={metrics.totalCustomers} accent="red" />
        <StatCard label="Inventory Value" value={`$${metrics.inventoryValue.toFixed(2)}`} accent="green" />
        <StatCard label="Low Stock" value={metrics.lowStockCount} accent="red" />
      </div>
      <div className="dashboard-grid">
        <div className="panel">
          <h3>Low Stock Items</h3>
          {lowStock.length ? (
            <ul className="list">
              {lowStock.map((item) => (
                <li key={item.id}>
                  <strong>{item.name}</strong>
                  <span>{item.quantity} left</span>
                </li>
              ))}
            </ul>
          ) : (
            <p>No low stock alerts.</p>
          )}
        </div>
        <div className="panel">
          <h3>Recent Movements</h3>
          {recentMovements.length ? (
            <ul className="list">
              {recentMovements.map((item) => (
                <li key={item.id}>
                  <strong>{item.type}</strong>
                  <span>
                    {item.direction} {item.quantity}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p>No stock movement recorded yet.</p>
          )}
        </div>
        <div className="panel panel--wide">
          <h3>Products Needing Attention</h3>
          <div className="chip-row">
            {topProducts.map((item) => (
              <span key={item.id} className="chip">
                {item.name} · {item.quantity}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
