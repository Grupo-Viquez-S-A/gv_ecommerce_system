-- Hace obligatorio el numero de referencia al reportar un pago.
-- Ejecutar este script completo en el SQL Editor de Supabase.
-- Es idempotente: puede ejecutarse varias veces sin efectos duplicados.

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
