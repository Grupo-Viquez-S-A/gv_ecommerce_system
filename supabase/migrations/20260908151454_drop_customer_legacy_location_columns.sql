alter policy "Assigned sales agents can update customer route locations"
  on public.customers
  using (
    is_active = true
    and assigned_sales_agent_user_id = (select auth.uid())
  )
  with check (
    is_active = true
    and assigned_sales_agent_user_id = (select auth.uid())
  );

alter policy "Managers can update active customers"
  on public.customers
  using (
    is_active = true
    and current_user_has_customer_management_access(company_id)
  )
  with check (
    current_user_has_customer_management_access(company_id)
  );

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'locations'
      and policyname = 'authenticated_full_access'
  ) then
    create policy "authenticated_full_access"
      on public.locations
      for all
      to authenticated
      using (true)
      with check (true);
  end if;
end $$;

alter table if exists public.customers
  drop column if exists province,
  drop column if exists city,
  drop column if exists district,
  drop column if exists address,
  drop column if exists latitude,
  drop column if exists longitude,
  drop column if exists location_accuracy_meters,
  drop column if exists deleted_at,
  alter column regime drop not null,
  alter column "isValidForCredit" drop not null,
  alter column created_at drop not null,
  alter column updated_at drop not null;
