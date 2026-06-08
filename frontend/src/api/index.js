/**
 * api/index.js
 * Axios instance configured with the base URL and credentials (cookies).
 * All API calls in the app import from this file to ensure session cookies are sent.
 */

import axios from "axios";

const api = axios.create({
  baseURL: "/api",
  withCredentials: true, // Required for session cookies
});

export default api;
