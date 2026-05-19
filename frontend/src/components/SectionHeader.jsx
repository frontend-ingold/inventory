export function SectionHeader({ title, description, action }) {
  return (
    <div className="section-header">
      <div>
        <p className="eyebrow">Operations</p>
        <h1>{title}</h1>
        <p className="section-description">{description}</p>
      </div>
      {action ? <div className="section-action">{action}</div> : null}
    </div>
  );
}
