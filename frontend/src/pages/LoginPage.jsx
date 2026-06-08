/**
 * pages/LoginPage.jsx
 * Animated login page with 3-stage experience:
 *   Stage 1 (idle)      — Landing screen with glowing "Login" button
 *   Stage 2 (animating) — Character walks in holding key, unlocks cage (~2.5s)
 *   Stage 3 (open)      — Cage opens, login form slides in
 *
 * Inside the form there is a "Forgot password?" link that opens a 2-step reset flow:
 *   Step 1 — User enters username → sees instructions to get token from admin
 *   Step 2 — User pastes 8-digit token + sets new password (with strength meter)
 *
 * All animations are pure CSS @keyframes — no external libraries.
 * Uses:
 *   - useUser()  — calls login() from AuthContext
 *   - useToast() — error/success notifications
 */

import { useState } from "react";
import { useUser } from "../components/AuthContext.jsx";
import { useToast } from "../components/ToastContext.jsx";
import api from "../api/index.js";

// ── Password strength helper ──────────────────────────────────────────────────
function getStrength(pwd) {
  if (!pwd) return { score: 0, label: "", barColor: "" };
  let score = 0;
  if (pwd.length >= 8)           score++;
  if (/[A-Z]/.test(pwd))         score++;
  if (/[0-9]/.test(pwd))         score++;
  if (/[^A-Za-z0-9]/.test(pwd)) score++;
  const map = [
    { label: "",            barColor: "" },
    { label: "Weak",        barColor: "bg-red-500" },
    { label: "Fair",        barColor: "bg-orange-400" },
    { label: "Strong",      barColor: "bg-yellow-400" },
    { label: "Very Strong", barColor: "bg-green-500" },
  ];
  return { score, ...map[score] };
}

function StrengthBar({ password }) {
  const { score, label, barColor } = getStrength(password);
  if (!password) return null;
  return (
    <div className="mt-1.5">
      <div className="flex gap-1 mb-1">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className={`h-1 flex-1 rounded-full transition-all duration-300 ${i <= score ? barColor : "bg-gray-200"}`} />
        ))}
      </div>
      <p className={`text-xs font-medium ${score === 1 ? "text-red-500" : score === 2 ? "text-orange-400" : score === 3 ? "text-yellow-500" : score === 4 ? "text-green-600" : ""}`}>
        {label}
      </p>
    </div>
  );
}

// ── SVG Character (person holding key) ───────────────────────────────────────
function Character({ style }) {
  return (
    <svg width="48" height="72" viewBox="0 0 48 72" style={style}>
      <circle cx="24" cy="10" r="8" fill="#FBBF24" stroke="#F59E0B" strokeWidth="1.5" />
      <circle cx="21" cy="9" r="1.2" fill="#1E3A5F" />
      <circle cx="27" cy="9" r="1.2" fill="#1E3A5F" />
      <path d="M21 13 Q24 15 27 13" stroke="#1E3A5F" strokeWidth="1" fill="none" strokeLinecap="round" />
      <rect x="17" y="20" width="14" height="20" rx="4" fill="#3B82F6" />
      <line x1="17" y1="24" x2="6" y2="16" stroke="#FBBF24" strokeWidth="3.5" strokeLinecap="round" />
      <circle cx="4" cy="14" r="4" fill="none" stroke="#FCD34D" strokeWidth="2" />
      <line x1="7.5" y1="14" x2="14" y2="14" stroke="#FCD34D" strokeWidth="2" strokeLinecap="round" />
      <line x1="12" y1="14" x2="12" y2="17" stroke="#FCD34D" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="10" y1="14" x2="10" y2="16" stroke="#FCD34D" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="31" y1="24" x2="40" y2="28" stroke="#FBBF24" strokeWidth="3.5" strokeLinecap="round" />
      <line x1="21" y1="40" x2="18" y2="58" stroke="#1E40AF" strokeWidth="4" strokeLinecap="round" />
      <line x1="27" y1="40" x2="30" y2="58" stroke="#1E40AF" strokeWidth="4" strokeLinecap="round" />
      <ellipse cx="17" cy="59" rx="5" ry="2.5" fill="#1E40AF" />
      <ellipse cx="31" cy="59" rx="5" ry="2.5" fill="#1E40AF" />
    </svg>
  );
}

// ── SVG Cage ──────────────────────────────────────────────────────────────────
function Cage({ open }) {
  return (
    <svg width="80" height="90" viewBox="0 0 80 90">
      <rect x="5" y="55" width="70" height="30" rx="4" fill="#1E3A5F" />
      <rect x="5" y="50" width="70" height="8" rx="3" fill="#1E40AF" />
      {[15, 26, 37, 48, 59].map((x, i) => (
        <rect key={i} x={x} y="10" width="5" height="42" rx="2" fill="#3B82F6"
          style={{ transition: "transform 0.6s ease, opacity 0.4s ease", transformOrigin: `${x + 2.5}px 10px`, transform: open ? "translateY(-40px)" : "translateY(0px)", opacity: open ? 0 : 1 }}
        />
      ))}
      <rect x="28" y="30" width="24" height="18" rx="3" fill={open ? "#10B981" : "#F59E0B"} style={{ transition: "fill 0.4s ease" }} />
      <path d="M33 30 Q33 20 40 20 Q47 20 47 30" fill="none" stroke={open ? "#10B981" : "#F59E0B"} strokeWidth="4" strokeLinecap="round"
        style={{ transition: "transform 0.5s ease", transformOrigin: "40px 30px", transform: open ? "rotate(30deg)" : "rotate(0deg)" }}
      />
      <circle cx="40" cy="38" r="3" fill={open ? "#fff" : "#1E3A5F"} style={{ transition: "fill 0.3s" }} />
      <rect x="38.5" y="40" width="3" height="4" rx="1" fill={open ? "#fff" : "#1E3A5F"} style={{ transition: "fill 0.3s" }} />
    </svg>
  );
}

// ── Eye toggle icon ───────────────────────────────────────────────────────────
function EyeIcon({ show }) {
  return show
    ? <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18" /></svg>
    : <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>;
}

// ── Main component ────────────────────────────────────────────────────────────
export default function LoginPage() {
  const { login } = useUser();
  const { toast } = useToast();

  // Animation stage: 'idle' | 'animating' | 'open'
  const [stage, setStage]     = useState("idle");

  // card view: 'login' | 'register' | 'forgot-step1' | 'forgot-step2'
  const [view, setView]       = useState("login");

  // Login form
  const [form, setForm]       = useState({ username: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);

  // Register form
  const [regForm, setRegForm]     = useState({ username: "", password: "", confirm: "" });
  const [regErrors, setRegErrors] = useState({});
  const [regLoading, setRegLoading] = useState(false);
  const [regShowPass, setRegShowPass] = useState(false);

  // Forgot password view: 'none' | 'step1' | 'step2'
  // step1 = enter username + instructions
  // step2 = enter 8-digit token + new password
  const [forgot, setForgot]         = useState("none");
  const [fpUsername, setFpUsername] = useState("");
  const [fpToken, setFpToken]       = useState("");
  const [fpPassword, setFpPassword] = useState("");
  const [fpShowPass, setFpShowPass] = useState(false);
  const [fpErrors, setFpErrors]     = useState({});
  const [fpLoading, setFpLoading]   = useState(false);

  const startAnimation = () => {
    setStage("animating");
    setTimeout(() => setStage("open"), 2600);
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await login(form.username, form.password);
    } catch (err) {
      toast(err.response?.data?.message || "Invalid credentials.", "error");
    } finally {
      setLoading(false);
    }
  };

  // Step 1: validate username exists then show instructions
  const handleForgotStep1 = async (e) => {
    e.preventDefault();
    if (!fpUsername.trim()) { setFpErrors({ username: "Enter your username" }); return; }
    setFpErrors({});
    setFpLoading(true);
    try {
      // We just check the user exists by attempting a blank-password login
      // which will always fail but returns 401 (exists) vs 401 (not found same msg)
      // Better: ping a dedicated endpoint. We'll call reset-password with empty token
      // to see if user exists — but simplest is to just move to step 2 directly.
      // The real validation happens on step 2 when the token is checked.
      setForgot("step2");
    } finally {
      setFpLoading(false);
    }
  };

  // Step 2: submit token + new password
  const handleForgotStep2 = async (e) => {
    e.preventDefault();
    const errs = {};
    if (!fpToken || fpToken.length !== 8) errs.token = "Enter the 8-digit token from your admin";
    if (!fpPassword || fpPassword.length < 6) errs.password = "Min 6 characters";
    setFpErrors(errs);
    if (Object.keys(errs).length > 0) return;

    setFpLoading(true);
    try {
      await api.post("/auth/reset-password", {
        username: fpUsername,
        token: fpToken,
        newPassword: fpPassword,
      });
      toast("Password reset! You can now sign in.", "success");
      // Return to login form with username pre-filled
      setForm((p) => ({ ...p, username: fpUsername }));
      setForgot("none");
      setFpUsername(""); setFpToken(""); setFpPassword("");
    } catch (err) {
      toast(err.response?.data?.message || "Reset failed.", "error");
    } finally {
      setFpLoading(false);
    }
  };

  const cancelForgot = () => {
    setForgot("none");
    setFpErrors({});
    setFpUsername(""); setFpToken(""); setFpPassword("");
  };

  // Register handler
  const handleRegister = async (e) => {
    e.preventDefault();
    const errs = {};
    if (!regForm.username)                        errs.username = "Required";
    if (!regForm.password || regForm.password.length < 6) errs.password = "Min 6 characters";
    if (regForm.password !== regForm.confirm)     errs.confirm  = "Passwords do not match";
    setRegErrors(errs);
    if (Object.keys(errs).length > 0) return;
    setRegLoading(true);
    try {
      await api.post("/auth/register", { username: regForm.username, password: regForm.password });
      toast("Account created! You can now sign in.", "success");
      setForm((p) => ({ ...p, username: regForm.username }));
      setRegForm({ username: "", password: "", confirm: "" });
      setView("login");
    } catch (err) {
      toast(err.response?.data?.message || "Registration failed.", "error");
    } finally {
      setRegLoading(false);
    }
  };

  // ── What to render inside the white card ─────────────────────────────────
  const renderCard = () => {
    // ── Register ──
    if (view === "register") {
      return (
        <div className="form-in">
          <button onClick={() => setView("login")} className="flex items-center gap-1 text-xs text-gray-400 hover:text-gray-600 mb-4">
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
            Back to login
          </button>
          <h2 className="text-base font-bold text-gray-800 mb-1">Create Account</h2>
          <p className="text-gray-400 text-sm mb-5">You'll be registered as <span className="font-medium text-gray-600">staff</span></p>
          <form onSubmit={handleRegister} className="space-y-3">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1.5">Username</label>
              <input
                className={`w-full border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${regErrors.username ? "border-red-400" : "border-gray-200"}`}
                placeholder="Choose a username"
                value={regForm.username}
                onChange={(e) => { setRegForm((p) => ({ ...p, username: e.target.value })); setRegErrors((p) => ({ ...p, username: "" })); }}
                autoFocus
              />
              {regErrors.username && <p className="text-red-500 text-xs mt-0.5">{regErrors.username}</p>}
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1.5">Password</label>
              <div className="relative">
                <input
                  type={regShowPass ? "text" : "password"}
                  className={`w-full border rounded-lg px-3 py-2.5 text-sm pr-10 focus:outline-none focus:ring-2 focus:ring-blue-500 ${regErrors.password ? "border-red-400" : "border-gray-200"}`}
                  placeholder="Min 6 characters"
                  value={regForm.password}
                  onChange={(e) => { setRegForm((p) => ({ ...p, password: e.target.value })); setRegErrors((p) => ({ ...p, password: "" })); }}
                />
                <button type="button" onClick={() => setRegShowPass(!regShowPass)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  <EyeIcon show={regShowPass} />
                </button>
              </div>
              <StrengthBar password={regForm.password} />
              {regErrors.password && <p className="text-red-500 text-xs mt-0.5">{regErrors.password}</p>}
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1.5">Confirm Password</label>
              <input
                type="password"
                className={`w-full border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${regErrors.confirm ? "border-red-400" : "border-gray-200"}`}
                placeholder="Repeat password"
                value={regForm.confirm}
                onChange={(e) => { setRegForm((p) => ({ ...p, confirm: e.target.value })); setRegErrors((p) => ({ ...p, confirm: "" })); }}
              />
              {regErrors.confirm && <p className="text-red-500 text-xs mt-0.5">{regErrors.confirm}</p>}
            </div>
            <button
              type="submit"
              disabled={regLoading}
              className="w-full bg-blue-700 text-white py-2.5 rounded-lg font-semibold hover:bg-blue-800 disabled:opacity-60 transition-colors mt-1"
            >
              {regLoading ? "Creating account..." : "Create Account"}
            </button>
          </form>
        </div>
      );
    }

    // ── Forgot step 1: username + instructions ──
    if (forgot === "step1") {
      return (
        <div className="form-in">
          <button onClick={cancelForgot} className="flex items-center gap-1 text-xs text-gray-400 hover:text-gray-600 mb-4">
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
            Back to login
          </button>
          <h2 className="text-base font-bold text-gray-800 mb-1">Forgot Password</h2>
          <p className="text-gray-400 text-sm mb-4">Enter your username. Your admin will generate a reset token for you.</p>

          <form onSubmit={handleForgotStep1} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1.5">Username</label>
              <input
                className={`w-full border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${fpErrors.username ? "border-red-400" : "border-gray-200"}`}
                placeholder="Your username"
                value={fpUsername}
                onChange={(e) => { setFpUsername(e.target.value); setFpErrors({}); }}
                autoFocus
              />
              {fpErrors.username && <p className="text-red-500 text-xs mt-0.5">{fpErrors.username}</p>}
            </div>

            {/* Admin instructions box */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-xs text-blue-700 space-y-1">
              <p className="font-semibold">Next steps:</p>
              <p>1. Contact your administrator with your username.</p>
              <p>2. Admin will generate an <strong>8-digit token</strong> for you.</p>
              <p>3. Come back here and click <strong>"I have my token"</strong>.</p>
            </div>

            <div className="flex gap-2">
              <button
                type="submit"
                disabled={fpLoading}
                className="flex-1 bg-blue-700 text-white py-2.5 rounded-lg font-semibold hover:bg-blue-800 disabled:opacity-60 text-sm"
              >
                I have my token →
              </button>
            </div>
          </form>
        </div>
      );
    }

    // ── Forgot step 2: enter token + new password ──
    if (forgot === "step2") {
      return (
        <div className="form-in">
          <button onClick={() => setForgot("step1")} className="flex items-center gap-1 text-xs text-gray-400 hover:text-gray-600 mb-4">
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
            Back
          </button>
          <h2 className="text-base font-bold text-gray-800 mb-1">Reset Password</h2>
          <p className="text-gray-400 text-xs mb-4">
            Resetting for: <span className="font-semibold text-gray-700">{fpUsername}</span>
          </p>

          <form onSubmit={handleForgotStep2} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1.5">8-Digit Token (from admin)</label>
              <input
                className={`w-full border rounded-lg px-3 py-2.5 text-sm font-mono tracking-widest focus:outline-none focus:ring-2 focus:ring-blue-500 ${fpErrors.token ? "border-red-400" : "border-gray-200"}`}
                placeholder="12345678"
                maxLength={8}
                value={fpToken}
                onChange={(e) => { setFpToken(e.target.value.replace(/\D/g, "")); setFpErrors((p) => ({ ...p, token: "" })); }}
                autoFocus
              />
              {fpErrors.token && <p className="text-red-500 text-xs mt-0.5">{fpErrors.token}</p>}
              <p className="text-gray-400 text-xs mt-1">{fpToken.length}/8 digits</p>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1.5">New Password</label>
              <div className="relative">
                <input
                  type={fpShowPass ? "text" : "password"}
                  className={`w-full border rounded-lg px-3 py-2.5 text-sm pr-10 focus:outline-none focus:ring-2 focus:ring-blue-500 ${fpErrors.password ? "border-red-400" : "border-gray-200"}`}
                  placeholder="New password"
                  value={fpPassword}
                  onChange={(e) => { setFpPassword(e.target.value); setFpErrors((p) => ({ ...p, password: "" })); }}
                />
                <button type="button" onClick={() => setFpShowPass(!fpShowPass)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  <EyeIcon show={fpShowPass} />
                </button>
              </div>
              <StrengthBar password={fpPassword} />
              {fpErrors.password && <p className="text-red-500 text-xs mt-0.5">{fpErrors.password}</p>}
            </div>

            <button
              type="submit"
              disabled={fpLoading || fpToken.length !== 8}
              className="w-full bg-blue-700 text-white py-2.5 rounded-lg font-semibold hover:bg-blue-800 disabled:opacity-50 transition-colors text-sm"
            >
              {fpLoading ? "Resetting..." : "Reset Password"}
            </button>
          </form>
        </div>
      );
    }

    // ── Default: login form ──
    return (
      <>
        <h2 className="text-lg font-bold text-gray-800 mb-0.5">Welcome back</h2>
        <p className="text-gray-400 text-sm mb-5">Sign in to your account</p>

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1.5">Username</label>
            <input
              className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter username"
              value={form.username}
              onChange={(e) => setForm({ ...form, username: e.target.value })}
              required
              autoFocus
            />
          </div>
          <div>
            <div className="flex justify-between items-center mb-1.5">
              <label className="text-xs font-medium text-gray-700">Password</label>
              <button
                type="button"
                onClick={() => { setFpUsername(form.username); setForgot("step1"); }}
                className="text-xs text-blue-600 hover:text-blue-800 hover:underline"
              >
                Forgot password?
              </button>
            </div>
            <div className="relative">
              <input
                type={showPass ? "text" : "password"}
                className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 pr-10"
                placeholder="Enter password"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                required
              />
              <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                <EyeIcon show={showPass} />
              </button>
            </div>
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-700 text-white py-2.5 rounded-lg font-semibold hover:bg-blue-800 disabled:opacity-60 transition-colors"
          >
            {loading ? "Signing in..." : "Sign In"}
          </button>
        </form>

        <div className="flex items-center gap-2 my-4">
          <div className="flex-1 h-px bg-gray-200" />
          <span className="text-xs text-gray-400">or</span>
          <div className="flex-1 h-px bg-gray-200" />
        </div>

        <button
          onClick={() => { setView("register"); setRegErrors({}); setRegForm({ username: "", password: "", confirm: "" }); }}
          className="w-full border border-blue-200 text-blue-700 py-2.5 rounded-lg font-semibold hover:bg-blue-50 transition-colors text-sm"
        >
          Create Account
        </button>

        <p className="text-center text-xs text-gray-400 mt-4">
          New accounts are registered as <span className="font-medium">staff</span>.
        </p>
      </>
    );
  };

  return (
    <>
      <style>{`
        @keyframes walkIn {
          0%   { transform: translateX(-140px); opacity: 0; }
          30%  { opacity: 1; }
          100% { transform: translateX(0px); opacity: 1; }
        }
        @keyframes keyTurn {
          0%,70% { transform: rotate(0deg); }
          80%    { transform: rotate(-40deg); }
          90%    { transform: rotate(10deg); }
          100%   { transform: rotate(0deg); }
        }
        @keyframes bounce {
          0%,100% { transform: translateY(0); }
          50%     { transform: translateY(-6px); }
        }
        @keyframes formSlideUp {
          from { opacity: 0; transform: translateY(20px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes pulseGlow {
          0%,100% { box-shadow: 0 0 0 0 rgba(59,130,246,0.5); }
          50%     { box-shadow: 0 0 0 12px rgba(59,130,246,0); }
        }
        .walk-in  { animation: walkIn 1.4s cubic-bezier(.25,.46,.45,.94) forwards; }
        .form-in  { animation: formSlideUp 0.4s ease forwards; }
        .btn-glow { animation: pulseGlow 2s infinite; }
        .char-bounce { animation: bounce 0.7s ease infinite; }
      `}</style>

      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-blue-900 via-blue-800 to-indigo-900 px-4">

        {/* ── Stage 1: Idle ── */}
        {stage === "idle" && (
          <div className="flex flex-col items-center gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-white/15 rounded-2xl flex items-center justify-center mx-auto mb-4 backdrop-blur">
                <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A2 2 0 013 12V7a4 4 0 014-4z" />
                </svg>
              </div>
              <h1 className="text-4xl font-black text-white tracking-tight">PMS</h1>
              <p className="text-blue-200 mt-2 text-sm">Promotion &amp; Marketing Subsystem</p>
            </div>
            <button onClick={startAnimation} className="btn-glow bg-white text-blue-700 font-bold text-lg px-12 py-4 rounded-2xl shadow-2xl hover:scale-105 transition-transform">
              <span className="flex items-center gap-3">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14" /></svg>
                Login
              </span>
            </button>
            <p className="text-blue-300 text-xs">Contact your administrator for access</p>
          </div>
        )}

        {/* ── Stage 2: Animating ── */}
        {stage === "animating" && (
          <div className="flex flex-col items-center gap-6">
            <p className="text-blue-200 text-sm font-medium animate-pulse">Unlocking system...</p>
            <div className="flex items-end justify-center gap-8 h-32">
              <div className="walk-in" style={{ marginBottom: "4px" }}>
                <Character style={{ animation: "walkIn 1.4s cubic-bezier(.25,.46,.45,.94) forwards, keyTurn 1.2s 1.2s ease forwards" }} />
              </div>
              <Cage open={false} />
            </div>
          </div>
        )}

        {/* ── Stage 3: Open — cage unlocked, card visible ── */}
        {stage === "open" && (
          <div className="flex flex-col items-center gap-5 w-full max-w-sm">
            <div className="flex items-end justify-center gap-6">
              <Character style={{ animation: "bounce 0.7s ease infinite" }} />
              <Cage open={true} />
            </div>
            <div className="bg-white rounded-2xl shadow-2xl p-6 w-full form-in">
              {renderCard()}
            </div>
          </div>
        )}
      </div>
    </>
  );
}
