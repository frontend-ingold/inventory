export function StatCard({ label, value, accent }) {
  return (
    <div className={`stat-card stat-card--${accent || "blue"}`}>
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}
