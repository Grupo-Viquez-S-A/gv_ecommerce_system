begin;

with country as (
  select country_id
  from public.countries
  where country_code = 'CR'
),
source_data (province_code, province_name, canton_code, canton_name) as (
  values
  ('01', 'San José', '01', 'San José'),
  ('01', 'San José', '02', 'Escazú'),
  ('01', 'San José', '03', 'Desamparados'),
  ('01', 'San José', '04', 'Puriscal'),
  ('01', 'San José', '05', 'Tarrazú'),
  ('01', 'San José', '06', 'Aserrí'),
  ('01', 'San José', '07', 'Mora'),
  ('01', 'San José', '08', 'Goicoechea'),
  ('01', 'San José', '09', 'Santa Ana'),
  ('01', 'San José', '10', 'Alajuelita'),
  ('01', 'San José', '11', 'Vásquez de Coronado'),
  ('01', 'San José', '12', 'Acosta'),
  ('01', 'San José', '13', 'Tibás'),
  ('01', 'San José', '14', 'Moravia'),
  ('01', 'San José', '15', 'Montes de Oca'),
  ('01', 'San José', '16', 'Turrubares'),
  ('01', 'San José', '17', 'Dota'),
  ('01', 'San José', '18', 'Curridabat'),
  ('01', 'San José', '19', 'Pérez Zeledón'),
  ('01', 'San José', '20', 'León Cortéz Castro'),
  ('02', 'Alajuela', '01', 'Alajuela'),
  ('02', 'Alajuela', '02', 'San Ramón'),
  ('02', 'Alajuela', '03', 'Grecia'),
  ('02', 'Alajuela', '04', 'San Mateo'),
  ('02', 'Alajuela', '05', 'Atenas'),
  ('02', 'Alajuela', '06', 'Naranjo'),
  ('02', 'Alajuela', '07', 'Palmares'),
  ('02', 'Alajuela', '08', 'Poás'),
  ('02', 'Alajuela', '09', 'Orotina'),
  ('02', 'Alajuela', '10', 'San Carlos'),
  ('02', 'Alajuela', '11', 'Zarcero'),
  ('02', 'Alajuela', '12', 'Valverde Vega'),
  ('02', 'Alajuela', '13', 'Upala'),
  ('02', 'Alajuela', '14', 'Los Chiles'),
  ('02', 'Alajuela', '15', 'Guatuso'),
  ('03', 'Cartago', '01', 'Cartago'),
  ('03', 'Cartago', '02', 'Paraíso'),
  ('03', 'Cartago', '03', 'La Unión'),
  ('03', 'Cartago', '04', 'Jiménez'),
  ('03', 'Cartago', '05', 'Turrialba'),
  ('03', 'Cartago', '06', 'Alvarado'),
  ('03', 'Cartago', '07', 'Oreamuno'),
  ('03', 'Cartago', '08', 'El Guarco'),
  ('04', 'Heredia', '01', 'Heredia'),
  ('04', 'Heredia', '02', 'Barva'),
  ('04', 'Heredia', '03', 'Santo Domingo'),
  ('04', 'Heredia', '04', 'Santa Bárbara'),
  ('04', 'Heredia', '05', 'San Rafaél'),
  ('04', 'Heredia', '06', 'San Isidro'),
  ('04', 'Heredia', '07', 'Belén'),
  ('04', 'Heredia', '08', 'Flores'),
  ('04', 'Heredia', '09', 'San Pablo'),
  ('04', 'Heredia', '10', 'Sarapiquí'),
  ('05', 'Guanacaste', '01', 'Liberia'),
  ('05', 'Guanacaste', '02', 'Nicoya'),
  ('05', 'Guanacaste', '03', 'Santa Cruz'),
  ('05', 'Guanacaste', '04', 'Bagaces'),
  ('05', 'Guanacaste', '05', 'Carrillo'),
  ('05', 'Guanacaste', '06', 'Cañas'),
  ('05', 'Guanacaste', '07', 'Abangáres'),
  ('05', 'Guanacaste', '08', 'Tilarán'),
  ('05', 'Guanacaste', '09', 'Nandayure'),
  ('05', 'Guanacaste', '10', 'La Cruz'),
  ('05', 'Guanacaste', '11', 'Hojancha'),
  ('06', 'Puntarenas', '01', 'Puntarenas'),
  ('06', 'Puntarenas', '02', 'Esparza'),
  ('06', 'Puntarenas', '03', 'Buenos Aires'),
  ('06', 'Puntarenas', '04', 'Montes de Oro'),
  ('06', 'Puntarenas', '05', 'Osa'),
  ('06', 'Puntarenas', '06', 'Aguirre'),
  ('06', 'Puntarenas', '07', 'Golfito'),
  ('06', 'Puntarenas', '08', 'Coto Brus'),
  ('06', 'Puntarenas', '09', 'Parrita'),
  ('06', 'Puntarenas', '10', 'Corredores'),
  ('06', 'Puntarenas', '11', 'Garabito'),
  ('07', 'Limón', '01', 'Limón'),
  ('07', 'Limón', '02', 'Pococí'),
  ('07', 'Limón', '03', 'Siquirres'),
  ('07', 'Limón', '04', 'Talamanca'),
  ('07', 'Limón', '05', 'Matina'),
  ('07', 'Limón', '06', 'Guácimo')
)
insert into public.cantons (province_id, canton_code, canton_name, is_active)
select province.province_id, source_data.canton_code, source_data.canton_name, true
from source_data
cross join country
join public.provinces as province
  on province.country_id = country.country_id
 and province.province_name = source_data.province_name
on conflict (province_id, canton_name) do update
set canton_code = excluded.canton_code,
    is_active = excluded.is_active,
    updated_at = now();

commit;
