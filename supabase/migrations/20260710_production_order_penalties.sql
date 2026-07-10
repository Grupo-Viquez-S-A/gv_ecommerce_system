-- Penalizaciones por atraso en ordenes de produccion.
-- Ejecutar este script completo en el SQL Editor de Supabase (Proyecto GV eCommerce System).
-- Es idempotente: puede ejecutarse varias veces sin duplicar columnas, funciones,
-- triggers, políticas ni el cron job.

-- =========================================================
-- 1. COLUMNAS
-- =========================================================

-- penalty_percentage ya existe en production_orders (numeric, default 0).
-- Se agrega la restriccion CHECK solo si todavia no existe.
do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'production_orders_penalty_percentage_range'
  ) then
    alter table public.production_orders
      add constraint production_orders_penalty_percentage_range
      check (penalty_percentage >= 0 and penalty_percentage <= 100);
  end if;
end;
$$;

-- Asegura NOT NULL + default 0 sin perder datos existentes.
update public.production_orders
set penalty_percentage = 0
where penalty_percentage is null;

alter table public.production_orders
  alter column penalty_percentage set default 0;

alter table public.production_orders
  alter column penalty_percentage set not null;

-- overdue_days / penalty_amount ya existen; se normalizan valores nulos.
update public.production_orders
set overdue_days = 0
where overdue_days is null;

update public.production_orders
set penalty_amount = 0
where penalty_amount is null;

alter table public.production_orders
  alter column overdue_days set default 0;

alter table public.production_orders
  alter column penalty_amount set default 0;

-- paid_at no existe: se agrega para congelar el calculo cuando el saldo llega a cero.
alter table public.production_orders
  add column if not exists paid_at timestamptz null;

comment on column public.production_orders.penalty_percentage is
  'Porcentaje de penalizacion (0-100) aplicado al saldo pendiente cuando la orden esta en mora.';
comment on column public.production_orders.overdue_days is
  'Dias de atraso respecto a next_payment_date, calculados en zona horaria America/Costa_Rica.';
comment on column public.production_orders.penalty_amount is
  'Monto de penalizacion = saldo pendiente x penalty_percentage / 100. No se suma a balance.';
comment on column public.production_orders.paid_at is
  'Fecha/hora en que el saldo llego a cero por primera vez. Congela overdue_days y penalty_amount como historial.';

-- =========================================================
-- 2. FUNCION DE CALCULO POR FILA (trigger BEFORE INSERT/UPDATE)
-- =========================================================

create or replace function public.compute_production_order_penalty()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_today date := (now() at time zone 'America/Costa_Rica')::date;
  v_due_date date := new.next_payment_date;
  v_balance numeric := greatest(coalesce(new.balance, 0), 0);
  v_percentage numeric := least(greatest(coalesce(new.penalty_percentage, 0), 0), 100);
  v_status text := lower(coalesce(new.production_order_status, ''));
  v_payment_status text := lower(coalesce(new.payment_status, ''));
  v_is_terminal boolean;
begin
  v_is_terminal := v_status in ('cancelada', 'anulada', 'rechazada')
    or v_payment_status in ('cancelado', 'anulado', 'rechazado');

  if v_balance <= 0 then
    -- Pago completo: se congela el calculo y se registra paid_at una sola vez.
    if new.paid_at is null then
      new.paid_at := now();
    end if;

    new.overdue_days := greatest(coalesce(new.overdue_days, 0), 0);
    new.penalty_amount := greatest(coalesce(new.penalty_amount, 0), 0);

    return new;
  end if;

  -- Saldo > 0: se reactiva el calculo (por ejemplo, si se anulo un pago).
  new.paid_at := null;

  if v_is_terminal then
    new.overdue_days := 0;
    new.penalty_amount := 0;
    return new;
  end if;

  if v_due_date is null or v_today <= v_due_date then
    new.overdue_days := 0;
    new.penalty_amount := 0;
    return new;
  end if;

  new.overdue_days := (v_today - v_due_date);
  new.penalty_amount := round(v_balance * v_percentage / 100.0, 2);

  return new;
end;
$$;

revoke all on function public.compute_production_order_penalty() from public;

-- =========================================================
-- 3. TRIGGERS SOBRE production_orders
-- =========================================================

drop trigger if exists trg_production_orders_penalty_insert on public.production_orders;
drop trigger if exists trg_production_orders_penalty_update on public.production_orders;
drop trigger if exists trg_production_orders_penalty on public.production_orders;

create trigger trg_production_orders_penalty_insert
  before insert on public.production_orders
  for each row
  execute function public.compute_production_order_penalty();

create trigger trg_production_orders_penalty_update
  before update on public.production_orders
  for each row
  when (
    old.balance is distinct from new.balance
    or old.next_payment_date is distinct from new.next_payment_date
    or old.penalty_percentage is distinct from new.penalty_percentage
    or old.production_order_status is distinct from new.production_order_status
    or old.payment_status is distinct from new.payment_status
    or old.paid_at is distinct from new.paid_at
    or old.updated_at is distinct from new.updated_at
  )
  execute function public.compute_production_order_penalty();

-- =========================================================
-- 4. FUNCION PARA RECALCULAR UNA ORDEN PUNTUAL
-- =========================================================

create or replace function public.recalculate_production_order_penalty(p_production_order_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if p_production_order_id is null then
    return;
  end if;

  update public.production_orders
  set updated_at = now()
  where production_order_id = p_production_order_id;
end;
$$;

revoke all on function public.recalculate_production_order_penalty(uuid) from public;
grant execute on function public.recalculate_production_order_penalty(uuid) to authenticated;

-- =========================================================
-- 5. FUNCION GLOBAL PARA EL CRON DIARIO
-- =========================================================

create or replace function public.recalculate_all_overdue_production_orders()
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_count integer;
begin
  update public.production_orders
  set updated_at = now()
  where next_payment_date is not null
    and coalesce(balance, 0) > 0
    and paid_at is null
    and lower(coalesce(production_order_status, '')) not in ('cancelada', 'anulada', 'rechazada')
    and lower(coalesce(payment_status, '')) not in ('cancelado', 'anulado', 'rechazado');

  get diagnostics v_count = row_count;

  return v_count;
end;
$$;

revoke all on function public.recalculate_all_overdue_production_orders() from public;

-- =========================================================
-- 6. SEGURIDAD: los clientes no pueden modificar campos calculados
--    ni el porcentaje de penalizacion, aunque tuvieran una policy
--    de UPDATE. La seguridad no depende solo de ocultar inputs en React.
-- =========================================================

create or replace function public.enforce_production_order_protected_columns()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_is_internal boolean;
begin
  select exists (
    select 1
    from public.user_memberships um
    join public.roles r on r.role_id = um.role_id
    where um.user_id = auth.uid()
      and um.is_active = true
      and r.role_code is distinct from 'cliente'
  ) into v_is_internal;

  if v_is_internal then
    return new;
  end if;

  -- auth.uid() nulo (llamadas via service role / triggers / cron) no se restringe aqui.
  if auth.uid() is null then
    return new;
  end if;

  if new.penalty_percentage is distinct from old.penalty_percentage
    or new.overdue_days is distinct from old.overdue_days
    or new.penalty_amount is distinct from old.penalty_amount
    or new.next_payment_date is distinct from old.next_payment_date
    or new.balance is distinct from old.balance
    or new.paid_at is distinct from old.paid_at
  then
    raise exception 'No tiene permisos para modificar los campos de penalizacion o saldo de la orden.';
  end if;

  return new;
end;
$$;

revoke all on function public.enforce_production_order_protected_columns() from public;

drop trigger if exists trg_production_orders_protect_columns on public.production_orders;

create trigger trg_production_orders_protect_columns
  before update on public.production_orders
  for each row
  execute function public.enforce_production_order_protected_columns();

-- =========================================================
-- 7. CRON DIARIO (pg_cron) - 12:05 a.m. Costa Rica = 06:05 UTC
-- =========================================================

create extension if not exists pg_cron;

select cron.unschedule(jobid)
from cron.job
where jobname = 'recalculate-production-order-penalties-daily';

select cron.schedule(
  'recalculate-production-order-penalties-daily',
  '5 6 * * *',
  $$select public.recalculate_all_overdue_production_orders();$$
);

-- =========================================================
-- 8. NORMALIZAR ORDENES EXISTENTES
-- =========================================================

select public.recalculate_all_overdue_production_orders();
