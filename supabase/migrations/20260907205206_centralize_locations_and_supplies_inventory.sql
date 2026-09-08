begin;

create table if not exists public.countries (
  country_id uuid primary key default gen_random_uuid(),
  country_code varchar(10) not null,
  country_name varchar(150) not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint countries_country_code_key unique (country_code),
  constraint countries_country_code_not_blank check (btrim(country_code) <> ''),
  constraint countries_country_name_not_blank check (btrim(country_name) <> '')
);

create table if not exists public.provinces (
  province_id uuid primary key default gen_random_uuid(),
  country_id uuid not null references public.countries(country_id) on update cascade on delete restrict,
  province_code varchar(50),
  province_name varchar(150) not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint provinces_country_name_key unique (country_id, province_name),
  constraint provinces_province_name_not_blank check (btrim(province_name) <> '')
);

create table if not exists public.cantons (
  canton_id uuid primary key default gen_random_uuid(),
  province_id uuid not null references public.provinces(province_id) on update cascade on delete restrict,
  canton_code varchar(50),
  canton_name varchar(150) not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint cantons_province_name_key unique (province_id, canton_name),
  constraint cantons_canton_name_not_blank check (btrim(canton_name) <> '')
);

create table if not exists public.districts (
  district_id uuid primary key default gen_random_uuid(),
  canton_id uuid not null references public.cantons(canton_id) on update cascade on delete restrict,
  district_code varchar(50),
  district_name varchar(150) not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint districts_canton_name_key unique (canton_id, district_name),
  constraint districts_district_name_not_blank check (btrim(district_name) <> '')
);

create table if not exists public.locations (
  location_id uuid primary key default gen_random_uuid(),
  customer_id uuid references public.customers(customer_id) on update cascade on delete cascade,
  supplier_id uuid,
  company_id uuid not null references public.companies(company_id) on update cascade on delete restrict,
  country_id uuid not null references public.countries(country_id) on update cascade on delete restrict,
  province_id uuid not null references public.provinces(province_id) on update cascade on delete restrict,
  canton_id uuid not null references public.cantons(canton_id) on update cascade on delete restrict,
  district_id uuid not null references public.districts(district_id) on update cascade on delete restrict,
  location varchar(500) not null,
  latitude double precision,
  longitude double precision,
  location_accuracy_meters double precision,
  is_primary boolean not null default true,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint locations_owner_check check (num_nonnulls(customer_id, supplier_id) <= 1),
  constraint locations_location_not_blank check (btrim(location) <> ''),
  constraint locations_latitude_range_check check (latitude is null or (latitude >= -90 and latitude <= 90)),
  constraint locations_longitude_range_check check (longitude is null or (longitude >= -180 and longitude <= 180)),
  constraint locations_accuracy_check check (location_accuracy_meters is null or location_accuracy_meters >= 0)
);

alter table if exists public.suppliers
  add column if not exists supplier_type text not null default 'general',
  add column if not exists supplier_representative_id uuid,
  add column if not exists updated_at timestamptz not null default now();

create table if not exists public.suppliers (
  supplier_id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(company_id) on update cascade on delete restrict,
  supplier_representative_id uuid,
  name text not null,
  supplier_type text not null default 'general',
  activity_code text not null,
  is_active boolean not null default true,
  created_by uuid default auth.uid() references public.profiles(user_id) on update cascade on delete set null,
  updated_by uuid default auth.uid() references public.profiles(user_id) on update cascade on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint suppliers_name_not_blank check (btrim(name) <> ''),
  constraint suppliers_activity_code_not_blank check (btrim(activity_code) <> ''),
  constraint suppliers_type_not_blank check (btrim(supplier_type) <> '')
);

alter table if exists public.supplier_representatives
  add column if not exists updated_at timestamptz not null default now();

create table if not exists public.supplier_representatives (
  representative_id uuid primary key default gen_random_uuid(),
  supplier_id uuid not null references public.suppliers(supplier_id) on update cascade on delete cascade,
  name text not null,
  is_primary boolean not null default false,
  is_active boolean not null default true,
  created_by uuid default auth.uid() references public.profiles(user_id) on update cascade on delete set null,
  updated_by uuid default auth.uid() references public.profiles(user_id) on update cascade on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint supplier_representatives_name_not_blank check (btrim(name) <> '')
);

do $$
begin
  if to_regclass('public.supplies_categories') is null
     and to_regclass('public.supply_categories') is not null then
    alter table public.supply_categories rename to supplies_categories;
  end if;
end $$;

create table if not exists public.supplies_categories (
  supplies_category_id uuid primary key default gen_random_uuid(),
  category varchar(150) not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint supplies_categories_category_key unique (category),
  constraint supplies_categories_category_not_blank check (btrim(category) <> '')
);

do $$
begin
  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'supplies_categories'
      and column_name = 'supply_category_id'
  ) and not exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'supplies_categories'
      and column_name = 'supplies_category_id'
  ) then
    alter table public.supplies_categories
      rename column supply_category_id to supplies_category_id;
  end if;

  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'supplies_categories'
      and column_name = 'name'
  ) and not exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'supplies_categories'
      and column_name = 'category'
  ) then
    alter table public.supplies_categories
      rename column name to category;
  end if;

  alter table public.supplies_categories
    drop column if exists company_id,
    drop column if exists description;
end $$;

create unique index if not exists supplies_categories_category_key
  on public.supplies_categories(category);

insert into public.supplies_categories (category)
values ('General')
on conflict (category) do nothing;

create table if not exists public.supplies_inventory (
  supplies_id uuid primary key default gen_random_uuid(),
  supplier_id uuid not null references public.suppliers(supplier_id) on update cascade on delete restrict,
  company_id uuid not null references public.companies(company_id) on update cascade on delete restrict,
  supplies_category_id uuid not null references public.supplies_categories(supplies_category_id) on update cascade on delete restrict,
  type varchar(150) not null,
  supply_name varchar(250) not null,
  amount integer not null default 0,
  measure varchar(100),
  status varchar(100) not null default 'active',
  entry_date timestamptz not null default now(),
  discharge_date timestamptz,
  next_entry timestamptz,
  time_period integer,
  period varchar(50),
  expiration_date timestamptz,
  notes varchar(500),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint supplies_inventory_type_not_blank check (btrim(type) <> ''),
  constraint supplies_inventory_supply_name_not_blank check (btrim(supply_name) <> ''),
  constraint supplies_inventory_amount_check check (amount >= 0),
  constraint supplies_inventory_time_period_check check (time_period is null or time_period > 0)
);

do $$
begin
  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'supplies_inventory'
      and column_name = 'supply_id'
  ) and not exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'supplies_inventory'
      and column_name = 'supplies_id'
  ) then
    alter table public.supplies_inventory
      rename column supply_id to supplies_id;
  end if;

  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'supplies_inventory'
      and column_name = 'supply_category_id'
  ) and not exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'supplies_inventory'
      and column_name = 'supplies_category_id'
  ) then
    alter table public.supplies_inventory
      rename column supply_category_id to supplies_category_id;
  end if;
end $$;

create table if not exists public.purchase_requests (
  purchase_request_id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(user_id) on update cascade on delete restrict,
  reviewed_by uuid references public.profiles(user_id) on update cascade on delete set null,
  approved_by uuid references public.profiles(user_id) on update cascade on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  approved_at timestamptz
);

create table if not exists public.purchase_request_items (
  purchase_request_item_id uuid primary key default gen_random_uuid(),
  purchase_request_id uuid not null references public.purchase_requests(purchase_request_id) on update cascade on delete cascade,
  supplies_id uuid references public.supplies_inventory(supplies_id) on update cascade on delete set null,
  type varchar(150),
  item_name varchar(250),
  amount integer not null default 1,
  measure varchar(100),
  time_period integer,
  period varchar(50),
  product_url varchar(1000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint purchase_request_items_amount_check check (amount > 0),
  constraint purchase_request_items_time_period_check check (time_period is null or time_period > 0),
  constraint purchase_request_items_product_url_not_blank check (product_url is null or btrim(product_url) <> ''),
  constraint purchase_request_items_item_reference_check
    check (supplies_id is not null or nullif(btrim(coalesce(item_name, '')), '') is not null)
);

create table if not exists public.files (
  file_id uuid primary key default gen_random_uuid(),
  purchase_request_item_id uuid not null references public.purchase_request_items(purchase_request_item_id) on update cascade on delete cascade,
  file_type varchar(100) not null,
  file_name varchar(255) not null,
  file_path text not null,
  public_url text not null,
  file_format varchar(100) not null,
  file_size integer,
  created_at timestamptz not null default now(),
  constraint files_file_type_not_blank check (btrim(file_type) <> ''),
  constraint files_file_name_not_blank check (btrim(file_name) <> ''),
  constraint files_file_path_not_blank check (btrim(file_path) <> ''),
  constraint files_public_url_not_blank check (btrim(public_url) <> ''),
  constraint files_file_format_not_blank check (btrim(file_format) <> ''),
  constraint files_file_size_check check (file_size is null or file_size >= 0)
);

create table if not exists public.purchase_order_items (
  purchase_order_item_id uuid primary key default gen_random_uuid(),
  purchase_order_id uuid not null,
  purchase_request_item_id uuid not null references public.purchase_request_items(purchase_request_item_id) on update cascade on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint purchase_order_items_request_item_key unique (purchase_request_item_id)
);

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conrelid = 'public.locations'::regclass
      and conname = 'locations_supplier_id_fkey'
  ) and to_regclass('public.suppliers') is not null then
    alter table public.locations
      add constraint locations_supplier_id_fkey
      foreign key (supplier_id)
      references public.suppliers(supplier_id)
      on update cascade
      on delete cascade;
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conrelid = 'public.suppliers'::regclass
      and conname = 'suppliers_supplier_representative_id_fkey'
  ) then
    alter table public.suppliers
      add constraint suppliers_supplier_representative_id_fkey
      foreign key (supplier_representative_id)
      references public.supplier_representatives(representative_id)
      on update cascade
      on delete set null;
  end if;

  if to_regclass('public.purchase_orders') is not null
     and not exists (
       select 1
       from pg_constraint
       where conrelid = 'public.purchase_order_items'::regclass
         and conname = 'purchase_order_items_purchase_order_id_fkey'
     ) then
    alter table public.purchase_order_items
      add constraint purchase_order_items_purchase_order_id_fkey
      foreign key (purchase_order_id)
      references public.purchase_orders(purchase_order_id)
      on update cascade
      on delete cascade;
  end if;
end $$;

create index if not exists provinces_country_id_idx on public.provinces(country_id);
create index if not exists cantons_province_id_idx on public.cantons(province_id);
create index if not exists districts_canton_id_idx on public.districts(canton_id);
create index if not exists locations_customer_id_idx on public.locations(customer_id);
create index if not exists locations_supplier_id_idx on public.locations(supplier_id);
create index if not exists locations_company_id_idx on public.locations(company_id);
create index if not exists locations_geo_idx on public.locations(country_id, province_id, canton_id, district_id);
create unique index if not exists locations_primary_customer_key
  on public.locations(customer_id)
  where customer_id is not null and is_primary = true and is_active = true;
create unique index if not exists locations_primary_supplier_key
  on public.locations(supplier_id)
  where supplier_id is not null and is_primary = true and is_active = true;
create index if not exists supplier_representatives_supplier_id_idx on public.supplier_representatives(supplier_id);
create index if not exists supplies_inventory_supplier_id_idx on public.supplies_inventory(supplier_id);
create index if not exists supplies_inventory_company_id_idx on public.supplies_inventory(company_id);
create index if not exists supplies_inventory_supplies_category_id_idx on public.supplies_inventory(supplies_category_id);
create index if not exists purchase_requests_user_id_idx on public.purchase_requests(user_id);
create index if not exists purchase_requests_reviewed_by_idx on public.purchase_requests(reviewed_by);
create index if not exists purchase_requests_approved_by_idx on public.purchase_requests(approved_by);
create index if not exists purchase_request_items_purchase_request_id_idx on public.purchase_request_items(purchase_request_id);
create index if not exists purchase_request_items_supplies_id_idx on public.purchase_request_items(supplies_id);
create index if not exists files_purchase_request_item_id_idx on public.files(purchase_request_item_id);
create index if not exists purchase_order_items_purchase_order_id_idx on public.purchase_order_items(purchase_order_id);
create index if not exists purchase_order_items_purchase_request_item_id_idx on public.purchase_order_items(purchase_request_item_id);

insert into public.countries (country_code, country_name)
values ('CR', 'Costa Rica')
on conflict (country_code) do update
set country_name = excluded.country_name,
    updated_at = now();

with country_seed as (
  select country_id
  from public.countries
  where country_code = 'CR'
),
customer_provinces as (
  select distinct
    country_seed.country_id,
    coalesce(nullif(btrim(customer.province), ''), 'Sin definir') as province_name
  from public.customers as customer
  cross join country_seed
)
insert into public.provinces (country_id, province_name)
select country_id, province_name
from customer_provinces
on conflict (country_id, province_name) do nothing;

with country_seed as (
  select country_id
  from public.countries
  where country_code = 'CR'
),
customer_cantons as (
  select distinct
    province.province_id,
    coalesce(nullif(btrim(customer.city), ''), 'Sin definir') as canton_name
  from public.customers as customer
  cross join country_seed
  join public.provinces as province
    on province.country_id = country_seed.country_id
   and province.province_name = coalesce(nullif(btrim(customer.province), ''), 'Sin definir')
)
insert into public.cantons (province_id, canton_name)
select province_id, canton_name
from customer_cantons
on conflict (province_id, canton_name) do nothing;

with country_seed as (
  select country_id
  from public.countries
  where country_code = 'CR'
),
customer_districts as (
  select distinct
    canton.canton_id,
    coalesce(nullif(btrim(customer.district), ''), 'Sin definir') as district_name
  from public.customers as customer
  cross join country_seed
  join public.provinces as province
    on province.country_id = country_seed.country_id
   and province.province_name = coalesce(nullif(btrim(customer.province), ''), 'Sin definir')
  join public.cantons as canton
    on canton.province_id = province.province_id
   and canton.canton_name = coalesce(nullif(btrim(customer.city), ''), 'Sin definir')
)
insert into public.districts (canton_id, district_name)
select canton_id, district_name
from customer_districts
on conflict (canton_id, district_name) do nothing;

with country_seed as (
  select country_id
  from public.countries
  where country_code = 'CR'
),
normalized_customer_locations as (
  select
    customer.customer_id,
    customer.company_id,
    country_seed.country_id,
    province.province_id,
    canton.canton_id,
    district.district_id,
    coalesce(nullif(btrim(customer.address), ''), 'Sin direccion registrada') as location,
    customer.latitude,
    customer.longitude,
    customer.location_accuracy_meters,
    customer.created_at,
    customer.updated_at
  from public.customers as customer
  cross join country_seed
  join public.provinces as province
    on province.country_id = country_seed.country_id
   and province.province_name = coalesce(nullif(btrim(customer.province), ''), 'Sin definir')
  join public.cantons as canton
    on canton.province_id = province.province_id
   and canton.canton_name = coalesce(nullif(btrim(customer.city), ''), 'Sin definir')
  join public.districts as district
    on district.canton_id = canton.canton_id
   and district.district_name = coalesce(nullif(btrim(customer.district), ''), 'Sin definir')
)
insert into public.locations (
  customer_id,
  company_id,
  country_id,
  province_id,
  canton_id,
  district_id,
  location,
  latitude,
  longitude,
  location_accuracy_meters,
  is_primary,
  created_at,
  updated_at
)
select
  customer_id,
  company_id,
  country_id,
  province_id,
  canton_id,
  district_id,
  location,
  latitude,
  longitude,
  location_accuracy_meters,
  true,
  created_at,
  updated_at
from normalized_customer_locations as source
where not exists (
  select 1
  from public.locations as existing
  where existing.customer_id = source.customer_id
    and existing.is_primary = true
    and existing.is_active = true
);

alter table public.countries enable row level security;
alter table public.provinces enable row level security;
alter table public.cantons enable row level security;
alter table public.districts enable row level security;
alter table public.locations enable row level security;
alter table public.suppliers enable row level security;
alter table public.supplier_representatives enable row level security;
alter table public.supplies_categories enable row level security;
alter table public.supplies_inventory enable row level security;
alter table public.purchase_requests enable row level security;
alter table public.purchase_request_items enable row level security;
alter table public.files enable row level security;
alter table public.purchase_order_items enable row level security;

grant select on table public.countries, public.provinces, public.cantons, public.districts to anon, authenticated;
grant select, insert, update, delete on table public.locations to authenticated;
grant select, insert, update, delete on table public.suppliers to authenticated;
grant select, insert, update, delete on table public.supplier_representatives to authenticated;
grant select, insert, update, delete on table public.supplies_categories to authenticated;
grant select, insert, update, delete on table public.supplies_inventory to authenticated;
grant select, insert, update, delete on table public.purchase_requests to authenticated;
grant select, insert, update, delete on table public.purchase_request_items to authenticated;
grant select, insert, update, delete on table public.files to authenticated;
grant select, insert, update, delete on table public.purchase_order_items to authenticated;

drop policy if exists "Authenticated users can read countries" on public.countries;
create policy "Authenticated users can read countries"
on public.countries
for select
to authenticated, anon
using (is_active = true);

drop policy if exists "Authenticated users can read provinces" on public.provinces;
create policy "Authenticated users can read provinces"
on public.provinces
for select
to authenticated, anon
using (is_active = true);

drop policy if exists "Authenticated users can read cantons" on public.cantons;
create policy "Authenticated users can read cantons"
on public.cantons
for select
to authenticated, anon
using (is_active = true);

drop policy if exists "Authenticated users can read districts" on public.districts;
create policy "Authenticated users can read districts"
on public.districts
for select
to authenticated, anon
using (is_active = true);

drop policy if exists "Authenticated users can manage locations" on public.locations;
create policy "Authenticated users can manage locations"
on public.locations
for all
to authenticated
using (true)
with check (true);

drop policy if exists "Authenticated users can manage suppliers" on public.suppliers;
create policy "Authenticated users can manage suppliers"
on public.suppliers
for all
to authenticated
using (true)
with check (true);

drop policy if exists "Authenticated users can manage supplier representatives" on public.supplier_representatives;
create policy "Authenticated users can manage supplier representatives"
on public.supplier_representatives
for all
to authenticated
using (true)
with check (true);

drop policy if exists "Authenticated users can manage supplies categories" on public.supplies_categories;
create policy "Authenticated users can manage supplies categories"
on public.supplies_categories
for all
to authenticated
using (true)
with check (true);

drop policy if exists "Authenticated users can manage supplies inventory" on public.supplies_inventory;
create policy "Authenticated users can manage supplies inventory"
on public.supplies_inventory
for all
to authenticated
using (true)
with check (true);

drop policy if exists "Authenticated users can manage purchase requests" on public.purchase_requests;
create policy "Authenticated users can manage purchase requests"
on public.purchase_requests
for all
to authenticated
using (true)
with check (true);

drop policy if exists "Authenticated users can manage purchase request items" on public.purchase_request_items;
create policy "Authenticated users can manage purchase request items"
on public.purchase_request_items
for all
to authenticated
using (true)
with check (true);

drop policy if exists "Authenticated users can manage purchase request files" on public.files;
create policy "Authenticated users can manage purchase request files"
on public.files
for all
to authenticated
using (true)
with check (true);

drop policy if exists "Authenticated users can manage purchase order items" on public.purchase_order_items;
create policy "Authenticated users can manage purchase order items"
on public.purchase_order_items
for all
to authenticated
using (true)
with check (true);

comment on table public.locations is
  'Centralized physical locations for customers, suppliers, and company-owned records. Legacy address columns remain during application migration.';
comment on table public.supplies_categories is
  'Categories used to classify supplies inventory records.';
comment on table public.supplies_inventory is
  'Inventory of supplies purchased from suppliers and owned by an internal company.';
comment on table public.purchase_requests is
  'Header table for internal purchase requests.';
comment on table public.purchase_request_items is
  'Line items requested as part of an internal purchase request.';
comment on table public.files is
  'Files attached to purchase request items.';
comment on table public.purchase_order_items is
  'Links purchase request items to purchase order items. The purchase_order_id foreign key is added only when public.purchase_orders exists.';

commit;
