drop trigger if exists notify_quotation_approved on public.quotations;

alter table public.quotations
  drop column if exists state,
  drop column if exists status;
