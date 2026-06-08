/**
 * App.jsx
 * Root component. Uses sidebar layout with mobile-first responsive design.
 * Uses: useUser() from AuthContext to check auth state.
 * Uses: ToastProvider wraps everything for global toast notifications.
 */

import { useState } from "react";
import { useUser } from "./components/AuthContext.jsx";
import Sidebar from "./components/Sidebar.jsx";
import LoginPage from "./pages/LoginPage.jsx";
import DashboardPage from "./pages/DashboardPage.jsx";
import VehiclesPage from "./pages/VehiclesPage.jsx";
import CustomersPage from "./pages/CustomersPage.jsx";
import PromotionsPage from "./pages/PromotionsPage.jsx";
import InterestsPage from "./pages/InterestsPage.jsx";
import ReportPage from "./pages/ReportPage.jsx";
import UsersPage from "./pages/UsersPage.jsx";

const PAGES = {
  dashboard:  <DashboardPage />,
  vehicles:   <VehiclesPage />,
  customers:  <CustomersPage />,
  promotions: <PromotionsPage />,
  interests:  <InterestsPage />,
  report:     <ReportPage />,
  users:      <UsersPage />,
};

export default function App() {
  const { user, loading } = useUser();
  const [page, setPage] = useState("dashboard");

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-gray-500 text-sm">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) return <LoginPage />;

  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar current={page} onNavigate={setPage} />
      {/* Main content: offset by sidebar width on desktop, top bar height on mobile */}
      <main className="lg:ml-60 pt-14 lg:pt-0 min-h-screen">
        <div className="max-w-7xl mx-auto">
          {PAGES[page]}
        </div>
      </main>
    </div>
  );
}
