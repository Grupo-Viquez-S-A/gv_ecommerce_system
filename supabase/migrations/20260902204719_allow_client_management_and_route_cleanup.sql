alter table public.customers
  add column if not exists deleted_at timestamptz;

create index if not exists customers_not_deleted_idx
  on public.customers (customer_id)
  where deleted_at is null;

create index if not exists customers_route_active_idx
  on public.customers (assigned_sales_agent_user_id, visit_route_day)
  where deleted_at is null and is_active = true;

create or replace function public.current_user_has_customer_management_access(
  p_company_id uuid
)
returns boolean
language sql
stable
security invoker
set search_path to 'pg_catalog', 'public'
as $function$
  select exists (
    select 1
    from public.user_memberships as membership
    join public.roles as role
      on role.role_id = membership.role_id
    where membership.user_id = (select auth.uid())
      and membership.company_id = p_company_id
      and membership.is_active = true
      and coalesce(
        membership.start_date,
        (now() at time zone 'America/Costa_Rica')::date
      ) <= (now() at time zone 'America/Costa_Rica')::date
      and (
        membership.end_date is null
        or membership.end_date >= (now() at time zone 'America/Costa_Rica')::date
      )
      and role.is_active = true
      and lower(btrim(coalesce(role.role_code, role.role_name, ''))) in (
        'brand_manager',
        'brand manager',
        'gerente_marca',
        'gerente de marca',
        'gerente',
        'manager',
        'encargado',
        'presidente',
        'president'
      )
  );
$function$;

revoke all on function public.current_user_has_customer_management_access(uuid)
  from public;
grant execute on function public.current_user_has_customer_management_access(uuid)
  to authenticated;

grant select, update on table public.customers to authenticated;

drop policy if exists "Managers can update active customers"
  on public.customers;
create policy "Managers can update active customers"
  on public.customers
  for update
  to authenticated
  using (
    deleted_at is null
    and public.current_user_has_customer_management_access(company_id)
  )
  with check (
    public.current_user_has_customer_management_access(company_id)
  );

drop policy if exists "Assigned sales agents can update customer route locations"
  on public.customers;
create policy "Assigned sales agents can update customer route locations"
  on public.customers
  for update
  to authenticated
  using (
    deleted_at is null
    and assigned_sales_agent_user_id = (select auth.uid())
  )
  with check (
    deleted_at is null
    and assigned_sales_agent_user_id = (select auth.uid())
  );

drop policy if exists "Managers can remove customer visit confirmations"
  on public.customer_visit_confirmations;
create policy "Managers can remove customer visit confirmations"
  on public.customer_visit_confirmations
  for delete
  to authenticated
  using (
    exists (
      select 1
      from public.customers as customer
      where customer.customer_id = customer_visit_confirmations.customer_id
        and public.current_user_has_customer_management_access(customer.company_id)
    )
  );
