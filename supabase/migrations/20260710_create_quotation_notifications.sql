-- Fase 2: registro y reintento de notificaciones de cotizacion.
-- Ejecutar este script en el SQL Editor de Supabase (Proyecto GV eCommerce System).

create table if not exists public.quotation_notifications (
  notification_id uuid primary key default gen_random_uuid(),
  quotation_id uuid not null references public.quotations (quotation_id) on delete cascade,
  representative_id uuid not null references public.representatives (representative_id) on delete cascade,
  auth_user_id uuid null,
  email text not null,
  notification_type text not null check (notification_type in ('invite', 'activation', 'new_quotation')),
  status text not null default 'pending' check (status in ('pending', 'sent', 'failed')),
  error_message text null,
  attempt_count integer not null default 0,
  created_by uuid null,
  sent_at timestamptz null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.quotation_notifications is
  'Registro de intentos de notificacion (invitacion, activacion, nueva cotizacion) enviados a representantes de clientes.';

create index if not exists idx_quotation_notifications_quotation_id
  on public.quotation_notifications (quotation_id);

create index if not exists idx_quotation_notifications_representative_id
  on public.quotation_notifications (representative_id);

create index if not exists idx_quotation_notifications_status
  on public.quotation_notifications (status);

-- Evita duplicar notificaciones del mismo tipo para la misma cotizacion/representante
-- mientras siguen pendientes o ya se enviaron correctamente.
create unique index if not exists uq_quotation_notifications_pending_or_sent
  on public.quotation_notifications (quotation_id, representative_id, notification_type)
  where status in ('pending', 'sent');

create or replace function public.set_quotation_notifications_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_quotation_notifications_updated_at on public.quotation_notifications;

create trigger trg_quotation_notifications_updated_at
  before update on public.quotation_notifications
  for each row
  execute function public.set_quotation_notifications_updated_at();

alter table public.quotation_notifications enable row level security;

-- Lectura: solo usuarios internos autenticados (no clientes) pueden ver el historial de notificaciones.
drop policy if exists "internal_users_can_read_notifications" on public.quotation_notifications;

create policy "internal_users_can_read_notifications"
  on public.quotation_notifications
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.user_memberships um
      join public.roles r on r.role_id = um.role_id
      where um.user_id = auth.uid()
        and um.is_active = true
        and r.role_code is distinct from 'cliente'
    )
  );

-- Ninguna escritura directa desde clientes: solo el rol de servicio (Edge Functions) puede insertar/actualizar.
-- No se define policy de insert/update/delete para authenticated/anon, por lo que quedan bloqueadas por RLS,
-- y unicamente las llamadas hechas con la Service Role Key (que ignora RLS) pueden escribir.
