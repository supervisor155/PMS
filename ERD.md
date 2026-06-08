# Entity Relationship Diagram (ERD) - PMS

## Entities, Attributes & Keys

### users
| Column     | Type         | Key     | Notes              |
|------------|--------------|---------|--------------------|
| id         | INT          | PK      | Auto increment     |
| username   | VARCHAR(100) | UNIQUE  |                    |
| password   | VARCHAR(255) |         | bcrypt hashed      |
| role       | ENUM         |         | admin, staff       |
| created_at | TIMESTAMP    |         |                    |

### vehicles
| Column         | Type          | Key | Notes                            |
|----------------|---------------|-----|----------------------------------|
| id             | INT           | PK  |                                  |
| plate_number   | VARCHAR(20)   | UQ  |                                  |
| brand          | VARCHAR(100)  |     |                                  |
| model          | VARCHAR(100)  |     |                                  |
| year           | YEAR          |     |                                  |
| vehicle_type   | VARCHAR(50)   |     |                                  |
| purchase_price | DECIMAL(12,2) |     |                                  |
| status         | ENUM          |     | available, unavailable, sold     |
| registered_by  | INT           | FK  | → users(id)                      |
| created_at     | TIMESTAMP     |     |                                  |

### customers
| Column        | Type         | Key | Notes                      |
|---------------|--------------|-----|----------------------------|
| id            | INT          | PK  |                            |
| firstname     | VARCHAR(100) |     |                            |
| lastname      | VARCHAR(100) |     |                            |
| email         | VARCHAR(150) | UQ  |                            |
| phonenumber   | VARCHAR(20)  |     |                            |
| status        | ENUM         |     | active, inactive, blocked  |
| registered_by | INT          | FK  | → users(id)                |
| created_at    | TIMESTAMP    |     |                            |

### promotions
| Column        | Type          | Key | Notes                                                                    |
|---------------|---------------|-----|--------------------------------------------------------------------------|
| id            | INT           | PK  |                                                                          |
| title         | ENUM          |     | new year sale, holiday price slash, weekend flash sale, etc.             |
| description   | TEXT          |     |                                                                          |
| discount_type | ENUM          |     | free, percentage, FLAT_RATE, CASHBACK, BUY_ONE_GET_ONE, Bundle, amount   |
| discount_value| DECIMAL(10,2) |     |                                                                          |
| start_date    | DATE          |     |                                                                          |
| end_date      | DATE          |     |                                                                          |
| status        | ENUM          |     | active, inactive, expired                                                |
| created_by    | INT           | FK  | → users(id)                                                              |
| created_at    | TIMESTAMP     |     |                                                                          |

### promotion_vehicle  (Junction Table)
| Column       | Type | Key    | Notes                                  |
|--------------|------|--------|----------------------------------------|
| id           | INT  | PK     |                                        |
| promotion_id | INT  | FK     | → promotions(id)                       |
| vehicle_id   | INT  | FK     | → vehicles(id)                         |
| performance  | INT  |        | Number of inquiries generated          |
| —            | —    | UQ     | (promotion_id, vehicle_id) composite   |

### customer_interest  (Junction Table)
| Column      | Type      | Key | Notes                                |
|-------------|-----------|-----|--------------------------------------|
| id          | INT       | PK  |                                      |
| customer_id | INT       | FK  | → customers(id)                      |
| vehicle_id  | INT       | FK  | → vehicles(id)                       |
| created_at  | TIMESTAMP |     |                                      |
| —           | —         | UQ  | (customer_id, vehicle_id) composite  |

---

## Relationships

```
users ──< vehicles          (1 user registers many vehicles)
users ──< customers         (1 user registers many customers)
users ──< promotions        (1 user creates many promotions)
promotions >──< vehicles    (via promotion_vehicle — M:N)
customers  >──< vehicles    (via customer_interest  — M:N)
```

## ERD Diagram (Text)

```
┌──────────┐         ┌───────────────────┐         ┌────────────┐
│  users   │1──────n│     vehicles      │n──────n│ promotions │
│──────────│         │───────────────────│         │────────────│
│ id (PK)  │         │ id (PK)           │         │ id (PK)    │
│ username │         │ plate_number (UQ) │         │ title      │
│ password │         │ brand             │  via     │ discount.. │
│ role     │         │ model             │promotion_│ start_date │
└──────────┘         │ year              │vehicle   │ end_date   │
     │               │ vehicle_type      │          │ status     │
     │ 1             │ purchase_price    │          │created_by─►│
     │               │ status            │          └────────────┘
     ▼ n             │ registered_by ───►│
┌──────────┐         └───────────────────┘
│customers │               │ n
│──────────│               │
│ id (PK)  │               │ via customer_interest
│firstname │               │
│lastname  │         ┌─────▼──────────────┐
│ email(UQ)│◄───────n│ customer_interest  │
│ phone    │         │────────────────────│
│ status   │         │ customer_id (FK)   │
│reg_by ──►│         │ vehicle_id  (FK)   │
└──────────┘         └────────────────────┘
```
