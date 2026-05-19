import { useEffect, useState } from "react";
import { DataTable } from "../components/DataTable";
import { FormModal } from "../components/FormModal";
import { SectionHeader } from "../components/SectionHeader";
import { api } from "../services/api";

const emptyForm = { name: "", email: "", phone: "", address: "" };

export function SuppliersPage() {
  const [rows, setRows] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [selectedId, setSelectedId] = useState(null);
  const [open, setOpen] = useState(false);

  const load = () => api.getSuppliers().then(setRows);

  useEffect(() => {
    load();
  }, []);

  const submit = async (event) => {
    event.preventDefault();
    if (selectedId) {
      await api.updateSupplier(selectedId, form);
    } else {
      await api.createSupplier(form);
    }
    setForm(emptyForm);
    setSelectedId(null);
    setOpen(false);
    load();
  };

  return (
    <div className="page-stack">
      <SectionHeader
        title="Suppliers"
        description="Maintain vendor records used in procurement and product sourcing workflows."
        action={<button onClick={() => setOpen(true)}>Add Supplier</button>}
      />
      <DataTable
        columns={[
          { key: "name", label: "Name" },
          { key: "email", label: "Email" },
          { key: "phone", label: "Phone" },
          { key: "address", label: "Address" }
        ]}
        rows={rows}
        emptyMessage="No suppliers found."
        actions={(row) => (
          <>
            <button className="ghost-button" onClick={() => { setSelectedId(row.id); setForm(row); setOpen(true); }}>
              Edit
            </button>
            <button className="danger-button" onClick={() => api.deleteSupplier(row.id).then(load)}>
              Delete
            </button>
          </>
        )}
      />
      <FormModal
        title={selectedId ? "Edit Supplier" : "Add Supplier"}
        open={open}
        onClose={() => setOpen(false)}
        onSubmit={submit}
      >
        <div className="form-grid">
          <label>
            Name
            <input value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} required />
          </label>
          <label>
            Email
            <input value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} />
          </label>
          <label>
            Phone
            <input value={form.phone} onChange={(event) => setForm({ ...form, phone: event.target.value })} />
          </label>
          <label>
            Address
            <textarea value={form.address} onChange={(event) => setForm({ ...form, address: event.target.value })} />
          </label>
        </div>
        <button type="submit">{selectedId ? "Update Supplier" : "Create Supplier"}</button>
      </FormModal>
    </div>
  );
}
