-- Acceso público de solo lectura para /cliente/catalogo.
-- No concede INSERT, UPDATE ni DELETE a visitantes anónimos.

BEGIN;

DO $$
DECLARE
  table_name text;
  policy_name text;
BEGIN
  FOREACH table_name IN ARRAY ARRAY[
    'fabrics',
    'color_variants',
    'materials',
    'features',
    'managements',
    'fabric_files',
    'textile_products',
    'textile_product_files',
    'textile_product_measurements',
    'categories',
    'product_types',
    'product_collections',
    'sizes',
    'dimensions'
  ]
  LOOP
    IF to_regclass(format('public.%I', table_name)) IS NOT NULL THEN
      EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', table_name);
      EXECUTE format('GRANT SELECT ON TABLE public.%I TO anon, authenticated', table_name);

      policy_name := 'public_catalog_read_' || table_name;
      EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', policy_name, table_name);
      EXECUTE format(
        'CREATE POLICY %I ON public.%I FOR SELECT TO anon, authenticated USING (true)',
        policy_name,
        table_name
      );
    END IF;
  END LOOP;
END;
$$;

COMMIT;
