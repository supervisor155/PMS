# PMS — Promotion and Marketing Subsystem

## Tech Stack
- **Backend**: Node.js, Express (ES7 modules), MySQL, express-session, bcryptjs
- **Frontend**: Vite + React, Tailwind CSS v4, Axios

---

## 1. Database Setup

1. Open MySQL and run:
   ```sql
   source backend/src/config/schema.sql
   ```
2. Update `backend/.env` with your MySQL credentials.

---

## 2. Create First Admin User

After running the schema, start the backend and run:
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123","role":"admin"}'
```

---

## 3. Run the Backend

```bash
cd backend
npm run dev
```
Server runs on **http://localhost:5000**

---

## 4. Run the Frontend

```bash
cd frontend
npm run dev
```
App runs on **http://localhost:5173**

---

## Project Structure

```
├── ERD.md                          # Entity Relationship Diagram
├── backend/
│   ├── .env                        # Environment variables
│   └── src/
│       ├── server.js               # Express app entry point
│       ├── config/
│       │   ├── db.js               # MySQL connection pool
│       │   └── schema.sql          # Full database schema
│       ├── middleware/
│       │   └── authMiddleware.js   # requireAuth, requireAdmin
│       ├── controllers/
│       │   ├── authController.js   # login, logout, register, me
│       │   ├── vehicleController.js
│       │   ├── customerController.js
│       │   ├── promotionController.js  # includes vehicle linking
│       │   └── interestController.js   # includes report generation
│       └── routes/
│           ├── authRoutes.js
│           ├── vehicleRoutes.js
│           ├── customerRoutes.js
│           ├── promotionRoutes.js
│           └── interestRoutes.js
└── frontend/
    └── src/
        ├── main.jsx                # React entry, wraps in AuthProvider
        ├── App.jsx                 # Page routing by state
        ├── api/index.js            # Axios instance with credentials
        ├── hooks/
        │   ├── useAuth.js          # Custom hook: session check, login, logout
        │   └── useFetch.js         # Custom hook: generic GET with refetch
        ├── components/
        │   ├── AuthContext.jsx     # Global auth context + useUser() hook
        │   ├── Navbar.jsx          # Top navigation
        │   └── Modal.jsx           # Reusable modal overlay
        └── pages/
            ├── LoginPage.jsx
            ├── DashboardPage.jsx
            ├── VehiclesPage.jsx
            ├── CustomersPage.jsx
            ├── PromotionsPage.jsx
            ├── InterestsPage.jsx
            └── ReportPage.jsx      # Filterable report with print support
```

---

## RBAC Summary

| Action                  | Admin | Staff |
|-------------------------|-------|-------|
| Login / Logout          | ✅    | ✅    |
| View all data           | ✅    | ✅    |
| Create/Edit vehicles    | ✅    | ❌    |
| Create/Edit customers   | ✅    | ✅    |
| Create/Edit promotions  | ✅    | ❌    |
| Link promotion→vehicle  | ✅    | ❌    |
| Add customer interest   | ✅    | ✅    |
| Delete any record       | ✅    | ❌    |
| View reports            | ✅    | ✅    |

---

## Promotion Validation Rules
1. A promotion can only be linked to a vehicle if the vehicle status is **available**.
2. A promotion can only be linked if today's date falls within **start_date** and **end_date**.

## Performance Metric
The `performance` field in `promotion_vehicle` tracks the **number of inquiries** a promotion generates for a specific vehicle. It is manually set when linking a vehicle to a promotion and can be updated any time.
