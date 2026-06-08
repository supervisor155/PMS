/**
 * pages/VehiclesPage.jsx
 * Full CRUD page for vehicles with:
 *   - Live search bar (filters by brand, model, plate)
 *   - Mobile card view (stacked cards instead of table on small screens)
 *   - Toast notifications instead of alert()
 *   - ConfirmDialog instead of window.confirm()
 *   - EmptyState when no results
 * Uses:
 *   - useFetch()  — loads vehicles list
 *   - useUser()   — checks admin role for write actions
 *   - useToast()  — shows success/error notifications
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

const EMPTY = { plate_number: "", brand: "", model: "", year: "", vehicle_type: "", purchase_price: "", status: "available" };
const FIELDS = [
  { label: "Plate Number", key: "plate_number" },
  { label: "Brand", key: "brand" },
  { label: "Model", key: "model" },
  { label: "Year", key: "year", type: "number" },
  { label: "Vehicle Type", key: "vehicle_type" },
  { label: "Purchase Price", key: "purchase_price", type: "number" },
];

const statusStyle = {
  available:   "bg-green-100 text-green-700",
  unavailable: "bg-yellow-100 text-yellow-700",
  sold:        "bg-red-100 text-red-700",
};

export default function VehiclesPage() {
  const { user } = useUser();
  const { toast } = useToast();
  const { data: vehicles, refetch } = useFetch("/vehicles");
  const [modal, setModal]     = useState(false);
  const [form, setForm]       = useState(EMPTY);
  const [editId, setEditId]   = useState(null);
  const [errors, setErrors]   = useState({});
  const [confirmId, setConfirmId] = useState(null);
  const [search, setSearch]   = useState("");

  const isAdmin = user?.role === "admin";

  // Live search filter
  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return vehicles.filter((v) =>
      v.brand.toLowerCase().includes(q) ||
      v.model.toLowerCase().includes(q) ||
      v.plate_number.toLowerCase().includes(q) ||
      v.vehicle_type.toLowerCase().includes(q)
    );
  }, [vehicles, search]);

  const validate = () => {
    const e = {};
    if (!form.plate_number) e.plate_number = "Required";
    if (!form.brand)        e.brand = "Required";
    if (!form.model)        e.model = "Required";
    if (!form.year)         e.year = "Required";
    if (!form.vehicle_type) e.vehicle_type = "Required";
    if (!form.purchase_price) e.purchase_price = "Required";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const openCreate = () => { setForm(EMPTY); setEditId(null); setErrors({}); setModal(true); };
  const openEdit   = (v) => { setForm({ ...v }); setEditId(v.id); setErrors({}); setModal(true); };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    try {
      if (editId) await api.put(`/vehicles/${editId}`, form);
      else        await api.post("/vehicles", form);
      setModal(false);
      refetch();
      toast(editId ? "Vehicle updated." : "Vehicle added.", "success");
    } catch (err) {
      toast(err.response?.data?.message || "Save failed.", "error");
    }
  };

  const handleDelete = async () => {
    try {
      await api.delete(`/vehicles/${confirmId}`);
      setConfirmId(null);
      refetch();
      toast("Vehicle deleted.", "success");
    } catch {
      toast("Delete failed.", "error");
    }
  };

  return (
    <div className="p-4 sm:p-6">
      {/* Page header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
        <div>
          <h1 className="text-xl font-bold text-gray-800">Vehicles</h1>
          <p className="text-gray-400 text-xs mt-0.5">{vehicles.length} total vehicles</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <SearchBar value={search} onChange={setSearch} placeholder="Search vehicles..." />
          {isAdmin && (
            <button onClick={openCreate} className="bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-800 whitespace-nowrap">
              + Add Vehicle
            </button>
          )}
        </div>
      </div>

      {/* Desktop table */}
      <div className="hidden md:block bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full text-sm text-left">
          <thead className="bg-gray-50 text-gray-500 uppercase text-xs border-b border-gray-100">
            <tr>
              {["Plate", "Brand", "Model", "Year", "Type", "Price", "Status", "Registered By", isAdmin ? "Actions" : ""].map((h) => (
                <th key={h} className="px-4 py-3 font-medium">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {filtered.map((v) => (
              <tr key={v.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-4 py-3 font-mono text-xs">{v.plate_number}</td>
                <td className="px-4 py-3 font-medium">{v.brand}</td>
                <td className="px-4 py-3">{v.model}</td>
                <td className="px-4 py-3">{v.year}</td>
                <td className="px-4 py-3">{v.vehicle_type}</td>
                <td className="px-4 py-3">${Number(v.purchase_price).toLocaleString()}</td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-1 rounded-full text-xs font-semibold ${statusStyle[v.status]}`}>{v.status}</span>
                </td>
                <td className="px-4 py-3 text-gray-500">{v.registered_by_username}</td>
                {isAdmin && (
                  <td className="px-4 py-3">
                    <div className="flex gap-3">
                      <button onClick={() => openEdit(v)} className="text-blue-600 hover:underline text-xs font-medium">Edit</button>
                      <button onClick={() => setConfirmId(v.id)} className="text-red-500 hover:underline text-xs font-medium">Delete</button>
                    </div>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && <EmptyState message="No vehicles found" sub={search ? "Try a different search term" : "Add your first vehicle"} />}
      </div>

      {/* Mobile card view */}
      <div className="md:hidden space-y-3">
        {filtered.length === 0 && <EmptyState message="No vehicles found" sub={search ? "Try a different search term" : "Add your first vehicle"} />}
        {filtered.map((v) => (
          <div key={v.id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
            <div className="flex items-start justify-between mb-2">
              <div>
                <p className="font-bold text-gray-800">{v.brand} {v.model}</p>
                <p className="text-xs font-mono text-gray-400 mt-0.5">{v.plate_number}</p>
              </div>
              <span className={`px-2 py-1 rounded-full text-xs font-semibold ${statusStyle[v.status]}`}>{v.status}</span>
            </div>
            <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm text-gray-600 mb-3">
              <span><span className="text-gray-400 text-xs">Year</span><br />{v.year}</span>
              <span><span className="text-gray-400 text-xs">Type</span><br />{v.vehicle_type}</span>
              <span><span className="text-gray-400 text-xs">Price</span><br />${Number(v.purchase_price).toLocaleString()}</span>
              <span><span className="text-gray-400 text-xs">By</span><br />{v.registered_by_username}</span>
            </div>
            {isAdmin && (
              <div className="flex gap-3 border-t border-gray-50 pt-3">
                <button onClick={() => openEdit(v)} className="text-blue-600 text-sm font-medium hover:underline">Edit</button>
                <button onClick={() => setConfirmId(v.id)} className="text-red-500 text-sm font-medium hover:underline">Delete</button>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Form modal */}
      {modal && (
        <Modal title={editId ? "Edit Vehicle" : "Add Vehicle"} onClose={() => setModal(false)}>
          <form onSubmit={handleSubmit} className="space-y-3">
            {FIELDS.map(({ label, key, type }) => (
              <div key={key}>
                <label className="block text-xs font-medium text-gray-700 mb-1">{label}</label>
                <input
                  type={type || "text"}
                  className={`w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors[key] ? "border-red-400" : "border-gray-200"}`}
                  value={form[key]}
                  onChange={(e) => { setForm({ ...form, [key]: e.target.value }); setErrors({ ...errors, [key]: "" }); }}
                />
                {errors[key] && <p className="text-red-500 text-xs mt-0.5">{errors[key]}</p>}
              </div>
            ))}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Status</label>
              <select className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
                {["available", "unavailable", "sold"].map((s) => <option key={s}>{s}</option>)}
              </select>
            </div>
            <button type="submit" className="w-full bg-blue-700 text-white py-2.5 rounded-lg font-semibold hover:bg-blue-800 mt-1">Save Vehicle</button>
          </form>
        </Modal>
      )}

      {/* Confirm delete dialog */}
      {confirmId && (
        <ConfirmDialog
          message="This vehicle will be permanently deleted."
          onConfirm={handleDelete}
          onCancel={() => setConfirmId(null)}
        />
      )}
    </div>
  );
}
