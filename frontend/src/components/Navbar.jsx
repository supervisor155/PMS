/**
 * components/Navbar.jsx
 * Top navigation bar showing the app name, active user, and logout button.
 * Uses: useUser() from AuthContext to get current user and logout function.
 */

import { useUser } from "./AuthContext.jsx";

export default function Navbar({ onNavigate, current }) {
  const { user, logout } = useUser();

  const links = [
    { label: "Dashboard", key: "dashboard" },
    { label: "Vehicles", key: "vehicles" },
    { label: "Customers", key: "customers" },
    { label: "Promotions", key: "promotions" },
    { label: "Interests", key: "interests" },
    { label: "Report", key: "report" },
    ...(user?.role === "admin" ? [{ label: "Users", key: "users" }] : []),
  ];

  return (
    <nav className="bg-blue-700 text-white px-6 py-3 flex items-center justify-between shadow">
      <span className="font-bold text-lg tracking-wide">PMS</span>
      <div className="flex gap-4 text-sm">
        {links.map((l) => (
          <button
            key={l.key}
            onClick={() => onNavigate(l.key)}
            className={`hover:underline ${current === l.key ? "font-bold underline" : ""}`}
          >
            {l.label}
          </button>
        ))}
      </div>
      <div className="flex items-center gap-3 text-sm">
        <span className="opacity-80">{user?.username} ({user?.role})</span>
        <button
          onClick={logout}
          className="bg-white text-blue-700 px-3 py-1 rounded font-semibold hover:bg-blue-50"
        >
          Logout
        </button>
      </div>
    </nav>
  );
}
