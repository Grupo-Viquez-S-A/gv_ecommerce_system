alter table public.customer_visit_confirmations
  add column if not exists visit_status varchar not null default 'visited',
  add column if not exists note text not null default 'Sin nota registrada.';

update public.customer_visit_confirmations
set
  visit_status = coalesce(nullif(btrim(visit_status), ''), 'visited'),
  note = coalesce(nullif(btrim(note), ''), 'Sin nota registrada.')
where visit_status is null
  or btrim(visit_status) = ''
  or note is null
  or btrim(note) = '';

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'customer_visit_confirmations_status_check'
      and conrelid = 'public.customer_visit_confirmations'::regclass
  ) then
    alter table public.customer_visit_confirmations
      add constraint customer_visit_confirmations_status_check
      check (visit_status in ('visited', 'not_visited'));
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conname = 'customer_visit_confirmations_note_required_check'
      and conrelid = 'public.customer_visit_confirmations'::regclass
  ) then
    alter table public.customer_visit_confirmations
      add constraint customer_visit_confirmations_note_required_check
      check (length(btrim(note)) > 0);
  end if;
end
$$;

create index if not exists customer_visit_confirmations_status_idx
  on public.customer_visit_confirmations (visit_status, visit_date);

grant select, insert, update, delete on table public.customer_visit_confirmations to authenticated;

drop policy if exists "Assigned agents can confirm visits"
  on public.customer_visit_confirmations;
create policy "Assigned agents can confirm visits"
  on public.customer_visit_confirmations
  for insert
  to authenticated
  with check (
    sales_agent_user_id = (select auth.uid())
    and visit_status in ('visited', 'not_visited')
    and length(btrim(note)) > 0
    and exists (
      select 1
      from public.customers as customer
      where customer.customer_id = customer_visit_confirmations.customer_id
        and customer.assigned_sales_agent_user_id = (select auth.uid())
        and customer.visit_route_day = customer_visit_confirmations.visit_route_day
        and customer.is_active = true
    )
    and exists (
      select 1
      from public.user_memberships as membership
      join public.roles as role
        on role.role_id = membership.role_id
      where membership.user_id = (select auth.uid())
        and membership.is_active = true
        and coalesce(
          membership.start_date,
          (pg_catalog.now() at time zone 'America/Costa_Rica')::date
        ) <= (pg_catalog.now() at time zone 'America/Costa_Rica')::date
        and (
          membership.end_date is null
          or membership.end_date >= (pg_catalog.now() at time zone 'America/Costa_Rica')::date
        )
        and role.is_active = true
        and pg_catalog.lower(
          pg_catalog.btrim(coalesce(role.role_code, role.role_name, ''))
        ) in (
          'sales_agent',
          'sales agent',
          'agente_ventas',
          'agente de ventas',
          'vendedor',
          'brand_manager',
          'brand manager',
          'gerente_marca',
          'gerente de marca',
          'manager',
          'gerente',
          'encargado',
          'presidente',
          'president'
        )
    )
  );

drop policy if exists "Assigned agents can update visit confirmations"
  on public.customer_visit_confirmations;
create policy "Assigned agents can update visit confirmations"
  on public.customer_visit_confirmations
  for update
  to authenticated
  using (
    sales_agent_user_id = (select auth.uid())
    and exists (
      select 1
      from public.customers as customer
      where customer.customer_id = customer_visit_confirmations.customer_id
        and customer.assigned_sales_agent_user_id = (select auth.uid())
        and customer.visit_route_day = customer_visit_confirmations.visit_route_day
        and customer.is_active = true
    )
  )
  with check (
    sales_agent_user_id = (select auth.uid())
    and visit_status in ('visited', 'not_visited')
    and length(btrim(note)) > 0
    and exists (
      select 1
      from public.customers as customer
      where customer.customer_id = customer_visit_confirmations.customer_id
        and customer.assigned_sales_agent_user_id = (select auth.uid())
        and customer.visit_route_day = customer_visit_confirmations.visit_route_day
        and customer.is_active = true
    )
  );
