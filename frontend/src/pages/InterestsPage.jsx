/**
 * pages/InterestsPage.jsx
 * Manages customer interests in vehicles.
 * Features:
 *   - Live search (by customer name or vehicle)
 *   - Mobile card view
 *   - Toast notifications
 *   - ConfirmDialog for delete
 *   - EmptyState
 * Uses:
 *   - useFetch()  — interests, customers, vehicles lists
 *   - useUser()   — admin can delete, all can add
 *   - useToast()  — notifications
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

export default function InterestsPage() {
  const { user } = useUser();
  const { toast } = useToast();
  const { data: interests, refetch } = useFetch("/interests");
  const { data: customers } = useFetch("/customers");
  const { data: vehicles }  = useFetch("/vehicles");
  const [modal, setModal]         = useState(false);
  const [form, setForm]           = useState({ customer_id: "", vehicle_id: "" });
  const [errors, setErrors]       = useState({});
  const [confirmId, setConfirmId] = useState(null);
  const [search, setSearch]       = useState("");

  const isAdmin = user?.role === "admin";

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return interests.filter((i) =>
      i.firstname.toLowerCase().includes(q) ||
      i.lastname.toLowerCase().includes(q) ||
      i.brand.toLowerCase().includes(q) ||
      i.model.toLowerCase().includes(q)
    );
  }, [interests, search]);

  const validate = () => {
    const e = {};
    if (!form.customer_id) e.customer_id = "Select a customer";
    if (!form.vehicle_id)  e.vehicle_id  = "Select a vehicle";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    try {
      await api.post("/interests", form);
      setModal(false); refetch();
      toast("Interest recorded.", "success");
    } catch (err) {
      toast(err.response?.data?.message || "Failed to add interest.", "error");
    }
  };

  const handleDelete = async () => {
    try {
      await api.delete(`/interests/${confirmId}`);
      setConfirmId(null); refetch();
      toast("Interest removed.", "success");
    } catch {
      toast("Delete failed.", "error");
    }
  };

  return (
    <div className="p-4 sm:p-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
        <div>
          <h1 className="text-xl font-bold text-gray-800">Customer Interests</h1>
          <p className="text-gray-400 text-xs mt-0.5">{interests.length} interests recorded</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <SearchBar value={search} onChange={setSearch} placeholder="Search interests..." />
          <button
            onClick={() => { setForm({ customer_id: "", vehicle_id: "" }); setErrors({}); setModal(true); }}
            className="bg-orange-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-orange-700 whitespace-nowrap"
          >
            + Add Interest
          </button>
        </div>
      </div>

      {/* Desktop table */}
      <div className="hidden md:block bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full text-sm text-left">
          <thead className="bg-gray-50 text-gray-500 uppercase text-xs border-b border-gray-100">
            <tr>
              {["Customer", "Email", "Vehicle", "Plate Number", isAdmin ? "Action" : ""].map((h) => (
                <th key={h} className="px-4 py-3 font-medium">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {filtered.map((i) => (
              <tr key={i.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-4 py-3 font-medium">{i.firstname} {i.lastname}</td>
                <td className="px-4 py-3 text-gray-500">{i.email}</td>
                <td className="px-4 py-3">{i.brand} {i.model}</td>
                <td className="px-4 py-3 font-mono text-xs">{i.plate_number}</td>
                {isAdmin && (
                  <td className="px-4 py-3">
                    <button onClick={() => setConfirmId(i.id)} className="text-red-500 hover:underline text-xs font-medium">Remove</button>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && <EmptyState message="No interests found" sub={search ? "Try a different search" : "Record your first customer interest"} />}
      </div>

      {/* Mobile cards */}
      <div className="md:hidden space-y-3">
        {filtered.length === 0 && <EmptyState message="No interests found" />}
        {filtered.map((i) => (
          <div key={i.id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-7 h-7 rounded-full bg-orange-100 flex items-center justify-center text-orange-600 font-bold text-xs uppercase">
                {i.firstname[0]}
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-800">{i.firstname} {i.lastname}</p>
                <p className="text-xs text-gray-400">{i.email}</p>
              </div>
            </div>
            <p className="text-sm text-gray-600 mb-1">
              <span className="text-gray-400 text-xs">Interested in: </span>
              {i.brand} {i.model}
            </p>
            <p className="text-xs font-mono text-gray-400 mb-3">{i.plate_number}</p>
            {isAdmin && (
              <div className="border-t border-gray-50 pt-3">
                <button onClick={() => setConfirmId(i.id)} className="text-red-500 text-sm font-medium hover:underline">Remove</button>
              </div>
            )}
          </div>
        ))}
      </div>

      {modal && (
        <Modal title="Add Customer Interest" onClose={() => setModal(false)}>
          <form onSubmit={handleSubmit} className="space-y-3">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Customer</label>
              <select
                className={`w-full border rounded-lg px-3 py-2 text-sm ${errors.customer_id ? "border-red-400" : "border-gray-200"}`}
                value={form.customer_id}
                onChange={(e) => { setForm({ ...form, customer_id: e.target.value }); setErrors({ ...errors, customer_id: "" }); }}
              >
                <option value="">-- Select Customer --</option>
                {customers.map((c) => <option key={c.id} value={c.id}>{c.firstname} {c.lastname}</option>)}
              </select>
              {errors.customer_id && <p className="text-red-500 text-xs mt-0.5">{errors.customer_id}</p>}
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Vehicle</label>
              <select
                className={`w-full border rounded-lg px-3 py-2 text-sm ${errors.vehicle_id ? "border-red-400" : "border-gray-200"}`}
                value={form.vehicle_id}
                onChange={(e) => { setForm({ ...form, vehicle_id: e.target.value }); setErrors({ ...errors, vehicle_id: "" }); }}
              >
                <option value="">-- Select Vehicle --</option>
                {vehicles.map((v) => <option key={v.id} value={v.id}>{v.brand} {v.model} ({v.plate_number})</option>)}
              </select>
              {errors.vehicle_id && <p className="text-red-500 text-xs mt-0.5">{errors.vehicle_id}</p>}
            </div>
            <button type="submit" className="w-full bg-orange-600 text-white py-2.5 rounded-lg font-semibold hover:bg-orange-700">Save Interest</button>
          </form>
        </Modal>
      )}

      {confirmId && (
        <ConfirmDialog
          message="This interest record will be removed permanently."
          onConfirm={handleDelete}
          onCancel={() => setConfirmId(null)}
        />
      )}
    </div>
  );
}
