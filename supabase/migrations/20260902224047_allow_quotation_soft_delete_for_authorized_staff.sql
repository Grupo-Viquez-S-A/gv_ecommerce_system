drop policy if exists "Authorized staff can update quotations"
  on public.quotations;

create policy "Authorized staff can update quotations"
  on public.quotations
  for update
  to authenticated
  using (
    public.current_user_has_quotation_adjustment_access(company_id)
  )
  with check (
    public.current_user_has_quotation_adjustment_access(company_id)
  );
