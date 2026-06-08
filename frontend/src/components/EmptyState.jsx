/**
 * components/EmptyState.jsx
 * Friendly empty state shown when a list/table has no data.
 * Props:
 *   - message: string (e.g. "No vehicles found")
 *   - sub: optional subtitle string
 */

export default function EmptyState({ message, sub }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center px-4">
      <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mb-4">
        <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 17v-2a4 4 0 014-4h0a4 4 0 014 4v2M7 17v-2a6 6 0 0112 0v2M12 7a4 4 0 100-8 4 4 0 000 8z" />
        </svg>
      </div>
      <p className="text-gray-600 font-medium">{message}</p>
      {sub && <p className="text-gray-400 text-sm mt-1">{sub}</p>}
    </div>
  );
}
