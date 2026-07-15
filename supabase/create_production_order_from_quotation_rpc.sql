-- Funcion RPC usada por el e-commerce para crear una orden de produccion
-- solo cuando el agente presiona el boton "Crear orden de produccion".
--
-- Ejecutar si la funcion ya existe en Supabase y el frontend recibe
-- errores de permisos al invocarla.

grant execute on function public.create_production_order_from_quotation(uuid)
to authenticated;
