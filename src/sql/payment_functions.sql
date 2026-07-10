-- =========================================================
-- FUNCIONES RPC PARA REPORTE DE PAGOS
-- =========================================================

-- 1. Insertar comprobante de pago (bypass RLS)
CREATE OR REPLACE FUNCTION public.insert_payment_receipt(
  p_payment_id UUID,
  p_bucket_name TEXT,
  p_folder_name TEXT,
  p_object_path TEXT,
  p_file_name TEXT,
  p_mime_type TEXT,
  p_file_size BIGINT,
  p_created_by UUID
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.payment_receipts (
    payment_id,
    bucket_name,
    folder_name,
    object_path,
    file_name,
    mime_type,
    file_size,
    is_valid,
    created_by
  ) VALUES (
    p_payment_id,
    p_bucket_name,
    p_folder_name,
    p_object_path,
    p_file_name,
    p_mime_type,
    p_file_size,
    false,
    p_created_by
  );
END;
$$;

-- 2. Insertar pago (bypass RLS)
CREATE OR REPLACE FUNCTION public.insert_payment(
  p_production_order_id UUID,
  p_method_id UUID,
  p_amount NUMERIC,
  p_payment_date DATE,
  p_reference_number TEXT,
  p_notes TEXT,
  p_created_by UUID
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_payment_id UUID;
BEGIN
  IF p_reference_number IS NULL OR btrim(p_reference_number) = '' THEN
    RAISE EXCEPTION 'El numero de referencia es obligatorio para reportar un pago.';
  END IF;

  INSERT INTO public.payments (
    production_order_id,
    method_id,
    amount,
    payment_date,
    reference_number,
    notes,
    is_valid,
    created_by
  ) VALUES (
    p_production_order_id,
    p_method_id,
    p_amount,
    p_payment_date,
    p_reference_number,
    p_notes,
    false,
    p_created_by
  )
  RETURNING payment_id INTO v_payment_id;

  RETURN v_payment_id;
END;
$$;

-- =========================================================
-- POLITICAS DE STORAGE (aplicar en Supabase Dashboard)
-- Bucket: Ecommerce
-- =========================================================

-- SELECT (para leer comprobantes)
-- CREATE POLICY "Authenticated can select from Ecommerce" ON storage.objects
-- FOR SELECT TO authenticated USING (bucket_id = 'Ecommerce');

-- INSERT (para subir comprobantes)
-- CREATE POLICY "Authenticated can insert into Ecommerce" ON storage.objects
-- FOR INSERT TO authenticated WITH CHECK (bucket_id = 'Ecommerce');
