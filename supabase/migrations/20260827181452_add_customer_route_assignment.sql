alter table public.customers
  add column if not exists assigned_sales_agent_user_id uuid,
  add column if not exists visit_route_day varchar;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'customers_assigned_sales_agent_user_id_fkey'
  ) then
    alter table public.customers
      add constraint customers_assigned_sales_agent_user_id_fkey
      foreign key (assigned_sales_agent_user_id)
      references public.profiles (user_id)
      on delete set null;
  end if;
end $$;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'customers_visit_route_day_check'
  ) then
    alter table public.customers
      add constraint customers_visit_route_day_check
      check (
        visit_route_day is null or
        visit_route_day in ('monday', 'tuesday', 'wednesday', 'thursday', 'friday')
      );
  end if;
end $$;

update public.customers
set visit_route_day = case extract(isodow from timezone('America/Costa_Rica', created_at))
  when 1 then 'monday'
  when 2 then 'tuesday'
  when 3 then 'wednesday'
  when 4 then 'thursday'
  when 5 then 'friday'
  when 6 then 'monday'
  when 7 then 'monday'
  else 'monday'
end
where visit_route_day is null;

create index if not exists customers_assigned_sales_agent_user_id_idx
  on public.customers (assigned_sales_agent_user_id);

create index if not exists customers_visit_route_day_idx
  on public.customers (visit_route_day);
