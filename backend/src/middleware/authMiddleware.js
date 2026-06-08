/**
 * authMiddleware.js
 * Middleware to protect routes that require an authenticated session.
 * Checks if req.session.user exists; if not, returns 401 Unauthorized.
 */

export const requireAuth = (req, res, next) => {
  if (!req.session.user) {
    return res.status(401).json({ message: "Unauthorized. Please log in." });
  }
  next();
};

/**
 * requireAdmin
 * Restricts access to admin-only routes.
 */
export const requireAdmin = (req, res, next) => {
  if (!req.session.user || req.session.user.role !== "admin") {
    return res.status(403).json({ message: "Forbidden. Admins only." });
  }
  next();
};
