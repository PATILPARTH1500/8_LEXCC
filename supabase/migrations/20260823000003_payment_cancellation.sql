BEGIN;

CREATE OR REPLACE FUNCTION public.cancel_razorpay_order(
  p_order_id UUID,
  p_guest_token TEXT DEFAULT NULL
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, ''
AS $$
DECLARE
  v_order public.orders%ROWTYPE;
BEGIN
  IF p_order_id IS NULL THEN
    RAISE EXCEPTION 'Order ID is required';
  END IF;

  -- Lock the order
  SELECT * INTO v_order FROM public.orders WHERE id = p_order_id FOR UPDATE;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Order not found';
  END IF;

  -- Verify authorization
  IF v_order.user_id IS NOT NULL THEN
    IF auth.uid() IS DISTINCT FROM v_order.user_id THEN
      RAISE EXCEPTION 'Unauthorized';
    END IF;
  ELSE
    IF p_guest_token IS NULL OR encode(digest(p_guest_token, 'sha256'), 'hex') IS DISTINCT FROM v_order.guest_access_token_hash THEN
      RAISE EXCEPTION 'Unauthorized';
    END IF;
  END IF;

  -- Only cancel if it's strictly pending
  IF v_order.payment_status = 'pending' THEN
    UPDATE public.orders
    SET payment_status = 'cancelled',
        status = 'cancelled'
    WHERE id = p_order_id;
    RETURN TRUE;
  END IF;

  RETURN FALSE;
END;
$$;

-- Revoke all, grant execute
REVOKE ALL ON FUNCTION public.cancel_razorpay_order(UUID, TEXT) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.cancel_razorpay_order(UUID, TEXT) FROM anon;
GRANT EXECUTE ON FUNCTION public.cancel_razorpay_order(UUID, TEXT) TO authenticated, anon;


-- Cleanup function for stale pending orders
CREATE OR REPLACE FUNCTION public.cancel_stale_pending_orders()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, ''
AS $$
DECLARE
  v_count INTEGER;
BEGIN
  -- Cancel orders that have been pending for more than 1 hour
  WITH updated AS (
    UPDATE public.orders
    SET payment_status = 'cancelled',
        status = 'cancelled'
    WHERE payment_status = 'pending'
      AND created_at < NOW() - INTERVAL '1 hour'
    RETURNING id
  )
  SELECT count(*) INTO v_count FROM updated;
  
  RETURN v_count;
END;
$$;

REVOKE ALL ON FUNCTION public.cancel_stale_pending_orders() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.cancel_stale_pending_orders() TO service_role;

COMMIT;
