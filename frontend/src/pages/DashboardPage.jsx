import { useEffect, useMemo, useState } from "react";
import { SectionHeader } from "../components/SectionHeader";
import { StatCard } from "../components/StatCard";
import { api } from "../services/api";

function buildLinePath(series, width, height) {
  if (!series.length) {
    return "";
  }

  const maxValue = Math.max(...series.map((item) => item.value), 1);

  return series
    .map((item, index) => {
      const x = series.length === 1 ? width / 2 : (index / (series.length - 1)) * width;
      const y = height - (item.value / maxValue) * (height - 36) - 14;
      return `${index === 0 ? "M" : "L"} ${x} ${y}`;
    })
    .join(" ");
}

export function DashboardPage() {
  const [dashboard, setDashboard] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    api
      .getDashboard()
      .then(setDashboard)
      .catch((requestError) => setError(requestError.message));
  }, []);

  const metrics = dashboard?.metrics ?? {
    totalProducts: 0,
    totalCategories: 0,
    totalSuppliers: 0,
    totalCustomers: 0,
    inventoryValue: 0,
    salesTotal: 0,
    purchaseTotal: 0,
    lowStockCount: 0
  };
  const lowStock = dashboard?.lowStock ?? [];
  const recentMovements = dashboard?.recentMovements ?? [];
  const topProducts = dashboard?.topProducts ?? [];

  const movementSeries = useMemo(
    () =>
      [...recentMovements].reverse().map((item, index) => ({
        label: `${item.type.slice(0, 3).toUpperCase()} ${index + 1}`,
        value: Number(item.quantity) || 0,
        direction: item.direction
      })),
    [recentMovements]
  );

  const chartWidth = 320;
  const chartHeight = 180;
  const chartPath = buildLinePath(movementSeries, chartWidth, chartHeight);
  const chartArea = chartPath ? `${chartPath} L ${chartWidth} ${chartHeight} L 0 ${chartHeight} Z` : "";
  const movementMax = Math.max(...movementSeries.map((item) => item.value), 1);
  const stockMax = Math.max(...topProducts.map((item) => Number(item.quantity) || 0), 1);
  const valueMix = [
    { label: "Inventory Value", value: metrics.inventoryValue, colorClass: "teal" },
    { label: "Sales", value: metrics.salesTotal, colorClass: "orange" },
    { label: "Purchases", value: metrics.purchaseTotal, colorClass: "red" }
  ];
  const valueMax = Math.max(...valueMix.map((item) => item.value), 1);

  if (error) {
    return <div className="panel error-panel">{error}</div>;
  }

  if (!dashboard) {
    return <div className="panel">Loading dashboard...</div>;
  }

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
          <div className="panel-heading">
            <div>
              <p className="eyebrow">Graph</p>
              <h3>Stock Value Mix</h3>
            </div>
          </div>
          <div className="mini-bars">
            {valueMix.map((item) => (
              <div key={item.label} className="mini-bar-card">
                <div className="mini-bar-copy">
                  <span>{item.label}</span>
                  <strong>${item.value.toFixed(2)}</strong>
                </div>
                <div className="mini-bar-track">
                  <div
                    className={`mini-bar-fill mini-bar-fill--${item.colorClass}`}
                    style={{ width: `${Math.max((item.value / valueMax) * 100, 8)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="panel">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">Graph</p>
              <h3>Recent Movement Trend</h3>
            </div>
          </div>
          {movementSeries.length ? (
            <div className="movement-chart">
              <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} className="movement-chart__svg">
                <defs>
                  <linearGradient id="movement-gradient" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="rgba(15, 92, 110, 0.42)" />
                    <stop offset="100%" stopColor="rgba(15, 92, 110, 0.04)" />
                  </linearGradient>
                </defs>
                <path d={chartArea} fill="url(#movement-gradient)" />
                <path d={chartPath} fill="none" stroke="#0f5c6e" strokeWidth="3" strokeLinecap="round" />
                {movementSeries.map((item, index) => {
                  const x =
                    movementSeries.length === 1 ? chartWidth / 2 : (index / (movementSeries.length - 1)) * chartWidth;
                  const y = chartHeight - (item.value / movementMax) * (chartHeight - 36) - 14;

                  return (
                    <circle
                      key={`${item.label}-${index}`}
                      cx={x}
                      cy={y}
                      r="5"
                      fill={item.direction === "in" ? "#2f7c53" : "#cb5b2f"}
                    />
                  );
                })}
              </svg>
              <div className="movement-chart__labels">
                {movementSeries.map((item) => (
                  <div key={item.label}>
                    <strong>{item.value}</strong>
                    <span>{item.label}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <p>No stock movement recorded yet.</p>
          )}
        </div>
        <div className="panel">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">Alerts</p>
              <h3>Low Stock Items</h3>
            </div>
          </div>
          {lowStock.length ? (
            <div className="stack-bars">
              {lowStock.map((item) => {
                const reorderLevel = Math.max(Number(item.reorderLevel) || 1, 1);
                const fill = Math.min((Number(item.quantity) / reorderLevel) * 100, 100);

                return (
                  <div key={item.id} className="stack-bar-row">
                    <div className="stack-bar-copy">
                      <strong>{item.name}</strong>
                      <span>
                        {item.quantity} left / reorder {item.reorderLevel}
                      </span>
                    </div>
                    <div className="stack-bar-track">
                      <div className="stack-bar-fill stack-bar-fill--danger" style={{ width: `${fill}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p>No low stock alerts.</p>
          )}
        </div>
        <div className="panel panel--wide">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">Graph</p>
              <h3>Products Needing Attention</h3>
            </div>
          </div>
          <div className="product-bars">
            {topProducts.map((item) => (
              <div key={item.id} className="product-bar-row">
                <div className="product-bar-copy">
                  <strong>{item.name}</strong>
                  <span>
                    {item.quantity} {item.unit}
                  </span>
                </div>
                <div className="product-bar-track">
                  <div
                    className="product-bar-fill"
                    style={{ width: `${Math.max((Number(item.quantity) / stockMax) * 100, 8)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
