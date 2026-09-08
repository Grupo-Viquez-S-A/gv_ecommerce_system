alter table public.files
  alter column purchase_request_item_id drop not null;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conrelid = 'public.files'::regclass
      and conname = 'files_has_related_record_check'
  ) then
    alter table public.files
      add constraint files_has_related_record_check
      check (
        purchase_request_item_id is not null
        or payment_id is not null
        or payment_receipt_id is not null
      ) not valid;
  end if;
end $$;

alter table public.files
  validate constraint files_has_related_record_check;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'files'
      and policyname = 'Authenticated can select files'
  ) then
    create policy "Authenticated can select files"
      on public.files
      for select
      to authenticated
      using (true);
  end if;
end $$;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'files'
      and policyname = 'Authenticated can insert files'
  ) then
    create policy "Authenticated can insert files"
      on public.files
      for insert
      to authenticated
      with check (true);
  end if;
end $$;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'files'
      and policyname = 'Authenticated can update files'
  ) then
    create policy "Authenticated can update files"
      on public.files
      for update
      to authenticated
      using (true)
      with check (true);
  end if;
end $$;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'files'
      and policyname = 'Authenticated can delete files'
  ) then
    create policy "Authenticated can delete files"
      on public.files
      for delete
      to authenticated
      using (true);
  end if;
end $$;
