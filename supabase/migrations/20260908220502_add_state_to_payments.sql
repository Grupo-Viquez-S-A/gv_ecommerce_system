alter table public.payments
  add column if not exists state varchar;

update public.payments
set state = case
  when is_valid is true then 'Aprobado'
  else 'Pendiente de aprobación'
end
where state is null
   or btrim(state) = '';

alter table public.payments
  alter column state set not null,
  alter column state set default 'Pendiente de aprobación';

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conrelid = 'public.payments'::regclass
      and conname = 'payments_state_allowed'
  ) then
    alter table public.payments
      add constraint payments_state_allowed
      check (state in ('Pendiente de aprobación', 'Aprobado', 'Denegado'));
  end if;
end $$;
