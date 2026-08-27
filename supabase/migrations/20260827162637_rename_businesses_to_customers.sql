begin;

do $$
begin
  if to_regclass('public.customers') is null
     and to_regclass('public.businesses') is not null then
    alter table public.businesses rename to customers;
  end if;
end $$;

alter table public.customers
  add column if not exists customer_code varchar,
  add column if not exists tax_status varchar,
  add column if not exists regime varchar,
  add column if not exists province varchar,
  add column if not exists city varchar,
  add column if not exists district varchar,
  add column if not exists address varchar,
  add column if not exists "isValidForCredit" varchar,
  add column if not exists latitude double precision,
  add column if not exists longitude double precision,
  add column if not exists location_accuracy_meters double precision;

do $$
begin
  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'customers'
      and column_name = 'legal_name'
  ) and not exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'customers'
      and column_name = 'company_name'
  ) then
    alter table public.customers rename column legal_name to company_name;
  end if;

  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'customers'
      and column_name = 'business_name'
  ) and not exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'customers'
      and column_name = 'commercial_name'
  ) then
    alter table public.customers rename column business_name to commercial_name;
  end if;
end $$;

do $$
begin
  if to_regclass('public.branches') is not null then
    with primary_branch as (
      select distinct on (business_id)
        business_id,
        province,
        district,
        address,
        latitude,
        longitude,
        location_accuracy_meters
      from public.branches
      order by business_id, is_active desc, updated_at desc, created_at desc
    )
    update public.customers c
    set
      province = coalesce(nullif(c.province, ''), primary_branch.province, ''),
      city = coalesce(nullif(c.city, ''), ''),
      district = coalesce(nullif(c.district, ''), primary_branch.district, ''),
      address = coalesce(c.address, primary_branch.address),
      latitude = coalesce(c.latitude, primary_branch.latitude),
      longitude = coalesce(c.longitude, primary_branch.longitude),
      location_accuracy_meters = coalesce(
        c.location_accuracy_meters,
        primary_branch.location_accuracy_meters
      )
    from primary_branch
    where c.business_id = primary_branch.business_id;
  end if;
end $$;

update public.customers
set
  regime = coalesce(nullif(regime, ''), 'general'),
  province = coalesce(province, ''),
  city = coalesce(city, ''),
  district = coalesce(district, ''),
  "isValidForCredit" = coalesce(nullif("isValidForCredit", ''), 'pending');

alter table public.customers
  alter column regime set not null,
  alter column province set not null,
  alter column city set not null,
  alter column district set not null,
  alter column "isValidForCredit" set not null;

alter table public.customers
  drop constraint if exists customers_latitude_range_check,
  drop constraint if exists customers_longitude_range_check,
  drop constraint if exists customers_location_accuracy_check,
  add constraint customers_latitude_range_check
    check (latitude is null or (latitude >= -90 and latitude <= 90)),
  add constraint customers_longitude_range_check
    check (longitude is null or (longitude >= -180 and longitude <= 180)),
  add constraint customers_location_accuracy_check
    check (location_accuracy_meters is null or location_accuracy_meters >= 0);

alter table if exists public.branches
  drop constraint if exists branches_business_id_fkey;

alter table if exists public.representatives
  drop constraint if exists representatives_business_id_fkey,
  drop constraint if exists representatives_branch_id_fkey,
  drop constraint if exists representatives_user_id_fkey;

alter table if exists public.quotations
  drop constraint if exists quotations_business_id_fkey,
  drop constraint if exists quotations_branch_id_fkey,
  drop constraint if exists quotations_representative_id_fkey;

alter table if exists public.emails
  drop constraint if exists emails_business_id_fkey,
  drop constraint if exists uq_business_email;

alter table if exists public.phones
  drop constraint if exists phones_business_id_fkey,
  drop constraint if exists phones_branch_id_fkey,
  drop constraint if exists phones_representative_id_fkey,
  drop constraint if exists chk_phone_owner;

alter table if exists public.it_tickets
  drop constraint if exists it_tickets_business_fkey,
  drop constraint if exists it_tickets_branch_fkey,
  drop constraint if exists it_tickets_representative_fkey;

do $$
begin
  if to_regclass('public.branches') is not null
     and exists (
       select 1
       from information_schema.columns
       where table_schema = 'public'
         and table_name = 'phones'
         and column_name = 'branch_id'
     )
     and exists (
       select 1
       from information_schema.columns
       where table_schema = 'public'
         and table_name = 'phones'
         and column_name = 'business_id'
     ) then
    update public.phones p
    set business_id = b.business_id
    from public.branches b
    where p.branch_id = b.branch_id
      and p.business_id is null;
  end if;

  if to_regclass('public.representatives') is not null
     and exists (
       select 1
       from information_schema.columns
       where table_schema = 'public'
         and table_name = 'phones'
         and column_name = 'representative_id'
     )
     and exists (
       select 1
       from information_schema.columns
       where table_schema = 'public'
         and table_name = 'phones'
         and column_name = 'business_id'
     ) then
    update public.phones p
    set business_id = r.business_id
    from public.representatives r
    where p.representative_id = r.representative_id
      and p.business_id is null;
  end if;
end $$;

do $$
begin
  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'customers'
      and column_name = 'business_id'
  ) and not exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'customers'
      and column_name = 'customer_id'
  ) then
    alter table public.customers rename column business_id to customer_id;
  end if;

  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'quotations'
      and column_name = 'business_id'
  ) and not exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'quotations'
      and column_name = 'customer_id'
  ) then
    alter table public.quotations rename column business_id to customer_id;
  end if;

  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'emails'
      and column_name = 'business_id'
  ) and not exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'emails'
      and column_name = 'customer_id'
  ) then
    alter table public.emails rename column business_id to customer_id;
  end if;

  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'phones'
      and column_name = 'business_id'
  ) and not exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'phones'
      and column_name = 'customer_id'
  ) then
    alter table public.phones rename column business_id to customer_id;
  end if;

  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'it_tickets'
      and column_name = 'business_id'
  ) and not exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'it_tickets'
      and column_name = 'customer_id'
  ) then
    alter table public.it_tickets rename column business_id to customer_id;
  end if;
end $$;

do $$
begin
  if exists (
    select 1
    from pg_constraint
    where conrelid = 'public.customers'::regclass
      and conname = 'businesses_pkey'
  ) then
    alter table public.customers rename constraint businesses_pkey to customers_pkey;
  end if;

  if exists (
    select 1
    from pg_constraint
    where conrelid = 'public.customers'::regclass
      and conname = 'businesses_legal_id_key'
  ) then
    alter table public.customers rename constraint businesses_legal_id_key to customers_legal_id_key;
  end if;

  if exists (
    select 1
    from pg_constraint
    where conrelid = 'public.customers'::regclass
      and conname = 'businesses_company_id_fkey'
  ) then
    alter table public.customers rename constraint businesses_company_id_fkey to customers_company_id_fkey;
  end if;
end $$;

alter table if exists public.quotations
  drop column if exists branch_id,
  drop column if exists representative_id;

alter table if exists public.phones
  drop column if exists branch_id,
  drop column if exists representative_id;

alter table if exists public.it_tickets
  drop column if exists branch_id,
  drop column if exists representative_id;

alter table if exists public.emails
  drop constraint if exists emails_customer_id_fkey,
  drop constraint if exists uq_customer_email;

alter table if exists public.emails
  add constraint emails_customer_id_fkey
    foreign key (customer_id) references public.customers(customer_id) on delete cascade,
  add constraint uq_customer_email unique (customer_id, email);

alter table if exists public.phones
  drop constraint if exists phones_customer_id_fkey;

alter table if exists public.phones
  add constraint phones_customer_id_fkey
    foreign key (customer_id) references public.customers(customer_id) on delete cascade,
  add constraint chk_phone_owner
    check (num_nonnulls(customer_id, company_id) = 1);

alter table if exists public.quotations
  drop constraint if exists quotations_customer_id_fkey;

alter table if exists public.quotations
  add constraint quotations_customer_id_fkey
    foreign key (customer_id) references public.customers(customer_id)
    on update cascade on delete restrict;

alter table if exists public.it_tickets
  drop constraint if exists it_tickets_customer_fkey;

alter table if exists public.it_tickets
  add constraint it_tickets_customer_fkey
    foreign key (customer_id) references public.customers(customer_id)
    on delete set null;

drop table if exists public.representatives cascade;
drop table if exists public.branches cascade;

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
  v_quotation_status text;
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
    customer.company_id,
    pg_catalog.lower(
      pg_catalog.btrim(
        pg_catalog.coalesce(quotation.state::text, quotation.status::text, '')
      )
    )
  into
    v_customer_id,
    v_company_id,
    v_quotation_status
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

  if v_quotation_status not in ('approved', 'aprobada') then
    raise exception using
      errcode = '22023',
      message = 'Solo se puede crear una orden desde una cotizacion aprobada.';
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

commit;
