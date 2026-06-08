/**
 * pages/CustomersPage.jsx
 * Full CRUD page for customers with:
 *   - Live search (by name, email, phone)
 *   - Mobile card view
 *   - Toast notifications
 *   - ConfirmDialog for delete
 *   - Inline field validation errors
 *   - EmptyState when no results
 * Uses:
 *   - useFetch()  — loads customers list
 *   - useUser()   — checks role (staff can create/edit, admin can delete)
 *   - useToast()  — success/error notifications
 *
 * NOTE: Field component is defined OUTSIDE the page component intentionally.
 * Defining it inside caused React to remount the input on every keystroke
 * (losing focus after each character). Moving it outside fixes this.
 */

import { useState, useMemo } from "react";
import { useFetch } from "../hooks/useFetch.js";
import { useUser } from "../components/AuthContext.jsx";
import { useToast } from "../components/ToastContext.jsx";
import Modal from "../components/Modal.jsx";
import ConfirmDialog from "../components/ConfirmDialog.jsx";
import SearchBar from "../components/SearchBar.jsx";
import EmptyState from "../components/EmptyState.jsx";
import api from "../api/index.js";

const EMPTY = { firstname: "", lastname: "", email: "", phonenumber: "", status: "active" };

const statusStyle = {
  active:   "bg-green-100 text-green-700",
  inactive: "bg-yellow-100 text-yellow-700",
  blocked:  "bg-red-100 text-red-700",
};

// Defined outside — stable component reference across renders, no remounting
function Field({ label, fkey, type = "text", value, error, onChange }) {
  return (
    <div>
      <label className="block text-xs font-medium text-gray-700 mb-1">{label}</label>
      <input
        type={type}
        className={`w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 ${error ? "border-red-400" : "border-gray-200"}`}
        value={value}
        onChange={onChange}
      />
      {error && <p className="text-red-500 text-xs mt-0.5">{error}</p>}
    </div>
  );
}

export default function CustomersPage() {
  const { user } = useUser();
  const { toast } = useToast();
  const { data: customers, refetch } = useFetch("/customers");
  const [modal, setModal]         = useState(false);
  const [form, setForm]           = useState(EMPTY);
  const [editId, setEditId]       = useState(null);
  const [errors, setErrors]       = useState({});
  const [confirmId, setConfirmId] = useState(null);
  const [search, setSearch]       = useState("");

  const isAdmin = user?.role === "admin";

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return customers.filter((c) =>
      c.firstname.toLowerCase().includes(q) ||
      c.lastname.toLowerCase().includes(q) ||
      c.email.toLowerCase().includes(q) ||
      c.phonenumber.includes(q)
    );
  }, [customers, search]);

  const set = (key) => (e) => {
    setForm((prev) => ({ ...prev, [key]: e.target.value }));
    setErrors((prev) => ({ ...prev, [key]: "" }));
  };

  const validate = () => {
    const e = {};
    if (!form.firstname)   e.firstname   = "Required";
    if (!form.lastname)    e.lastname    = "Required";
    if (!form.email)       e.email       = "Required";
    if (!form.phonenumber) e.phonenumber = "Required";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const openCreate = () => { setForm(EMPTY); setEditId(null); setErrors({}); setModal(true); };
  const openEdit   = (c) => { setForm({ ...c }); setEditId(c.id); setErrors({}); setModal(true); };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    try {
      if (editId) await api.put(`/customers/${editId}`, form);
      else        await api.post("/customers", form);
      setModal(false);
      refetch();
      toast(editId ? "Customer updated." : "Customer added.", "success");
    } catch (err) {
      toast(err.response?.data?.message || "Save failed.", "error");
    }
  };

  const handleDelete = async () => {
    try {
      await api.delete(`/customers/${confirmId}`);
      setConfirmId(null);
      refetch();
      toast("Customer deleted.", "success");
    } catch {
      toast("Delete failed.", "error");
    }
  };

  return (
    <div className="p-4 sm:p-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
        <div>
          <h1 className="text-xl font-bold text-gray-800">Customers</h1>
          <p className="text-gray-400 text-xs mt-0.5">{customers.length} total customers</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <SearchBar value={search} onChange={setSearch} placeholder="Search customers..." />
          <button onClick={openCreate} className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-green-700 whitespace-nowrap">
            + Add Customer
          </button>
        </div>
      </div>

      {/* Desktop table */}
      <div className="hidden md:block bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full text-sm text-left">
          <thead className="bg-gray-50 text-gray-500 uppercase text-xs border-b border-gray-100">
            <tr>
              {["Name", "Email", "Phone", "Status", "Registered By", "Actions"].map((h) => (
                <th key={h} className="px-4 py-3 font-medium">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {filtered.map((c) => (
              <tr key={c.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-4 py-3 font-medium">{c.firstname} {c.lastname}</td>
                <td className="px-4 py-3 text-gray-500">{c.email}</td>
                <td className="px-4 py-3">{c.phonenumber}</td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-1 rounded-full text-xs font-semibold ${statusStyle[c.status]}`}>{c.status}</span>
                </td>
                <td className="px-4 py-3 text-gray-500">{c.registered_by_username}</td>
                <td className="px-4 py-3">
                  <div className="flex gap-3">
                    <button onClick={() => openEdit(c)} className="text-blue-600 hover:underline text-xs font-medium">Edit</button>
                    {isAdmin && <button onClick={() => setConfirmId(c.id)} className="text-red-500 hover:underline text-xs font-medium">Delete</button>}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && <EmptyState message="No customers found" sub={search ? "Try a different search term" : "Add your first customer"} />}
      </div>

      {/* Mobile cards */}
      <div className="md:hidden space-y-3">
        {filtered.length === 0 && <EmptyState message="No customers found" sub={search ? "Try a different search" : "Add your first customer"} />}
        {filtered.map((c) => (
          <div key={c.id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
            <div className="flex items-start justify-between mb-2">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center text-green-700 font-bold text-sm uppercase">
                  {c.firstname[0]}
                </div>
                <div>
                  <p className="font-semibold text-gray-800 text-sm">{c.firstname} {c.lastname}</p>
                  <p className="text-xs text-gray-400">{c.email}</p>
                </div>
              </div>
              <span className={`px-2 py-1 rounded-full text-xs font-semibold ${statusStyle[c.status]}`}>{c.status}</span>
            </div>
            <div className="text-sm text-gray-600 mb-3">
              <span className="text-gray-400 text-xs">Phone: </span>{c.phonenumber}
            </div>
            <div className="flex gap-3 border-t border-gray-50 pt-3">
              <button onClick={() => openEdit(c)} className="text-blue-600 text-sm font-medium hover:underline">Edit</button>
              {isAdmin && <button onClick={() => setConfirmId(c.id)} className="text-red-500 text-sm font-medium hover:underline">Delete</button>}
            </div>
          </div>
        ))}
      </div>

      {/* Form modal */}
      {modal && (
        <Modal title={editId ? "Edit Customer" : "Add Customer"} onClose={() => setModal(false)}>
          <form onSubmit={handleSubmit} className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <Field label="First Name"   fkey="firstname"   value={form.firstname}   error={errors.firstname}   onChange={set("firstname")} />
              <Field label="Last Name"    fkey="lastname"    value={form.lastname}    error={errors.lastname}    onChange={set("lastname")} />
            </div>
            <Field label="Email"        fkey="email"       type="email" value={form.email}       error={errors.email}       onChange={set("email")} />
            <Field label="Phone Number" fkey="phonenumber" value={form.phonenumber} error={errors.phonenumber} onChange={set("phonenumber")} />
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Status</label>
              <select className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" value={form.status} onChange={set("status")}>
                {["active", "inactive", "blocked"].map((s) => <option key={s}>{s}</option>)}
              </select>
            </div>
            <button type="submit" className="w-full bg-green-600 text-white py-2.5 rounded-lg font-semibold hover:bg-green-700 mt-1">
              Save Customer
            </button>
          </form>
        </Modal>
      )}

      {confirmId && (
        <ConfirmDialog
          message="This customer and all their interests will be permanently deleted."
          onConfirm={handleDelete}
          onCancel={() => setConfirmId(null)}
        />
      )}
    </div>
  );
}
