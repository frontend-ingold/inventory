import { useEffect, useState } from "react";
import { DataTable } from "../components/DataTable";
import { FormModal } from "../components/FormModal";
import { SectionHeader } from "../components/SectionHeader";
import { api } from "../services/api";

const emptyForm = { name: "", description: "" };

export function CategoriesPage() {
  const [rows, setRows] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [selectedId, setSelectedId] = useState(null);
  const [open, setOpen] = useState(false);

  const load = () => api.getCategories().then(setRows);

  useEffect(() => {
    load();
  }, []);

  const submit = async (event) => {
    event.preventDefault();
    if (selectedId) {
      await api.updateCategory(selectedId, form);
    } else {
      await api.createCategory(form);
    }
    setForm(emptyForm);
    setSelectedId(null);
    setOpen(false);
    load();
  };

  return (
    <div className="page-stack">
      <SectionHeader
        title="Categories"
        description="Define product groupings to keep stock organized and easier to report on."
        action={<button onClick={() => setOpen(true)}>Add Category</button>}
      />
      <DataTable
        columns={[
          { key: "name", label: "Name" },
          { key: "description", label: "Description" }
        ]}
        rows={rows}
        emptyMessage="No categories found."
        actions={(row) => (
          <>
            <button className="ghost-button" onClick={() => { setSelectedId(row.id); setForm(row); setOpen(true); }}>
              Edit
            </button>
            <button className="danger-button" onClick={() => api.deleteCategory(row.id).then(load)}>
              Delete
            </button>
          </>
        )}
      />
      <FormModal
        title={selectedId ? "Edit Category" : "Add Category"}
        open={open}
        onClose={() => setOpen(false)}
        onSubmit={submit}
      >
        <label>
          Name
          <input value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} required />
        </label>
        <label>
          Description
          <textarea
            value={form.description}
            onChange={(event) => setForm({ ...form, description: event.target.value })}
          />
        </label>
        <button type="submit">{selectedId ? "Update Category" : "Create Category"}</button>
      </FormModal>
    </div>
  );
}
