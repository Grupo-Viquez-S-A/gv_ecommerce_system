do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'storage'
      and tablename = 'objects'
      and policyname = 'payment_files_authenticated_insert'
  ) then
    create policy "payment_files_authenticated_insert"
      on storage.objects
      for insert
      to authenticated
      with check (
        bucket_id = 'Ecommerce'
        and lower((storage.foldername(name))[1]) = 'comprobantes'
      );
  end if;
end $$;

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'storage'
      and tablename = 'objects'
      and policyname = 'payment_files_authenticated_select'
  ) then
    create policy "payment_files_authenticated_select"
      on storage.objects
      for select
      to authenticated
      using (
        bucket_id = 'Ecommerce'
        and lower((storage.foldername(name))[1]) = 'comprobantes'
      );
  end if;
end $$;

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'storage'
      and tablename = 'objects'
      and policyname = 'payment_files_authenticated_update'
  ) then
    create policy "payment_files_authenticated_update"
      on storage.objects
      for update
      to authenticated
      using (
        bucket_id = 'Ecommerce'
        and lower((storage.foldername(name))[1]) = 'comprobantes'
      )
      with check (
        bucket_id = 'Ecommerce'
        and lower((storage.foldername(name))[1]) = 'comprobantes'
      );
  end if;
end $$;

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'storage'
      and tablename = 'objects'
      and policyname = 'payment_files_authenticated_delete'
  ) then
    create policy "payment_files_authenticated_delete"
      on storage.objects
      for delete
      to authenticated
      using (
        bucket_id = 'Ecommerce'
        and lower((storage.foldername(name))[1]) = 'comprobantes'
      );
  end if;
end $$;
