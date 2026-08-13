-- Guarda la empresa interna del grupo asociada a cada cotizacion.
-- Ejecutar una vez en el SQL Editor de Supabase.

alter table public.quotations
add column if not exists company_id uuid;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'quotations_company_id_fkey'
  ) then
    alter table public.quotations
      add constraint quotations_company_id_fkey
      foreign key (company_id)
      references public.companies(company_id);
  end if;
end $$;

update public.quotations q
set company_id = b.company_id
from public.businesses b
where q.business_id = b.business_id
  and q.company_id is null;

-- Opcional: activar solo cuando todas las cotizaciones tengan company_id.
-- alter table public.quotations alter column company_id set not null;
