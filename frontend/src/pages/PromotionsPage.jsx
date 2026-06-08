/**
 * pages/PromotionsPage.jsx
 * Full CRUD page for promotions. Admin only for create/edit/delete/link.
 * Features:
 *   - Live search by title or discount type
 *   - Mobile card view
 *   - Toast notifications
 *   - ConfirmDialog for delete
 *   - Inline field validation
 *   - EmptyState
 * Uses:
 *   - useFetch()  — promotions and vehicles lists
 *   - useUser()   — admin role check
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

const TITLES = ["new year sale", "holiday price slash", "weekend flash sale", "clearance discount offer", "seasonal price drop"];
const DISCOUNT_TYPES = ["free", "percentage", "FLAT_RATE", "CASHBACK", "BUY_ONE_GET_ONE", "Bundle", "amount"];
const EMPTY = { title: TITLES[0], description: "", discount_type: DISCOUNT_TYPES[0], discount_value: 0, start_date: "", end_date: "", status: "active" };

const statusStyle = {
  active:   "bg-green-100 text-green-700",
  inactive: "bg-yellow-100 text-yellow-700",
  expired:  "bg-red-100 text-red-600",
};

export default function PromotionsPage() {
  const { user } = useUser();
  const { toast } = useToast();
  const { data: promotions, refetch } = useFetch("/promotions");
  const { data: vehicles } = useFetch("/vehicles");

  const [modal, setModal]           = useState(false);
  const [linkModal, setLinkModal]   = useState(false);
  const [form, setForm]             = useState(EMPTY);
  const [editId, setEditId]         = useState(null);
  const [errors, setErrors]         = useState({});
  const [confirmId, setConfirmId]   = useState(null);
  const [linkPromoId, setLinkPromoId] = useState(null);
  const [linkForm, setLinkForm]     = useState({ vehicle_id: "", performance: 0 });
  const [search, setSearch]         = useState("");

  const isAdmin = user?.role === "admin";

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return promotions.filter((p) =>
      p.title.toLowerCase().includes(q) ||
      p.discount_type.toLowerCase().includes(q)
    );
  }, [promotions, search]);

  const validate = () => {
    const e = {};
    if (!form.start_date) e.start_date = "Required";
    if (!form.end_date)   e.end_date = "Required";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const openCreate = () => { setForm(EMPTY); setEditId(null); setErrors({}); setModal(true); };
  const openEdit   = (p) => {
    setForm({ ...p, start_date: p.start_date?.slice(0, 10), end_date: p.end_date?.slice(0, 10) });
    setEditId(p.id); setErrors({}); setModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    try {
      if (editId) await api.put(`/promotions/${editId}`, form);
      else        await api.post("/promotions", form);
      setModal(false); refetch();
      toast(editId ? "Promotion updated." : "Promotion created.", "success");
    } catch (err) {
      toast(err.response?.data?.message || "Save failed.", "error");
    }
  };

  const handleDelete = async () => {
    try {
      await api.delete(`/promotions/${confirmId}`);
      setConfirmId(null); refetch();
      toast("Promotion deleted.", "success");
    } catch {
      toast("Delete failed.", "error");
    }
  };

  const openLink = (p) => { setLinkPromoId(p.id); setLinkForm({ vehicle_id: "", performance: 0 }); setLinkModal(true); };
  const handleLink = async (e) => {
    e.preventDefault();
    try {
      await api.post(`/promotions/${linkPromoId}/vehicles`, linkForm);
      setLinkModal(false);
      toast("Vehicle linked to promotion.", "success");
    } catch (err) {
      toast(err.response?.data?.message || "Link failed.", "error");
    }
  };

  return (
    <div className="p-4 sm:p-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
        <div>
          <h1 className="text-xl font-bold text-gray-800">Promotions</h1>
          <p className="text-gray-400 text-xs mt-0.5">{promotions.length} total promotions</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <SearchBar value={search} onChange={setSearch} placeholder="Search promotions..." />
          {isAdmin && (
            <button onClick={openCreate} className="bg-purple-700 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-purple-800 whitespace-nowrap">
              + Add Promotion
            </button>
          )}
        </div>
      </div>

      {/* Desktop table */}
      <div className="hidden md:block bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full text-sm text-left">
          <thead className="bg-gray-50 text-gray-500 uppercase text-xs border-b border-gray-100">
            <tr>
              {["Title", "Type", "Value", "Start", "End", "Status", "By", isAdmin ? "Actions" : ""].map((h) => (
                <th key={h} className="px-4 py-3 font-medium">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {filtered.map((p) => (
              <tr key={p.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-4 py-3 font-medium capitalize">{p.title}</td>
                <td className="px-4 py-3 text-gray-500">{p.discount_type}</td>
                <td className="px-4 py-3">{p.discount_value}</td>
                <td className="px-4 py-3 text-gray-500">{p.start_date?.slice(0, 10)}</td>
                <td className="px-4 py-3 text-gray-500">{p.end_date?.slice(0, 10)}</td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-1 rounded-full text-xs font-semibold ${statusStyle[p.status]}`}>{p.status}</span>
                </td>
                <td className="px-4 py-3 text-gray-500">{p.created_by_username}</td>
                {isAdmin && (
                  <td className="px-4 py-3">
                    <div className="flex gap-3">
                      <button onClick={() => openEdit(p)} className="text-blue-600 hover:underline text-xs font-medium">Edit</button>
                      <button onClick={() => openLink(p)} className="text-purple-600 hover:underline text-xs font-medium">Link</button>
                      <button onClick={() => setConfirmId(p.id)} className="text-red-500 hover:underline text-xs font-medium">Delete</button>
                    </div>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && <EmptyState message="No promotions found" sub={search ? "Try a different search" : "Create your first promotion"} />}
      </div>

      {/* Mobile cards */}
      <div className="md:hidden space-y-3">
        {filtered.length === 0 && <EmptyState message="No promotions found" />}
        {filtered.map((p) => (
          <div key={p.id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
            <div className="flex items-start justify-between mb-2">
              <p className="font-semibold text-gray-800 capitalize text-sm">{p.title}</p>
              <span className={`px-2 py-1 rounded-full text-xs font-semibold ${statusStyle[p.status]}`}>{p.status}</span>
            </div>
            <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm text-gray-600 mb-3">
              <span><span className="text-gray-400 text-xs">Type</span><br />{p.discount_type}</span>
              <span><span className="text-gray-400 text-xs">Value</span><br />{p.discount_value}</span>
              <span><span className="text-gray-400 text-xs">Start</span><br />{p.start_date?.slice(0, 10)}</span>
              <span><span className="text-gray-400 text-xs">End</span><br />{p.end_date?.slice(0, 10)}</span>
            </div>
            {isAdmin && (
              <div className="flex gap-3 border-t border-gray-50 pt-3">
                <button onClick={() => openEdit(p)} className="text-blue-600 text-sm font-medium hover:underline">Edit</button>
                <button onClick={() => openLink(p)} className="text-purple-600 text-sm font-medium hover:underline">Link Vehicle</button>
                <button onClick={() => setConfirmId(p.id)} className="text-red-500 text-sm font-medium hover:underline">Delete</button>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Promotion form modal */}
      {modal && (
        <Modal title={editId ? "Edit Promotion" : "Add Promotion"} onClose={() => setModal(false)}>
          <form onSubmit={handleSubmit} className="space-y-3">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Title</label>
              <select className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })}>
                {TITLES.map((t) => <option key={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Description</label>
              <textarea className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" rows={2} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Discount Type</label>
                <select className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" value={form.discount_type} onChange={(e) => setForm({ ...form, discount_type: e.target.value })}>
                  {DISCOUNT_TYPES.map((t) => <option key={t}>{t}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Discount Value</label>
                <input type="number" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" value={form.discount_value} onChange={(e) => setForm({ ...form, discount_value: e.target.value })} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Start Date</label>
                <input type="date" className={`w-full border rounded-lg px-3 py-2 text-sm ${errors.start_date ? "border-red-400" : "border-gray-200"}`} value={form.start_date} onChange={(e) => { setForm({ ...form, start_date: e.target.value }); setErrors({ ...errors, start_date: "" }); }} />
                {errors.start_date && <p className="text-red-500 text-xs mt-0.5">{errors.start_date}</p>}
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">End Date</label>
                <input type="date" className={`w-full border rounded-lg px-3 py-2 text-sm ${errors.end_date ? "border-red-400" : "border-gray-200"}`} value={form.end_date} onChange={(e) => { setForm({ ...form, end_date: e.target.value }); setErrors({ ...errors, end_date: "" }); }} />
                {errors.end_date && <p className="text-red-500 text-xs mt-0.5">{errors.end_date}</p>}
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Status</label>
              <select className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
                {["active", "inactive", "expired"].map((s) => <option key={s}>{s}</option>)}
              </select>
            </div>
            <button type="submit" className="w-full bg-purple-700 text-white py-2.5 rounded-lg font-semibold hover:bg-purple-800 mt-1">Save Promotion</button>
          </form>
        </Modal>
      )}

      {/* Link vehicle modal */}
      {linkModal && (
        <Modal title="Link Vehicle to Promotion" onClose={() => setLinkModal(false)}>
          <form onSubmit={handleLink} className="space-y-3">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Vehicle (available only)</label>
              <select className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" value={linkForm.vehicle_id} onChange={(e) => setLinkForm({ ...linkForm, vehicle_id: e.target.value })} required>
                <option value="">-- Select Vehicle --</option>
                {vehicles.filter((v) => v.status === "available").map((v) => (
                  <option key={v.id} value={v.id}>{v.brand} {v.model} ({v.plate_number})</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Performance (no. of inquiries)</label>
              <input type="number" min={0} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" value={linkForm.performance} onChange={(e) => setLinkForm({ ...linkForm, performance: e.target.value })} />
            </div>
            <button type="submit" className="w-full bg-purple-700 text-white py-2.5 rounded-lg font-semibold hover:bg-purple-800">Link Vehicle</button>
          </form>
        </Modal>
      )}

      {confirmId && (
        <ConfirmDialog
          message="This promotion and all vehicle links will be permanently deleted."
          onConfirm={handleDelete}
          onCancel={() => setConfirmId(null)}
        />
      )}
    </div>
  );
}
