alter table if exists public.sizes enable row level security;

grant select on table public.sizes to anon, authenticated;
grant insert, update on table public.sizes to authenticated;

drop policy if exists catalog_manage_sizes on public.sizes;
create policy catalog_manage_sizes
on public.sizes
for all
to authenticated
using (true)
with check (true);

do $$
declare
  constraint_name text;
begin
  select con.conname
    into constraint_name
  from pg_constraint con
  join pg_class rel
    on rel.oid = con.conrelid
  join pg_namespace nsp
    on nsp.oid = rel.relnamespace
  join pg_attribute att
    on att.attrelid = rel.oid
   and att.attnum = any(con.conkey)
  where nsp.nspname = 'public'
    and rel.relname = 'textiles_inventory'
    and att.attname = 'dimension_id'
    and con.contype = 'f'
  limit 1;

  if constraint_name is not null then
    execute format(
      'alter table public.textiles_inventory drop constraint if exists %I',
      constraint_name
    );
  end if;
end $$;

alter table if exists public.textiles_inventory
  drop column if exists dimension_id;

drop table if exists public.dimensions;
