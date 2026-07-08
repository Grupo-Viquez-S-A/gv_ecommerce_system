-- Lectura requerida por el frontend del e-commerce.
-- Aplica esto si el panel muestra 0 usuarios o el sidebar no puede leer
-- user_memberships / roles / departments aunque los registros existan.

alter table public.profiles enable row level security;
alter table public.user_memberships enable row level security;
alter table public.user_applications enable row level security;
alter table public.roles enable row level security;
alter table public.departments enable row level security;
alter table public.companies enable row level security;

grant select on table public.profiles to authenticated;
grant select on table public.user_memberships to authenticated;
grant select on table public.user_applications to authenticated;
grant select on table public.roles to authenticated;
grant select on table public.departments to authenticated;
grant select on table public.companies to authenticated;

drop policy if exists "Authenticated can read profiles" on public.profiles;
drop policy if exists "Authenticated can read user memberships" on public.user_memberships;
drop policy if exists "Authenticated can read user applications" on public.user_applications;
drop policy if exists "Authenticated can read roles" on public.roles;
drop policy if exists "Authenticated can read departments" on public.departments;
drop policy if exists "Authenticated can read companies" on public.companies;

create policy "Authenticated can read profiles"
on public.profiles
for select
to authenticated
using (true);

create policy "Authenticated can read user memberships"
on public.user_memberships
for select
to authenticated
using (true);

create policy "Authenticated can read user applications"
on public.user_applications
for select
to authenticated
using (true);

create policy "Authenticated can read roles"
on public.roles
for select
to authenticated
using (true);

create policy "Authenticated can read departments"
on public.departments
for select
to authenticated
using (true);

create policy "Authenticated can read companies"
on public.companies
for select
to authenticated
using (true);
