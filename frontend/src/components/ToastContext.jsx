/**
 * components/ToastContext.jsx
 * Global toast notification system. Replaces all browser alert() calls.
 * Provides: useToast() hook → { toast(message, type) }
 * Types: 'success' | 'error' | 'info'
 * Toasts auto-dismiss after 3 seconds.
 */

import { createContext, useContext, useState, useCallback } from "react";

const ToastContext = createContext(null);

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const toast = useCallback((message, type = "success") => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 3000);
  }, []);

  const remove = (id) => setToasts((prev) => prev.filter((t) => t.id !== id));

  const colors = {
    success: "bg-green-600",
    error:   "bg-red-600",
    info:    "bg-blue-600",
  };

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      {/* Toast container - bottom-right on desktop, bottom-center on mobile */}
      <div className="fixed bottom-4 right-4 left-4 sm:left-auto z-[100] flex flex-col gap-2 items-end">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`${colors[t.type]} text-white text-sm px-4 py-3 rounded-lg shadow-lg flex items-center gap-3 w-full sm:w-auto sm:min-w-64 animate-fade-in`}
          >
            <span className="flex-1">{t.message}</span>
            <button onClick={() => remove(t.id)} className="opacity-70 hover:opacity-100 text-lg leading-none">&times;</button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  return useContext(ToastContext);
}
