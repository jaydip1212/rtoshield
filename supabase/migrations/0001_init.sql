-- RTOShield initial schema + Row Level Security.
-- Every tenant table carries org_id and enables RLS. Service role bypasses RLS
-- and is used ONLY server-side (jobs/webhooks).

create extension if not exists "pgcrypto";
create extension if not exists "vector";

-- ---------- Tenancy ----------
create table organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  salt text not null,
  retention_days int not null default 365,
  created_at timestamptz not null default now()
);

create table users (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organizations(id) on delete cascade,
  auth_user_id uuid unique,            -- maps to supabase auth.users.id
  email text not null,
  role text not null default 'member', -- owner | admin | member
  created_at timestamptz not null default now()
);

-- Helper: orgs the current auth user belongs to.
create or replace function current_user_org_ids()
returns setof uuid language sql stable as $$
  select org_id from users where auth_user_id = auth.uid()
$$;

create table stores (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organizations(id) on delete cascade,
  platform text not null,              -- shopify | woocommerce | manual
  name text,
  domain text,
  encrypted_token text,                -- AES-256-GCM, server-side only
  created_at timestamptz not null default now()
);

create table api_keys (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organizations(id) on delete cascade,
  name text,
  hashed_key text not null,
  public_key text not null unique,     -- safe to embed in SDK
  scopes text[] not null default '{}',
  last_used_at timestamptz,
  created_at timestamptz not null default now()
);

-- ---------- Customers + Orders ----------
create table customers (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organizations(id) on delete cascade,
  phone_hash text,
  email_hash text,
  address_hash text,
  successful_deliveries int not null default 0,
  rto_count int not null default 0,
  created_at timestamptz not null default now()
);
create index on customers (org_id, phone_hash);
create index on customers (org_id, address_hash);

create table orders (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organizations(id) on delete cascade,
  store_id uuid references stores(id) on delete set null,
  customer_id uuid references customers(id) on delete set null,
  external_id text,
  payment_method text not null,        -- cod | prepaid
  total numeric not null default 0,
  currency text not null default 'INR',
  pincode text,
  city text,
  address_complete boolean not null default true,
  status text not null default 'received',
  verified boolean not null default false,
  utm jsonb,
  created_at timestamptz not null default now()
);
create index on orders (org_id, created_at desc);
create unique index on orders (org_id, external_id);

create table order_events (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organizations(id) on delete cascade,
  order_id uuid not null references orders(id) on delete cascade,
  type text not null,                  -- ndr | delivered | rto | verified | note
  payload jsonb,
  created_at timestamptz not null default now()
);

create table device_signals (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organizations(id) on delete cascade,
  order_id uuid references orders(id) on delete set null,
  checkout_id text,
  session_id text,
  device_token_hash text,
  ip_hash text,
  coarse_geo text,                     -- e.g. city/region only
  asn text,
  isp text,
  vpn_flag boolean not null default false,
  user_agent text,
  timezone text,
  language text,
  screen_category text,                -- mobile | tablet | desktop
  referrer text,
  utm jsonb,
  created_at timestamptz not null default now()
);
create index on device_signals (org_id, device_token_hash);
create index on device_signals (org_id, ip_hash);

-- ---------- Risk ----------
create table risk_rules (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organizations(id) on delete cascade,
  code text not null,
  weight int not null,
  enabled boolean not null default true,
  unique (org_id, code)
);

create table risk_decisions (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organizations(id) on delete cascade,
  order_id uuid not null references orders(id) on delete cascade,
  score int not null,
  level text not null,                 -- low | medium | high | critical
  reasons jsonb not null default '[]',
  recommended_action text not null,
  created_at timestamptz not null default now()
);
create index on risk_decisions (org_id, order_id, created_at desc);

create table rto_cases (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organizations(id) on delete cascade,
  order_id uuid references orders(id) on delete set null,
  courier text,
  reason text,
  occurred_at timestamptz,
  created_at timestamptz not null default now()
);

-- ---------- RAG ----------
create table documents (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organizations(id) on delete cascade,
  type text not null,                  -- return_policy | shipping_policy | cod_policy | courier_sop | support_sop | fraud_notes | pincode_rules
  title text not null,
  created_at timestamptz not null default now()
);

create table document_chunks (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organizations(id) on delete cascade,
  document_id uuid not null references documents(id) on delete cascade,
  idx int not null,
  content text not null
);

create table embeddings (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organizations(id) on delete cascade,
  chunk_id uuid not null references document_chunks(id) on delete cascade,
  embedding vector(1536)
);
create index on embeddings using ivfflat (embedding vector_cosine_ops) with (lists = 100);

-- ---------- Agent + audit ----------
create table agent_actions (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organizations(id) on delete cascade,
  order_id uuid references orders(id) on delete set null,
  action text not null,
  input jsonb,
  output jsonb,
  created_at timestamptz not null default now()
);

create table verification_messages (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organizations(id) on delete cascade,
  order_id uuid references orders(id) on delete set null,
  channel text not null,               -- whatsapp | sms | call
  body text not null,
  status text not null default 'draft',
  created_at timestamptz not null default now()
);

create table audit_logs (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organizations(id) on delete cascade,
  actor text,                          -- user id or 'system'
  action text not null,
  target text,
  metadata jsonb,
  created_at timestamptz not null default now()
);
create index on audit_logs (org_id, created_at desc);

-- ---------- Row Level Security ----------
do $$
declare t text;
begin
  foreach t in array array[
    'users','stores','api_keys','customers','orders','order_events',
    'device_signals','risk_rules','risk_decisions','rto_cases','documents',
    'document_chunks','embeddings','agent_actions','verification_messages','audit_logs'
  ] loop
    execute format('alter table %I enable row level security;', t);
    execute format('alter table %I force row level security;', t);
    execute format($f$
      create policy %1$s_tenant_isolation on %1$I
        using (org_id in (select current_user_org_ids()))
        with check (org_id in (select current_user_org_ids()));
    $f$, t);
  end loop;
end $$;

-- organizations: a user can read orgs they belong to.
alter table organizations enable row level security;
alter table organizations force row level security;
create policy organizations_member_read on organizations
  using (id in (select current_user_org_ids()));
