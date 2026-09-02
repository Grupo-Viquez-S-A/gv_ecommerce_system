grant select on public.payment_conditions to authenticated;

drop policy if exists "Authenticated users can read active payment conditions"
  on public.payment_conditions;

create policy "Authenticated users can read active payment conditions"
  on public.payment_conditions
  for select
  to authenticated
  using (is_active = true);

create or replace function public.create_production_order_from_quotation(p_quotation_id uuid)
returns public.production_orders
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
  v_quotation public.quotations;
  v_order public.production_orders;
begin
  select *
  into v_quotation
  from public.quotations
  where quotation_id = p_quotation_id
    and is_active = true;

  if not found then
    raise exception 'No se encontro la cotizacion.';
  end if;

  select *
  into v_order
  from public.production_orders
  where quotation_id = p_quotation_id
    and is_active = true
  limit 1;

  if found then
    return v_order;
  end if;

  insert into public.production_orders (
    quotation_id,
    production_order_code,
    production_order_status,
    payment_status,
    next_payment_date,
    is_active,
    balance,
    overdue_days,
    penalty_amount,
    penalty_percentage
  )
  values (
    p_quotation_id,
    'OP-' || to_char(clock_timestamp(), 'YYYYMMDD-HH24MISSMS') || '-' ||
      upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 4)),
    'pendiente',
    'pendiente',
    null,
    true,
    coalesce(v_quotation.total, 0),
    0,
    0,
    4
  )
  returning *
  into v_order;

  return v_order;
end;
$function$;

create or replace function public.secure_create_production_order_from_quotation(p_quotation_id uuid)
returns jsonb
language plpgsql
security definer
set search_path to 'pg_catalog', 'public'
as $function$
declare
  v_user_id uuid := auth.uid();
  v_customer_id uuid;
  v_company_id uuid;
  v_existing_order_id uuid;
  v_existing_order_code text;
  v_original_result jsonb;
  v_today date := (pg_catalog.now() at time zone 'America/Costa_Rica')::date;
  v_application_id constant uuid := '64c10718-fce7-42c6-a25f-d81c6b5cd51c'::uuid;
begin
  if v_user_id is null then
    raise exception using
      errcode = '42501',
      message = 'Debes iniciar sesion para crear una orden de produccion.';
  end if;

  if p_quotation_id is null then
    raise exception using
      errcode = '22023',
      message = 'Falta el identificador de la cotizacion.';
  end if;

  perform pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtextextended(p_quotation_id::text, 0)
  );

  select
    quotation.customer_id,
    customer.company_id
  into
    v_customer_id,
    v_company_id
  from public.quotations as quotation
  join public.customers as customer
    on customer.customer_id = quotation.customer_id
  where quotation.quotation_id = p_quotation_id
    and quotation.is_active = true
    and customer.is_active = true;

  if not found then
    raise exception using
      errcode = 'P0002',
      message = 'No se encontro una cotizacion activa para crear la orden.';
  end if;

  if v_company_id is null then
    raise exception using
      errcode = '23502',
      message = 'La cotizacion no tiene una empresa valida asociada.';
  end if;

  if not exists (
    select 1
    from public.profiles as profile
    where profile.user_id = v_user_id
      and profile.is_active = true
  ) then
    raise exception using
      errcode = '42501',
      message = 'Tu perfil no esta activo.';
  end if;

  if not exists (
    select 1
    from public.user_applications as user_application
    where user_application.user_id = v_user_id
      and user_application.application_id = v_application_id
      and user_application.is_active = true
      and pg_catalog.coalesce(user_application.start_date, v_today) <= v_today
      and (
        user_application.end_date is null
        or user_application.end_date >= v_today
      )
  ) then
    raise exception using
      errcode = '42501',
      message = 'Tu usuario no tiene acceso activo a esta aplicacion.';
  end if;

  if not exists (
    select 1
    from public.user_memberships as membership
    join public.roles as role
      on role.role_id = membership.role_id
    where membership.user_id = v_user_id
      and membership.company_id = v_company_id
      and membership.is_active = true
      and pg_catalog.coalesce(membership.start_date, v_today) <= v_today
      and (membership.end_date is null or membership.end_date >= v_today)
      and role.is_active = true
      and pg_catalog.lower(
        pg_catalog.btrim(pg_catalog.coalesce(role.role_code, role.role_name, ''))
      ) in (
        'sales_agent',
        'sales agent',
        'agente_ventas',
        'agente de ventas',
        'vendedor',
        'gerente',
        'manager',
        'encargado',
        'administrador',
        'admin',
        'super_admin',
        'presidente',
        'president'
      )
  ) then
    raise exception using
      errcode = '42501',
      message = 'No tienes permisos para crear ordenes en esta empresa.';
  end if;

  select
    production_order.production_order_id,
    production_order.production_order_code
  into
    v_existing_order_id,
    v_existing_order_code
  from public.production_orders as production_order
  where production_order.quotation_id = p_quotation_id
    and production_order.is_active = true
  limit 1;

  if v_existing_order_id is not null then
    return pg_catalog.jsonb_build_object(
      'created', false,
      'alreadyExisted', true,
      'productionOrderId', v_existing_order_id,
      'productionOrderCode', v_existing_order_code
    );
  end if;

  select pg_catalog.to_jsonb(original_result)
  into v_original_result
  from public.create_production_order_from_quotation(p_quotation_id)
    as original_result
  limit 1;

  select
    production_order.production_order_id,
    production_order.production_order_code
  into
    v_existing_order_id,
    v_existing_order_code
  from public.production_orders as production_order
  where production_order.quotation_id = p_quotation_id
    and production_order.is_active = true
  limit 1;

  if v_existing_order_id is null then
    raise exception using
      errcode = 'P0001',
      message = 'La funcion de produccion termino sin crear la orden esperada.';
  end if;

  return pg_catalog.jsonb_build_object(
    'created', true,
    'alreadyExisted', false,
    'productionOrderId', v_existing_order_id,
    'productionOrderCode', v_existing_order_code,
    'result', v_original_result
  );
end;
$function$;
