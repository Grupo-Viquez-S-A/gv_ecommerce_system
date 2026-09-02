create or replace function private.notify_quotation_created()
returns trigger
language plpgsql
security definer
set search_path to ''
as $function$
begin
  perform private.notify_module_users(
    array['commercial.quotations'],
    'quotation.created',
    U&'Nueva cotización ' || coalesce(new.quotation_number, ''),
    U&'Se recibió una nueva cotización y está lista para revisión.',
    'quotation',
    new.quotation_id,
    'ecommerce',
    '/comercial/cotizaciones',
    '/cotizaciones',
    jsonb_build_object(
      'quotation_number', new.quotation_number,
      'status', 'created'
    )
  );

  return new;
end;
$function$;
