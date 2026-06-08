/**
 * pages/ReportPage.jsx
 * Filterable promotion report.
 * Shows customers + vehicles they're interested in + all applicable promotions.
 * Features:
 *   - Filter by customer status, promotion title, date range
 *   - Mobile card view
 *   - Print support
 *   - Toast for errors
 *   - EmptyState
 * Uses:
 *   - useToast()  — error notifications
 *   - api         — manual GET with query params on demand
 */

import { useState } from "react";
import { useToast } from "../components/ToastContext.jsx";
import EmptyState from "../components/EmptyState.jsx";
import api from "../api/index.js";

const TITLES   = ["", "new year sale", "holiday price slash", "weekend flash sale", "clearance discount offer", "seasonal price drop"];
const STATUSES = ["", "active", "inactive", "blocked"];

const statusStyle = {
  active:   "bg-green-100 text-green-700",
  inactive: "bg-yellow-100 text-yellow-700",
  blocked:  "bg-red-100 text-red-700",
};

export default function ReportPage() {
  const { toast } = useToast();
  const [filters, setFilters] = useState({ status: "", title: "", start_date: "", end_date: "" });
  const [report, setReport]   = useState([]);
  const [loading, setLoading] = useState(false);
  const [ran, setRan]         = useState(false);

  const runReport = async () => {
    setLoading(true);
    try {
      const params = Object.fromEntries(Object.entries(filters).filter(([, v]) => v));
      const res = await api.get("/interests/report", { params });
      setReport(res.data);
      setRan(true);
    } catch (err) {
      toast(err.response?.data?.message || "Failed to load report.", "error");
    } finally {
      setLoading(false);
    }
  };

  const resetFilters = () => {
    setFilters({ status: "", title: "", start_date: "", end_date: "" });
    setReport([]);
    setRan(false);
  };

  return (
    <div className="p-4 sm:p-6">
      <div className="mb-5">
        <h1 className="text-xl font-bold text-gray-800">Promotion Report</h1>
        <p className="text-gray-400 text-xs mt-0.5">Customers · Vehicles · Applicable Promotions</p>
      </div>

      {/* Filters card */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-4">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Filters</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Customer Status</label>
            <select className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" value={filters.status} onChange={(e) => setFilters({ ...filters, status: e.target.value })}>
              {STATUSES.map((s) => <option key={s} value={s}>{s || "All Statuses"}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Promotion Title</label>
            <select className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" value={filters.title} onChange={(e) => setFilters({ ...filters, title: e.target.value })}>
              {TITLES.map((t) => <option key={t} value={t}>{t || "All Titles"}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Promo Start From</label>
            <input type="date" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" value={filters.start_date} onChange={(e) => setFilters({ ...filters, start_date: e.target.value })} />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Promo End Before</label>
            <input type="date" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" value={filters.end_date} onChange={(e) => setFilters({ ...filters, end_date: e.target.value })} />
          </div>
        </div>
        <div className="flex gap-2 mt-4 flex-wrap">
          <button
            onClick={runReport}
            disabled={loading}
            className="bg-blue-700 text-white px-5 py-2 rounded-lg font-semibold hover:bg-blue-800 text-sm disabled:opacity-60"
          >
            {loading ? "Loading..." : "Generate Report"}
          </button>
          <button onClick={resetFilters} className="bg-gray-100 text-gray-600 px-4 py-2 rounded-lg text-sm hover:bg-gray-200">
            Reset
          </button>
          {report.length > 0 && (
            <button onClick={() => window.print()} className="bg-gray-800 text-white px-4 py-2 rounded-lg text-sm hover:bg-gray-700 ml-auto">
              🖨 Print
            </button>
          )}
        </div>
      </div>

      {/* Results count */}
      {ran && (
        <p className="text-xs text-gray-400 mb-3">{report.length} result{report.length !== 1 ? "s" : ""} found</p>
      )}

      {/* Desktop table */}
      {report.length > 0 && (
        <div className="hidden md:block bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <table className="w-full text-sm text-left">
            <thead className="bg-gray-50 text-gray-500 uppercase text-xs border-b border-gray-100">
              <tr>
                {["Customer", "Email", "Status", "Brand", "Model", "Promotion", "Type", "Value", "Performance"].map((h) => (
                  <th key={h} className="px-4 py-3 font-medium">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {report.map((row, i) => (
                <tr key={i} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3 font-medium">{row.firstname} {row.lastname}</td>
                  <td className="px-4 py-3 text-gray-500">{row.email}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 rounded-full text-xs font-semibold ${statusStyle[row.customer_status]}`}>{row.customer_status}</span>
                  </td>
                  <td className="px-4 py-3">{row.brand}</td>
                  <td className="px-4 py-3">{row.model}</td>
                  <td className="px-4 py-3 capitalize">{row.promotion_title}</td>
                  <td className="px-4 py-3 text-gray-500">{row.discount_type}</td>
                  <td className="px-4 py-3 font-medium">{row.discount_value}</td>
                  <td className="px-4 py-3">
                    <span className="inline-flex items-center gap-1 font-medium text-blue-600">
                      {row.performance}
                      <span className="text-xs text-gray-400">inquiries</span>
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Mobile cards */}
      {report.length > 0 && (
        <div className="md:hidden space-y-3">
          {report.map((row, i) => (
            <div key={i} className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <p className="font-semibold text-gray-800 text-sm">{row.firstname} {row.lastname}</p>
                  <p className="text-xs text-gray-400">{row.email}</p>
                </div>
                <span className={`px-2 py-1 rounded-full text-xs font-semibold ${statusStyle[row.customer_status]}`}>{row.customer_status}</span>
              </div>
              <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-sm text-gray-700 mb-2">
                <span><span className="text-gray-400 text-xs block">Vehicle</span>{row.brand} {row.model}</span>
                <span><span className="text-gray-400 text-xs block">Promotion</span><span className="capitalize">{row.promotion_title}</span></span>
                <span><span className="text-gray-400 text-xs block">Discount</span>{row.discount_type} · {row.discount_value}</span>
                <span><span className="text-gray-400 text-xs block">Performance</span>{row.performance} inquiries</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {ran && report.length === 0 && (
        <EmptyState message="No report data found" sub="Try adjusting your filters" />
      )}

      {!ran && (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="w-16 h-16 rounded-full bg-blue-50 flex items-center justify-center mb-4">
            <svg className="w-8 h-8 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <p className="text-gray-500 font-medium">Set your filters and click Generate Report</p>
        </div>
      )}
    </div>
  );
}
