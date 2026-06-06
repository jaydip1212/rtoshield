-- Brand intelligence, uploaded instructions, pincode intelligence, and webhook management.

create table if not exists brand_profiles (
  org_id uuid primary key references organizations(id) on delete cascade,
  system_instructions text not null default '',
  brand_context text not null default '',
  verification_policy text not null default '',
  daily_learning_enabled boolean not null default true,
  updated_at timestamptz not null default now()
);

create table if not exists pincode_intelligence (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organizations(id) on delete cascade,
  pincode text not null,
  city text,
  zone text,
  rto_rate numeric not null default 0,
  cod_success_rate numeric not null default 0,
  avg_delivery_days numeric,
  notes text,
  updated_at timestamptz not null default now(),
  unique (org_id, pincode)
);
create index if not exists pincode_intelligence_org_pin_idx on pincode_intelligence (org_id, pincode);

create table if not exists webhook_endpoints (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organizations(id) on delete cascade,
  platform text not null,
  endpoint_url text not null,
  public_key text,
  status text not null default 'ready',
  last_event_at timestamptz,
  created_at timestamptz not null default now(),
  unique (org_id, platform)
);

alter table brand_profiles enable row level security;
alter table brand_profiles force row level security;
drop policy if exists brand_profiles_tenant_isolation on brand_profiles;
create policy brand_profiles_tenant_isolation on brand_profiles
  using (org_id in (select current_user_org_ids()))
  with check (org_id in (select current_user_org_ids()));

alter table pincode_intelligence enable row level security;
alter table pincode_intelligence force row level security;
drop policy if exists pincode_intelligence_tenant_isolation on pincode_intelligence;
create policy pincode_intelligence_tenant_isolation on pincode_intelligence
  using (org_id in (select current_user_org_ids()))
  with check (org_id in (select current_user_org_ids()));

alter table webhook_endpoints enable row level security;
alter table webhook_endpoints force row level security;
drop policy if exists webhook_endpoints_tenant_isolation on webhook_endpoints;
create policy webhook_endpoints_tenant_isolation on webhook_endpoints
  using (org_id in (select current_user_org_ids()))
  with check (org_id in (select current_user_org_ids()));
