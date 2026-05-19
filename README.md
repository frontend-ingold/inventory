# Inventory Management System

Full-stack inventory management system with a React frontend and an Express backend.

## Modules

- Dashboard
- Products
- Categories
- Suppliers
- Customers
- Purchases
- Sales
- Stock adjustments
- Stock movement history

## Folder Structure

```text
inventory/
  backend/
    src/
      config/
      controllers/
      data/
      repositories/
      routes/
      services/
      utils/
  frontend/
    src/
      components/
      layouts/
      pages/
      services/
      styles/
```

## Run

Install dependencies:

```bash
npm install
```

Start backend:

```bash
npm run dev:backend
```

Start frontend:

```bash
npm run dev:frontend
```

Build frontend:

```bash
npm run build
```

## Notes

- Backend API base URL: `http://localhost:5000/api`
- Frontend dev server: `http://localhost:5173`
- Data is persisted in `backend/src/data/store.json`
