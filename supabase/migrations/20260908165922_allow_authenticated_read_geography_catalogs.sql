grant select on table
  public.countries,
  public.provinces,
  public.cantons,
  public.districts
to authenticated;

do $$
declare
  geography_table text;
begin
  foreach geography_table in array array[
    'countries',
    'provinces',
    'cantons',
    'districts'
  ]
  loop
    if not exists (
      select 1
      from pg_policies
      where schemaname = 'public'
        and tablename = geography_table
        and policyname = 'authenticated_read_active_geography'
    ) then
      execute format(
        'create policy %I on public.%I for select to authenticated using (is_active = true)',
        'authenticated_read_active_geography',
        geography_table
      );
    end if;
  end loop;
end $$;
