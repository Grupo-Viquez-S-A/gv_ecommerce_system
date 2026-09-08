alter table public.payments
  add column if not exists invoice_number varchar;

update public.payments
set invoice_number = 'SIN-FACTURA'
where invoice_number is null
   or btrim(invoice_number) = '';

alter table public.payments
  alter column invoice_number set not null;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conrelid = 'public.payments'::regclass
      and conname = 'payments_invoice_number_not_blank'
  ) then
    alter table public.payments
      add constraint payments_invoice_number_not_blank
      check (btrim(invoice_number) <> '');
  end if;
end $$;
