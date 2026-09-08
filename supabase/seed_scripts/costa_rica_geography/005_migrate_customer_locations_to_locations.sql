begin;

create extension if not exists unaccent with schema public;

do $$
declare
  unmatched_count integer;
  unmatched_sample text;
begin
  if not exists (
    select 1
    from public.countries
    where country_code = 'CR'
  ) then
    raise exception
      'No se pueden migrar ubicaciones de customers a locations: primero cargue el país Costa Rica con 001_seed_country_costa_rica.sql.';
  end if;

  with country as (
    select country_id
    from public.countries
    where country_code = 'CR'
  ),
  customers_with_location as (
    select
      customer.customer_id,
      customer.province,
      customer.city,
      customer.district,
      public.unaccent(lower(btrim(coalesce(customer.province, '')))) as normalized_province,
      public.unaccent(lower(btrim(coalesce(customer.city, '')))) as normalized_city,
      regexp_replace(
        public.unaccent(lower(btrim(coalesce(customer.district, '')))),
        '\s+centro$',
        ''
      ) as normalized_district
    from public.customers as customer
    where customer.deleted_at is null
      and customer.is_active = true
      and (
        nullif(btrim(coalesce(customer.province, '')), '') is not null
        or nullif(btrim(coalesce(customer.city, '')), '') is not null
        or nullif(btrim(coalesce(customer.district, '')), '') is not null
        or nullif(btrim(coalesce(customer.address, '')), '') is not null
        or customer.latitude is not null
        or customer.longitude is not null
      )
  ),
  unmatched as (
    select
      customer.customer_id,
      customer.province,
      customer.city,
      customer.district
    from customers_with_location as customer
    cross join country
    left join public.provinces as province
      on province.country_id = country.country_id
     and public.unaccent(lower(btrim(province.province_name))) = customer.normalized_province
     and nullif(btrim(coalesce(province.province_code, '')), '') is not null
    left join public.cantons as canton
      on canton.province_id = province.province_id
     and public.unaccent(lower(btrim(canton.canton_name))) = customer.normalized_city
     and nullif(btrim(coalesce(canton.canton_code, '')), '') is not null
    left join public.districts as district
      on district.canton_id = canton.canton_id
     and public.unaccent(lower(btrim(district.district_name))) = customer.normalized_district
     and nullif(btrim(coalesce(district.district_code, '')), '') is not null
    where province.province_id is null
       or canton.canton_id is null
       or district.district_id is null
  )
  select
    (select count(*) from unmatched),
    (
      select string_agg(
        format(
          '%s: province=%s, city=%s, district=%s',
          customer_id,
          coalesce(province, '<null>'),
          coalesce(city, '<null>'),
          coalesce(district, '<null>')
        ),
        '; '
        order by customer_id
      )
      from (
        select *
        from unmatched
        order by customer_id
        limit 10
      ) as sample
    )
  into unmatched_count, unmatched_sample
  ;

  if unmatched_count > 0 then
    raise exception
      'No se pueden migrar ubicaciones de customers a locations: % clientes no coinciden con countries/provinces/cantons/districts. Muestra: %',
      unmatched_count,
      unmatched_sample;
  end if;
end $$;

with country as (
  select country_id
  from public.countries
  where country_code = 'CR'
),
matched_customer_locations as (
  select
    customer.customer_id,
    country.country_id,
    province.province_id,
    canton.canton_id,
    district.district_id,
    coalesce(nullif(btrim(customer.address), ''), 'Sin direccion registrada') as location,
    customer.latitude,
    customer.longitude,
    customer.location_accuracy_meters,
    customer.created_at,
    greatest(customer.updated_at, customer.created_at) as updated_at,
    public.unaccent(lower(btrim(coalesce(customer.province, '')))) as normalized_province,
    public.unaccent(lower(btrim(coalesce(customer.city, '')))) as normalized_city,
    regexp_replace(
      public.unaccent(lower(btrim(coalesce(customer.district, '')))),
      '\s+centro$',
      ''
    ) as normalized_district
  from public.customers as customer
  cross join country
  join public.provinces as province
    on province.country_id = country.country_id
   and public.unaccent(lower(btrim(province.province_name))) = public.unaccent(lower(btrim(coalesce(customer.province, ''))))
   and nullif(btrim(coalesce(province.province_code, '')), '') is not null
  join public.cantons as canton
    on canton.province_id = province.province_id
   and public.unaccent(lower(btrim(canton.canton_name))) = public.unaccent(lower(btrim(coalesce(customer.city, ''))))
   and nullif(btrim(coalesce(canton.canton_code, '')), '') is not null
  join public.districts as district
    on district.canton_id = canton.canton_id
   and public.unaccent(lower(btrim(district.district_name))) = regexp_replace(
     public.unaccent(lower(btrim(coalesce(customer.district, '')))),
     '\s+centro$',
     ''
   )
   and nullif(btrim(coalesce(district.district_code, '')), '') is not null
  where customer.deleted_at is null
    and customer.is_active = true
    and (
      nullif(btrim(coalesce(customer.province, '')), '') is not null
      or nullif(btrim(coalesce(customer.city, '')), '') is not null
      or nullif(btrim(coalesce(customer.district, '')), '') is not null
      or nullif(btrim(coalesce(customer.address, '')), '') is not null
      or customer.latitude is not null
      or customer.longitude is not null
    )
),
updated_locations as (
  update public.locations as location
  set
    country_id = source.country_id,
    province_id = source.province_id,
    canton_id = source.canton_id,
    district_id = source.district_id,
    location = source.location,
    latitude = source.latitude,
    longitude = source.longitude,
    location_accuracy_meters = source.location_accuracy_meters,
    is_primary = true,
    is_active = true,
    updated_at = now()
  from matched_customer_locations as source
  where location.customer_id = source.customer_id
    and location.is_primary = true
    and location.is_active = true
  returning location.customer_id
)
insert into public.locations (
  customer_id,
  country_id,
  province_id,
  canton_id,
  district_id,
  location,
  latitude,
  longitude,
  location_accuracy_meters,
  is_primary,
  is_active,
  created_at,
  updated_at
)
select
  source.customer_id,
  source.country_id,
  source.province_id,
  source.canton_id,
  source.district_id,
  source.location,
  source.latitude,
  source.longitude,
  source.location_accuracy_meters,
  true,
  true,
  source.created_at,
  source.updated_at
from matched_customer_locations as source
where not exists (
  select 1
  from updated_locations as updated
  where updated.customer_id = source.customer_id
)
and not exists (
  select 1
  from public.locations as existing
  where existing.customer_id = source.customer_id
    and existing.is_primary = true
    and existing.is_active = true
);

commit;
