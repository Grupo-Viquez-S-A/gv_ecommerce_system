create or replace function public.current_user_has_quotation_adjustment_access(
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
      and (
        lower(btrim(coalesce(role.role_code, ''))) in (
          'brand_manager',
          'gerente_marca',
          'encargado',
          'president'
        )
        or lower(btrim(coalesce(role.role_name, ''))) in (
          'brand manager',
          'gerente de marca',
          'encargado',
          'presidente',
          'president'
        )
      )
  );
$function$;

revoke all on function public.current_user_has_quotation_adjustment_access(uuid)
  from public;
grant execute on function public.current_user_has_quotation_adjustment_access(uuid)
  to authenticated;
