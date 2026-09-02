drop policy if exists "Agents and managers can read visit confirmations"
  on public.customer_visit_confirmations;
create policy "Agents and managers can read visit confirmations"
  on public.customer_visit_confirmations
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.profiles as profile
      where profile.user_id = auth.uid()
        and profile.is_active = true
    )
    and (
      sales_agent_user_id = auth.uid()
      or exists (
        select 1
        from public.user_memberships as membership
        join public.roles as role
          on role.role_id = membership.role_id
        where membership.user_id = auth.uid()
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
    )
  );

drop policy if exists "Assigned agents can confirm visits"
  on public.customer_visit_confirmations;
create policy "Assigned agents can confirm visits"
  on public.customer_visit_confirmations
  for insert
  to authenticated
  with check (
    sales_agent_user_id = auth.uid()
    and exists (
      select 1
      from public.customers as customer
      where customer.customer_id = customer_visit_confirmations.customer_id
        and customer.assigned_sales_agent_user_id = auth.uid()
        and customer.visit_route_day = customer_visit_confirmations.visit_route_day
        and customer.is_active = true
    )
    and exists (
      select 1
      from public.user_memberships as membership
      join public.roles as role
        on role.role_id = membership.role_id
      where membership.user_id = auth.uid()
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

drop policy if exists "Assigned agents can remove their visit confirmations"
  on public.customer_visit_confirmations;
create policy "Assigned agents can remove their visit confirmations"
  on public.customer_visit_confirmations
  for delete
  to authenticated
  using (
    sales_agent_user_id = auth.uid()
    and exists (
      select 1
      from public.customers as customer
      where customer.customer_id = customer_visit_confirmations.customer_id
        and customer.assigned_sales_agent_user_id = auth.uid()
    )
  );
