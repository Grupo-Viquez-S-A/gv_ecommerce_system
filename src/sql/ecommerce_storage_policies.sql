-- =========================================================
-- POLITICAS DE STORAGE PARA BUCKET: Ecommerce
-- Basado en las politicas de TO_CATALOGO_IMGS (funcionan)
-- =========================================================

-- DELETE: Permitir a usuarios autenticados eliminar
DROP POLICY IF EXISTS "Allow authenticated delete Ecommerce comprobantes"
ON storage.objects;

CREATE POLICY "Allow authenticated delete Ecommerce comprobantes"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'Ecommerce');


-- SELECT: Permitir a usuarios autenticados leer
DROP POLICY IF EXISTS "Allow authenticated read Ecommerce comprobantes"
ON storage.objects;

CREATE POLICY "Allow authenticated read Ecommerce comprobantes"
ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'Ecommerce');


-- UPDATE: Permitir a usuarios autenticados actualizar
DROP POLICY IF EXISTS "Allow authenticated update Ecommerce comprobantes"
ON storage.objects;

CREATE POLICY "Allow authenticated update Ecommerce comprobantes"
ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'Ecommerce')
WITH CHECK (bucket_id = 'Ecommerce');


-- INSERT: Permitir a usuarios autenticados subir
DROP POLICY IF EXISTS "Allow authenticated upload Ecommerce comprobantes"
ON storage.objects;

CREATE POLICY "Allow authenticated upload Ecommerce comprobantes"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'Ecommerce');
