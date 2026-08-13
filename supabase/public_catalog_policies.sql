-- Acceso publico de solo lectura para /cliente/catalogo.
-- No concede INSERT, UPDATE ni DELETE a visitantes anonimos.
-- IMPORTANTE: al permitir SELECT a anon, las columnas seleccionables por REST
-- tambien son publicas. Si necesitas ocultar precios a nivel API, usa una
-- vista/RPC/Edge Function que devuelva solo columnas publicas.

BEGIN;

-- Catalogo de telas.
ALTER TABLE IF EXISTS public.fabrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.color_variants ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.materials ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.features ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.managements ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.fabric_files ENABLE ROW LEVEL SECURITY;

GRANT SELECT ON TABLE
  public.fabrics,
  public.color_variants,
  public.materials,
  public.features,
  public.managements,
  public.fabric_files
TO anon, authenticated;

DROP POLICY IF EXISTS public_catalog_read_fabrics ON public.fabrics;
CREATE POLICY public_catalog_read_fabrics
ON public.fabrics
FOR SELECT
TO anon, authenticated
USING (true);

DROP POLICY IF EXISTS public_catalog_read_color_variants ON public.color_variants;
CREATE POLICY public_catalog_read_color_variants
ON public.color_variants
FOR SELECT
TO anon, authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.fabrics f
    WHERE f.id = color_variants.fabric_id
  )
);

DROP POLICY IF EXISTS public_catalog_read_materials ON public.materials;
CREATE POLICY public_catalog_read_materials
ON public.materials
FOR SELECT
TO anon, authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.fabrics f
    WHERE f.id = materials.fabric_id
  )
);

DROP POLICY IF EXISTS public_catalog_read_features ON public.features;
CREATE POLICY public_catalog_read_features
ON public.features
FOR SELECT
TO anon, authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.fabrics f
    WHERE f.id = features.fabric_id
  )
);

DROP POLICY IF EXISTS public_catalog_read_managements ON public.managements;
CREATE POLICY public_catalog_read_managements
ON public.managements
FOR SELECT
TO anon, authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.fabrics f
    WHERE f.id = managements.fabric_id
  )
);

DROP POLICY IF EXISTS public_catalog_read_fabric_files ON public.fabric_files;
CREATE POLICY public_catalog_read_fabric_files
ON public.fabric_files
FOR SELECT
TO anon, authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.fabrics f
    WHERE f.id = fabric_files.fabric_id
  )
);

-- Catalogo de productos.
ALTER TABLE IF EXISTS public.textile_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.textile_product_files ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.textile_product_measurements ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.textile_product_variants ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.textile_product_variant_measurements ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.variant_files ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.product_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.product_collections ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.sizes ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.dimensions ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.product_colors ENABLE ROW LEVEL SECURITY;

GRANT SELECT ON TABLE
  public.textile_products,
  public.textile_product_files,
  public.textile_product_measurements,
  public.textile_product_variants,
  public.textile_product_variant_measurements,
  public.variant_files,
  public.categories,
  public.product_types,
  public.product_collections,
  public.sizes,
  public.dimensions,
  public.product_colors
TO anon, authenticated;

DROP POLICY IF EXISTS public_catalog_read_textile_product_variants ON public.textile_product_variants;
CREATE POLICY public_catalog_read_textile_product_variants
ON public.textile_product_variants
FOR SELECT
TO anon, authenticated
USING (
  is_active = true
  AND EXISTS (
    SELECT 1 FROM public.textile_products p
    WHERE p.product_id = textile_product_variants.product_id
      AND p.is_active = true
  )
);

DROP POLICY IF EXISTS public_catalog_read_textile_variant_measurements ON public.textile_product_variant_measurements;
CREATE POLICY public_catalog_read_textile_variant_measurements
ON public.textile_product_variant_measurements
FOR SELECT
TO anon, authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.textile_product_variants v
    JOIN public.textile_products p ON p.product_id = v.product_id
    WHERE v.variant_id = textile_product_variant_measurements.variant_id
      AND v.is_active = true
      AND p.is_active = true
  )
);

DROP POLICY IF EXISTS public_catalog_read_variant_files ON public.variant_files;
CREATE POLICY public_catalog_read_variant_files
ON public.variant_files
FOR SELECT
TO anon, authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.textile_product_variants v
    JOIN public.textile_products p ON p.product_id = v.product_id
    WHERE v.variant_id = variant_files.variant_id
      AND v.is_active = true
      AND p.is_active = true
  )
);

DROP POLICY IF EXISTS public_catalog_read_textile_products ON public.textile_products;
CREATE POLICY public_catalog_read_textile_products
ON public.textile_products
FOR SELECT
TO anon, authenticated
USING (is_active = true);

DROP POLICY IF EXISTS public_catalog_read_textile_product_files ON public.textile_product_files;
CREATE POLICY public_catalog_read_textile_product_files
ON public.textile_product_files
FOR SELECT
TO anon, authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.textile_products p
    WHERE p.product_id = textile_product_files.product_id
      AND p.is_active = true
  )
);

DROP POLICY IF EXISTS public_catalog_read_textile_product_measurements ON public.textile_product_measurements;
CREATE POLICY public_catalog_read_textile_product_measurements
ON public.textile_product_measurements
FOR SELECT
TO anon, authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.textile_products p
    WHERE p.product_id = textile_product_measurements.product_id
      AND p.is_active = true
  )
);

DROP POLICY IF EXISTS public_catalog_read_categories ON public.categories;
CREATE POLICY public_catalog_read_categories
ON public.categories
FOR SELECT
TO anon, authenticated
USING (is_active = true);

DROP POLICY IF EXISTS public_catalog_read_product_types ON public.product_types;
CREATE POLICY public_catalog_read_product_types
ON public.product_types
FOR SELECT
TO anon, authenticated
USING (true);

DROP POLICY IF EXISTS public_catalog_read_product_collections ON public.product_collections;
CREATE POLICY public_catalog_read_product_collections
ON public.product_collections
FOR SELECT
TO anon, authenticated
USING (is_active = true);

DROP POLICY IF EXISTS public_catalog_read_sizes ON public.sizes;
CREATE POLICY public_catalog_read_sizes
ON public.sizes
FOR SELECT
TO anon, authenticated
USING (true);

DROP POLICY IF EXISTS public_catalog_read_dimensions ON public.dimensions;
CREATE POLICY public_catalog_read_dimensions
ON public.dimensions
FOR SELECT
TO anon, authenticated
USING (true);

DROP POLICY IF EXISTS public_catalog_read_product_colors ON public.product_colors;
CREATE POLICY public_catalog_read_product_colors
ON public.product_colors
FOR SELECT
TO anon, authenticated
USING (is_active = true);

COMMIT;
