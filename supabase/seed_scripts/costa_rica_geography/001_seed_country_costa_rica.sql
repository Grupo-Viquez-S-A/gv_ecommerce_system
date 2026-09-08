begin;

insert into public.countries (country_code, country_name, is_active)
values ('CR', 'Costa Rica', true)
on conflict (country_code) do update
set country_name = excluded.country_name,
    is_active = excluded.is_active,
    updated_at = now();

commit;
