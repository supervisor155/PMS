/**
 * hooks/useFetch.js
 * Custom hook: useFetch
 * Generic data fetching hook used by all list pages (vehicles, customers, promotions, etc.).
 *
 * Parameters:
 *   - url: API endpoint string (e.g. '/vehicles')
 *
 * Returns:
 *   - data: fetched array/object
 *   - loading: boolean
 *   - error: error message string or null
 *   - refetch: function to re-trigger the fetch
 */

import { useState, useEffect, useCallback } from "react";
import api from "../api/index.js";

export function useFetch(url) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetch = useCallback(() => {
    setLoading(true);
    api.get(url)
      .then((res) => setData(res.data))
      .catch((err) => setError(err.response?.data?.message || "Fetch failed."))
      .finally(() => setLoading(false));
  }, [url]);

  useEffect(() => { fetch(); }, [fetch]);

  return { data, loading, error, refetch: fetch };
}
