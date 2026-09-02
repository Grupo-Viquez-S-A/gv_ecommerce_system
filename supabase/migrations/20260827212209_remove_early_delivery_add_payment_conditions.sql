create extension if not exists pgcrypto;

create table if not exists public.payment_conditions (
  condition_id uuid primary key default gen_random_uuid(),
  condition_name varchar(120) not null,
  is_active boolean not null default true,
  description text null
);

create unique index if not exists payment_conditions_condition_name_key
  on public.payment_conditions (condition_name);

do $$
declare
  contado_condition_id uuid;
  credito_condition_id uuid;
begin
  insert into public.payment_conditions (condition_name, is_active, description)
  values
    ('Contado', true, 'Pago contra entrega o cancelación inmediata.'),
    ('Crédito a 30 días', true, 'Pago con plazo máximo de 30 días naturales.')
  on conflict (condition_name) do update
  set
    is_active = excluded.is_active,
    description = excluded.description;

  update public.payment_methods
  set
    method_name = 'Tarjeta',
    description = 'Pago realizado con tarjeta.',
    is_active = true
  where method_name = 'Pago con datáfono o en oficina';

  update public.payment_methods
  set
    method_name = 'Transferencia electrónica',
    description = 'Pago realizado mediante transferencia electrónica.',
    is_active = true
  where method_name = 'Pagos parciales por depósito o transferencia';

  insert into public.payment_methods (method_name, is_active, description)
  values ('Tarjeta', true, 'Pago realizado con tarjeta.')
  on conflict do nothing;

  insert into public.payment_methods (method_name, is_active, description)
  values ('Transferencia electrónica', true, 'Pago realizado mediante transferencia electrónica.')
  on conflict do nothing;

  insert into public.payment_methods (method_name, is_active, description)
  values ('Efectivo', true, 'Pago realizado en efectivo.')
  on conflict do nothing;

  update public.payment_methods
  set is_active = case
    when method_name in ('Efectivo', 'Tarjeta', 'Transferencia electrónica') then true
    else false
  end;

  alter table public.quotations
    add column if not exists condition_id uuid null;

  alter table public.quotations
    drop column if exists early_delivery;

  alter table public.quotations
    drop column if exists early_delivery_date;

  alter table public.quotations
    drop column if exists early_delivery_price;

  if not exists (
    select 1
    from pg_constraint
    where conname = 'quotations_condition_id_fkey'
  ) then
    alter table public.quotations
      add constraint quotations_condition_id_fkey
      foreign key (condition_id)
      references public.payment_conditions (condition_id);
  end if;

  select condition_id
  into contado_condition_id
  from public.payment_conditions
  where condition_name = 'Contado'
  limit 1;

  select condition_id
  into credito_condition_id
  from public.payment_conditions
  where condition_name = 'Crédito a 30 días'
  limit 1;

  update public.quotations
  set condition_id = contado_condition_id
  where condition_id is null;

  update public.quotations q
  set condition_id = credito_condition_id
  from public.payment_methods pm
  where q.method_id = pm.method_id
    and pm.method_name = 'Crédito a 30 días';
end $$;
