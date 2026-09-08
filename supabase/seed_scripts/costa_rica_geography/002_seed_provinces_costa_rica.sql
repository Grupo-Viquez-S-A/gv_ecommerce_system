begin;

with country as (
  select country_id
  from public.countries
  where country_code = 'CR'
),
source_data (province_code, province_name) as (
  values
  ('01', 'San José'),
  ('02', 'Alajuela'),
  ('03', 'Cartago'),
  ('04', 'Heredia'),
  ('05', 'Guanacaste'),
  ('06', 'Puntarenas'),
  ('07', 'Limón')
)
insert into public.provinces (country_id, province_code, province_name, is_active)
select country.country_id, source_data.province_code, source_data.province_name, true
from source_data
cross join country
on conflict (country_id, province_name) do update
set province_code = excluded.province_code,
    is_active = excluded.is_active,
    updated_at = now();

commit;
