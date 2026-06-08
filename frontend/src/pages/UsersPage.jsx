/**
 * pages/UsersPage.jsx
 * Admin-only page to manage user accounts.
 * Features:
 *   - Create staff/admin accounts with live password strength indicator
 *   - Delete users
 *   - Password reset: admin generates a token → copies it → user resets password
 *   - Live search, mobile card view, toast notifications, confirm dialog
 * Uses:
 *   - useFetch()  — loads users list
 *   - useUser()   — admin guard + self-delete prevention
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

const EMPTY = { username: "", password: "", role: "staff" };

// Password strength calculator — returns { score 0-4, label, color, barColor }
function getStrength(pwd) {
  if (!pwd) return { score: 0, label: "", barColor: "" };
  let score = 0;
  if (pwd.length >= 8)              score++;
  if (/[A-Z]/.test(pwd))            score++;
  if (/[0-9]/.test(pwd))            score++;
  if (/[^A-Za-z0-9]/.test(pwd))    score++;
  const map = [
    { label: "",            barColor: "" },
    { label: "Weak",        barColor: "bg-red-500" },
    { label: "Fair",        barColor: "bg-orange-400" },
    { label: "Strong",      barColor: "bg-yellow-400" },
    { label: "Very Strong", barColor: "bg-green-500" },
  ];
  return { score, ...map[score] };
}

function PasswordStrengthBar({ password }) {
  const { score, label, barColor } = getStrength(password);
  if (!password) return null;
  return (
    <div className="mt-1.5">
      <div className="flex gap-1 mb-1">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className={`h-1 flex-1 rounded-full transition-all duration-300 ${i <= score ? barColor : "bg-gray-200"}`}
          />
        ))}
      </div>
      <p className={`text-xs font-medium ${
        score === 1 ? "text-red-500" :
        score === 2 ? "text-orange-400" :
        score === 3 ? "text-yellow-500" :
        score === 4 ? "text-green-600" : ""
      }`}>{label}</p>
    </div>
  );
}

export default function UsersPage() {
  const { user } = useUser();
  const { toast } = useToast();
  const { data: users, refetch } = useFetch("/auth/users");

  const [modal, setModal]         = useState(false);
  const [form, setForm]           = useState(EMPTY);
  const [errors, setErrors]       = useState({});
  const [showPass, setShowPass]   = useState(false);
  const [confirmId, setConfirmId] = useState(null);
  const [search, setSearch]       = useState("");

  // Reset token flow state
  const [tokenModal, setTokenModal]     = useState(false);   // step 1: show generated token
  const [resetModal, setResetModal]     = useState(false);   // step 2: enter token to reset
  const [generatedToken, setGeneratedToken] = useState("");
  const [tokenUserId, setTokenUserId]   = useState(null);
  const [tokenExpiry, setTokenExpiry]   = useState("");
  const [copied, setCopied]             = useState(false);
  const [resetForm, setResetForm]       = useState({ username: "", token: "", newPassword: "" });
  const [resetErrors, setResetErrors]   = useState({});
  const [showResetPass, setShowResetPass] = useState(false);

  if (user?.role !== "admin") {
    return <div className="p-6 text-red-500 font-semibold">Access denied. Admins only.</div>;
  }

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return users.filter((u) =>
      u.username.toLowerCase().includes(q) ||
      u.role.toLowerCase().includes(q)
    );
  }, [users, search]);

  const validate = () => {
    const e = {};
    if (!form.username) e.username = "Required";
    if (!form.password || form.password.length < 6) e.password = "Min 6 characters";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    try {
      await api.post("/auth/users", form);  // admin endpoint — allows setting any role
      setModal(false); setForm(EMPTY); refetch();
      toast("User account created.", "success");
    } catch (err) {
      toast(err.response?.data?.message || "Failed to create user.", "error");
    }
  };

  const handleDelete = async () => {
    try {
      await api.delete(`/auth/users/${confirmId}`);
      setConfirmId(null); refetch();
      toast("User deleted.", "success");
    } catch (err) {
      toast(err.response?.data?.message || "Delete failed.", "error");
    }
  };

  // Step 1: Admin clicks "Reset Password" on a user → generate token
  const handleGenerateToken = async (uid) => {
    try {
      const res = await api.post(`/auth/users/${uid}/reset-token`);
      setGeneratedToken(res.data.token);
      setTokenExpiry(new Date(res.data.expires_at).toLocaleTimeString());
      setTokenUserId(uid);
      setCopied(false);
      setTokenModal(true);
    } catch (err) {
      toast(err.response?.data?.message || "Failed to generate token.", "error");
    }
  };

  // Copy token to clipboard
  const handleCopy = async () => {
    await navigator.clipboard.writeText(generatedToken);
    setCopied(true);
    toast("Token copied to clipboard.", "info");
  };

  // Step 2: Open the "Use Token" form to reset password
  const openResetForm = () => {
    const targetUser = users.find((u) => u.id === tokenUserId);
    setResetForm({ username: targetUser?.username || "", token: "", newPassword: "" });
    setResetErrors({});
    setTokenModal(false);
    setResetModal(true);
  };

  // Submit new password with token
  const handleResetPassword = async (e) => {
    e.preventDefault();
    const e2 = {};
    if (!resetForm.token)                           e2.token = "Token is required";
    if (!resetForm.newPassword || resetForm.newPassword.length < 6) e2.newPassword = "Min 6 characters";
    setResetErrors(e2);
    if (Object.keys(e2).length > 0) return;

    try {
      await api.post("/auth/reset-password", resetForm);
      setResetModal(false);
      toast("Password reset successfully.", "success");
    } catch (err) {
      toast(err.response?.data?.message || "Reset failed.", "error");
    }
  };

  const roleStyle = {
    admin: "bg-blue-100 text-blue-700",
    staff: "bg-gray-100 text-gray-600",
  };

  return (
    <div className="p-4 sm:p-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
        <div>
          <h1 className="text-xl font-bold text-gray-800">User Accounts</h1>
          <p className="text-gray-400 text-xs mt-0.5">{users.length} accounts</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <SearchBar value={search} onChange={setSearch} placeholder="Search users..." />
          <button
            onClick={() => { setForm(EMPTY); setErrors({}); setShowPass(false); setModal(true); }}
            className="bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-800 whitespace-nowrap"
          >
            + Create User
          </button>
        </div>
      </div>

      {/* Desktop table */}
      <div className="hidden md:block bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full text-sm text-left">
          <thead className="bg-gray-50 text-gray-500 uppercase text-xs border-b border-gray-100">
            <tr>
              {["User", "Role", "Created", "Actions"].map((h) => (
                <th key={h} className="px-4 py-3 font-medium">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {filtered.map((u) => (
              <tr key={u.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold text-xs uppercase">
                      {u.username[0]}
                    </div>
                    <span className="font-medium">{u.username}</span>
                    {u.id === user.id && <span className="text-xs text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded">you</span>}
                  </div>
                </td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-1 rounded-full text-xs font-semibold ${roleStyle[u.role]}`}>{u.role}</span>
                </td>
                <td className="px-4 py-3 text-gray-500">{new Date(u.created_at).toLocaleDateString()}</td>
                <td className="px-4 py-3">
                  <div className="flex gap-3">
                    <button onClick={() => handleGenerateToken(u.id)} className="text-yellow-600 hover:underline text-xs font-medium">Reset Password</button>
                    {u.id !== user.id
                      ? <button onClick={() => setConfirmId(u.id)} className="text-red-500 hover:underline text-xs font-medium">Delete</button>
                      : <span className="text-gray-300 text-xs">—</span>
                    }
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && <EmptyState message="No users found" sub={search ? "Try a different search" : ""} />}
      </div>

      {/* Mobile cards */}
      <div className="md:hidden space-y-3">
        {filtered.length === 0 && <EmptyState message="No users found" />}
        {filtered.map((u) => (
          <div key={u.id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold text-sm uppercase">
                  {u.username[0]}
                </div>
                <div>
                  <p className="font-semibold text-gray-800 text-sm">
                    {u.username}
                    {u.id === user.id && <span className="ml-1 text-xs text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded">you</span>}
                  </p>
                  <p className="text-xs text-gray-400">{new Date(u.created_at).toLocaleDateString()}</p>
                </div>
              </div>
              <span className={`px-2 py-1 rounded-full text-xs font-semibold ${roleStyle[u.role]}`}>{u.role}</span>
            </div>
            <div className="flex gap-3 border-t border-gray-50 pt-3">
              <button onClick={() => handleGenerateToken(u.id)} className="text-yellow-600 text-sm font-medium hover:underline">Reset Password</button>
              {u.id !== user.id && (
                <button onClick={() => setConfirmId(u.id)} className="text-red-500 text-sm font-medium hover:underline">Delete</button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* ── Create user modal ── */}
      {modal && (
        <Modal title="Create User Account" onClose={() => setModal(false)}>
          <form onSubmit={handleCreate} className="space-y-3">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Username</label>
              <input
                className={`w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.username ? "border-red-400" : "border-gray-200"}`}
                value={form.username}
                onChange={(e) => { setForm((p) => ({ ...p, username: e.target.value })); setErrors((p) => ({ ...p, username: "" })); }}
              />
              {errors.username && <p className="text-red-500 text-xs mt-0.5">{errors.username}</p>}
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Password</label>
              <div className="relative">
                <input
                  type={showPass ? "text" : "password"}
                  className={`w-full border rounded-lg px-3 py-2 text-sm pr-9 focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.password ? "border-red-400" : "border-gray-200"}`}
                  value={form.password}
                  onChange={(e) => { setForm((p) => ({ ...p, password: e.target.value })); setErrors((p) => ({ ...p, password: "" })); }}
                />
                <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  {showPass
                    ? <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18" /></svg>
                    : <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                  }
                </button>
              </div>
              <PasswordStrengthBar password={form.password} />
              {errors.password && <p className="text-red-500 text-xs mt-0.5">{errors.password}</p>}
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Role</label>
              <select className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" value={form.role} onChange={(e) => setForm((p) => ({ ...p, role: e.target.value }))}>
                <option value="staff">Staff</option>
                <option value="admin">Admin</option>
              </select>
            </div>
            <button type="submit" className="w-full bg-blue-700 text-white py-2.5 rounded-lg font-semibold hover:bg-blue-800 mt-1">Create Account</button>
          </form>
        </Modal>
      )}

      {/* ── Step 1: Generated token display modal ── */}
      {tokenModal && (
        <Modal title="Password Reset Token" onClose={() => setTokenModal(false)}>
          <div className="space-y-4">
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
              <p className="text-xs text-yellow-800 font-semibold mb-1">⚠ Copy this token now</p>
              <p className="text-xs text-yellow-700">This token is shown only once and expires at <strong>{tokenExpiry}</strong>. Give it to the user so they can reset their password.</p>
            </div>
            {/* Token display box */}
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Reset Token</label>
              <div className="flex gap-2">
                <input
                  readOnly
                  value={generatedToken}
                  className="flex-1 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-xs font-mono text-gray-700 focus:outline-none"
                />
                <button
                  onClick={handleCopy}
                  className={`px-3 py-2 rounded-lg text-xs font-semibold transition-colors ${copied ? "bg-green-100 text-green-700" : "bg-gray-200 text-gray-700 hover:bg-gray-300"}`}
                >
                  {copied ? "✓ Copied" : "Copy"}
                </button>
              </div>
            </div>
            <button
              onClick={openResetForm}
              disabled={!copied}
              className="w-full bg-blue-700 text-white py-2.5 rounded-lg font-semibold hover:bg-blue-800 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {copied ? "Proceed to Reset Password →" : "Copy the token first to continue"}
            </button>
          </div>
        </Modal>
      )}

      {/* ── Step 2: Use token to set new password ── */}
      {resetModal && (
        <Modal title="Set New Password" onClose={() => setResetModal(false)}>
          <form onSubmit={handleResetPassword} className="space-y-3">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Username</label>
              <input
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-gray-50"
                value={resetForm.username}
                readOnly
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Paste Reset Token</label>
              <input
                className={`w-full border rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500 ${resetErrors.token ? "border-red-400" : "border-gray-200"}`}
                placeholder="Paste the token here..."
                value={resetForm.token}
                onChange={(e) => { setResetForm((p) => ({ ...p, token: e.target.value })); setResetErrors((p) => ({ ...p, token: "" })); }}
              />
              {resetErrors.token && <p className="text-red-500 text-xs mt-0.5">{resetErrors.token}</p>}
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">New Password</label>
              <div className="relative">
                <input
                  type={showResetPass ? "text" : "password"}
                  className={`w-full border rounded-lg px-3 py-2 text-sm pr-9 focus:outline-none focus:ring-2 focus:ring-blue-500 ${resetErrors.newPassword ? "border-red-400" : "border-gray-200"}`}
                  placeholder="Enter new password..."
                  value={resetForm.newPassword}
                  onChange={(e) => { setResetForm((p) => ({ ...p, newPassword: e.target.value })); setResetErrors((p) => ({ ...p, newPassword: "" })); }}
                />
                <button type="button" onClick={() => setShowResetPass(!showResetPass)} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  {showResetPass
                    ? <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18" /></svg>
                    : <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                  }
                </button>
              </div>
              <PasswordStrengthBar password={resetForm.newPassword} />
              {resetErrors.newPassword && <p className="text-red-500 text-xs mt-0.5">{resetErrors.newPassword}</p>}
            </div>
            <button type="submit" className="w-full bg-blue-700 text-white py-2.5 rounded-lg font-semibold hover:bg-blue-800 mt-1">
              Reset Password
            </button>
          </form>
        </Modal>
      )}

      {confirmId && (
        <ConfirmDialog
          message="This user account will be permanently deleted."
          onConfirm={handleDelete}
          onCancel={() => setConfirmId(null)}
        />
      )}
    </div>
  );
}
