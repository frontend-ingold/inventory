export function FormModal({ title, open, onClose, onSubmit, children }) {
  if (!open) {
    return null;
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-panel" onClick={(event) => event.stopPropagation()}>
        <div className="modal-header">
          <h2>{title}</h2>
          <button type="button" className="ghost-button" onClick={onClose}>
            Close
          </button>
        </div>
        <form onSubmit={onSubmit} className="modal-form">
          {children}
        </form>
      </div>
    </div>
  );
}
