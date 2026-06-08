/**
 * pages/DashboardPage.jsx
 * Dashboard with rich stats, active promotions panel, and recent customers.
 * Uses:
 *   - useFetch() — loads vehicles, customers, promotions, interests
 *   - useUser()  — greets current user and shows role label
 */

import { useFetch } from "../hooks/useFetch.js";
import { useUser } from "../components/AuthContext.jsx";

function StatCard({ label, value, sub, bgIcon, icon }) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 flex items-start gap-4">
      <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${bgIcon}`}>
        {icon}
      </div>
      <div>
        <p className="text-2xl font-bold text-gray-800">{value}</p>
        <p className="text-sm text-gray-500">{label}</p>
        {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const { user } = useUser();
  const { data: vehicles }   = useFetch("/vehicles");
  const { data: customers }  = useFetch("/customers");
  const { data: promotions } = useFetch("/promotions");
  const { data: interests }  = useFetch("/interests");

  const available      = vehicles.filter((v) => v.status === "available").length;
  const activePromo    = promotions.filter((p) => p.status === "active").length;
  const activeCustomers = customers.filter((c) => c.status === "active").length;
  const recentCustomers = [...customers].slice(0, 5);

  const statusColor = {
    active:   "bg-green-100 text-green-700",
    inactive: "bg-yellow-100 text-yellow-700",
    blocked:  "bg-red-100 text-red-700",
  };

  return (
    <div className="p-4 sm:p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-800">
          Good day, <span className="text-blue-600">{user?.username}</span> 👋
        </h1>
        <p className="text-gray-400 text-sm mt-1 capitalize">
          Logged in as {user?.role} · Promotion &amp; Marketing Subsystem
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <StatCard
          label="Total Vehicles" value={vehicles.length} sub={`${available} available`}
          bgIcon="bg-blue-50"
          icon={<svg className="w-5 h-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0zM13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10l1 1h1m8-1h3l3-5V9l-3-2h-3.5" /></svg>}
        />
        <StatCard
          label="Total Customers" value={customers.length} sub={`${activeCustomers} active`}
          bgIcon="bg-green-50"
          icon={<svg className="w-5 h-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" /></svg>}
        />
        <StatCard
          label="Promotions" value={promotions.length} sub={`${activePromo} active`}
          bgIcon="bg-purple-50"
          icon={<svg className="w-5 h-5 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A2 2 0 013 12V7a4 4 0 014-4z" /></svg>}
        />
        <StatCard
          label="Interests Recorded" value={interests.length}
          bgIcon="bg-orange-50"
          icon={<svg className="w-5 h-5 text-orange-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" /></svg>}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Recent Customers */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <h2 className="font-semibold text-gray-700 mb-3 text-sm uppercase tracking-wide">Recent Customers</h2>
          {recentCustomers.length === 0 ? (
            <p className="text-gray-400 text-sm">No customers yet.</p>
          ) : (
            <ul className="space-y-2">
              {recentCustomers.map((c) => (
                <li key={c.id} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold text-xs uppercase">
                      {c.firstname[0]}
                    </div>
                    <span className="text-sm text-gray-700">{c.firstname} {c.lastname}</span>
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusColor[c.status]}`}>{c.status}</span>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Active Promotions */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <h2 className="font-semibold text-gray-700 mb-3 text-sm uppercase tracking-wide">Active Promotions</h2>
          {activePromo === 0 ? (
            <p className="text-gray-400 text-sm">No active promotions.</p>
          ) : (
            <ul className="space-y-2">
              {promotions.filter((p) => p.status === "active").map((p) => (
                <li key={p.id} className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-700 capitalize font-medium">{p.title}</p>
                    <p className="text-xs text-gray-400">{p.discount_type} · ends {p.end_date?.slice(0, 10)}</p>
                  </div>
                  <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-green-100 text-green-700">active</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
