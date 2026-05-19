import { getPool } from "../config/database.js";
import { env } from "../config/env.js";
import { hashPassword } from "../utils/auth.js";

const schemaSql = `
create extension if not exists pgcrypto;

create table if not exists categories (
  id text primary key,
  name text not null,
  description text default '',
  created_at timestamptz not null default now()
);

create table if not exists suppliers (
  id text primary key,
  name text not null,
  email text default '',
  phone text default '',
  address text default '',
  created_at timestamptz not null default now()
);

create table if not exists customers (
  id text primary key,
  name text not null,
  email text default '',
  phone text default '',
  address text default '',
  created_at timestamptz not null default now()
);

create table if not exists products (
  id text primary key,
  sku text not null unique,
  name text not null,
  category_id text references categories(id) on delete set null,
  supplier_id text references suppliers(id) on delete set null,
  unit text not null default 'pcs',
  price numeric(12, 2) not null default 0,
  cost_price numeric(12, 2) not null default 0,
  quantity integer not null default 0,
  reorder_level integer not null default 0,
  status text not null default 'active',
  description text default '',
  created_at timestamptz not null default now()
);

create table if not exists purchases (
  id uuid primary key default gen_random_uuid(),
  supplier_id text references suppliers(id) on delete set null,
  notes text default '',
  total_amount numeric(12, 2) not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists purchase_items (
  id uuid primary key default gen_random_uuid(),
  purchase_id uuid not null references purchases(id) on delete cascade,
  product_id text not null references products(id) on delete restrict,
  product_name text not null,
  quantity integer not null,
  unit_price numeric(12, 2) not null,
  line_total numeric(12, 2) not null
);

create table if not exists sales (
  id uuid primary key default gen_random_uuid(),
  customer_id text references customers(id) on delete set null,
  notes text default '',
  total_amount numeric(12, 2) not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists sale_items (
  id uuid primary key default gen_random_uuid(),
  sale_id uuid not null references sales(id) on delete cascade,
  product_id text not null references products(id) on delete restrict,
  product_name text not null,
  quantity integer not null,
  unit_price numeric(12, 2) not null,
  line_total numeric(12, 2) not null
);

create table if not exists adjustments (
  id uuid primary key default gen_random_uuid(),
  product_id text not null references products(id) on delete restrict,
  quantity integer not null,
  type text not null check (type in ('increase', 'decrease')),
  reason text default '',
  created_at timestamptz not null default now()
);

create table if not exists stock_movements (
  id uuid primary key default gen_random_uuid(),
  product_id text not null references products(id) on delete restrict,
  type text not null,
  direction text not null check (direction in ('in', 'out')),
  quantity integer not null,
  reference text not null,
  note text default '',
  created_at timestamptz not null default now()
);

create table if not exists users (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null unique,
  password_hash text not null,
  role text not null default 'admin',
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);
`;

async function main() {
  const pool = getPool();
  await pool.query(schemaSql);
  const passwordHash = await hashPassword(env.adminPassword);
  await pool.query(
    `
      insert into users (name, email, password_hash, role, is_active)
      values ($1, $2, $3, 'admin', true)
      on conflict (email)
      do update set
        name = excluded.name,
        password_hash = excluded.password_hash,
        role = 'admin',
        is_active = true
    `,
    [env.adminName, env.adminEmail, passwordHash]
  );
  console.log("Database schema initialized.");
  await pool.end();
}

main().catch((error) => {
  console.error("Failed to initialize database schema.");
  console.error(error);
  process.exit(1);
});
