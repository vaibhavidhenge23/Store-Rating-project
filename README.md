# Store Ratings Platform

A full-stack web application where users can rate stores (1 to 5), with three roles: System Administrator, Normal User, and Store Owner.

## Tech Stack

- **Backend**: Express.js, PostgreSQL (Neon), JWT authentication, bcrypt
- **Frontend**: React (Vite), Tailwind CSS, React Router

## Project Structure

```
store-ratings/
├── backend/
│   ├── src/
│   │   ├── db/            # DB connection pool + schema.sql
│   │   ├── middleware/     # JWT auth + role guard
│   │   ├── routes/         # auth, admin, user, storeOwner routes
│   │   ├── utils/          # validators
│   │   └── server.js
│   └── package.json
└── frontend/
    ├── src/
    │   ├── api/            # fetch wrapper
    │   ├── components/     # shared UI components
    │   ├── context/        # auth context
    │   ├── pages/          # route pages
    │   └── App.jsx
    └── package.json
```

## Setup

### 1. Database

Create a PostgreSQL database (Neon or local) and run the schema:

```
backend/src/db/schema.sql
```

Neon: paste the file content into the Neon SQL Editor and run it.

### 2. Backend

```bash
cd backend
cp .env.example .env
```

Edit `.env` and set your `DATABASE_URL` (Neon connection string) and a `JWT_SECRET`.

```bash
npm install
npm run dev
```

Runs on `http://localhost:5000`.

### 3. Frontend

```bash
cd frontend
cp .env.example .env
npm install
npm run dev
```

Runs on `http://localhost:5173`.

## Creating the First Admin / Store Owner

Signup (`/signup`) only creates Normal Users, by design (matches the spec - only admins can create admin/store owner accounts). To bootstrap your first admin:

1. Sign up normally through the app.
2. In the database, run:

```sql
UPDATE users SET role = 'admin' WHERE email = 'your-email@example.com';
```

To make a store owner and link them to a store:

```sql
UPDATE users SET role = 'store_owner' WHERE email = 'owner-email@example.com';

INSERT INTO stores (name, email, address, owner_id)
VALUES (
  'Store Name Here',
  'store-contact@example.com',
  'Store Address',
  (SELECT id FROM users WHERE email = 'owner-email@example.com')
);
```

Once an admin account exists, all further admin/store owner accounts can be created directly from the Admin dashboard (`/admin/users`).

## Roles & Access

| Role | Route after login | Can do |
|---|---|---|
| Admin | `/admin` | Dashboard stats, manage users, manage stores, filters/sorting |
| Normal User | `/stores` | Browse/search stores, submit or update rating (1-5), change password |
| Store Owner | `/store-owner` | View average rating, list of raters, change password |

## Validation Rules

- **Name**: 20-60 characters
- **Address**: max 400 characters
- **Password**: 8-16 characters, at least one uppercase letter and one special character
- **Email**: standard email format
- **Rating**: integer, 1-5

## Database Schema

- `users` — holds all three roles (`admin`, `user`, `store_owner`) in one table with a `role` column, since login is unified.
- `stores` — each store optionally links to a store owner via `owner_id`.
- `ratings` — one row per (user, store) pair, enforced by a unique constraint. Submitting a rating again updates the existing row instead of creating a duplicate, so "submit" and "modify" are the same operation.

Average ratings are computed with `AVG()` at query time rather than stored as a column, so they're never out of sync.

## API Overview

- `POST /api/auth/signup` - normal user signup
- `POST /api/auth/login` - login for all roles
- `PUT /api/auth/password` - change password (authenticated)
- `GET /api/admin/dashboard` - stats
- `POST /api/admin/users` - add user (any role)
- `GET /api/admin/users` - list/filter/sort users
- `GET /api/admin/users/:id` - user details
- `POST /api/admin/stores` - add store
- `GET /api/admin/stores` - list/filter/sort stores
- `GET /api/user/stores` - browse/search stores with own rating
- `POST /api/user/ratings/:storeId` - submit/update rating
- `GET /api/store-owner/dashboard` - average rating + raters list
