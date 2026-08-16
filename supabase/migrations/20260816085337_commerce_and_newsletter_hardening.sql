-- REQUIRES LIVE SUPABASE VERIFICATION
-- Add durable newsletter subscriptions, secure guest-order access, and idempotent
-- Razorpay fulfillment primitives. Historical migrations remain unchanged.

BEGIN;

-- Newsletter storage is write-only through a narrow RPC. Customer emails are never public.
CREATE TABLE IF NOT EXISTS public.newsletter_subscribers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT NOT NULL,
  source TEXT NOT NULL DEFAULT 'website',
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'unsubscribed')),
  subscribed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  unsubscribed_at TIMESTAMPTZ,
  CONSTRAINT newsletter_subscribers_email_key UNIQUE (email),
  CONSTRAINT newsletter_subscribers_source_check CHECK (source IN ('home', 'footer', 'website'))
);

ALTER TABLE public.newsletter_subscribers ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON TABLE public.newsletter_subscribers FROM anon;
GRANT SELECT ON TABLE public.newsletter_subscribers TO authenticated;
GRANT ALL ON TABLE public.newsletter_subscribers TO service_role;

DROP POLICY IF EXISTS "Admins can view newsletter subscribers" ON public.newsletter_subscribers;
CREATE POLICY "Admins can view newsletter subscribers"
  ON public.newsletter_subscribers
  FOR SELECT
  TO authenticated
  USING (public.is_admin());

CREATE OR REPLACE FUNCTION public.subscribe_to_newsletter(
  p_email TEXT,
  p_source TEXT DEFAULT 'website'
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_email TEXT := lower(trim(p_email));
  v_source TEXT := lower(trim(COALESCE(p_source, 'website')));
BEGIN
  IF length(v_email) > 254
     OR v_email !~* '^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$' COLLATE "C" THEN
    RAISE EXCEPTION 'A valid email address is required';
  END IF;

  IF v_source NOT IN ('home', 'footer', 'website') THEN
    v_source := 'website';
  END IF;

  INSERT INTO public.newsletter_subscribers (
    email,
    source,
    status,
    subscribed_at,
    unsubscribed_at
  )
  VALUES (v_email, v_source, 'active', NOW(), NULL)
  ON CONFLICT (email) DO UPDATE
    SET source = EXCLUDED.source,
        status = 'active',
        subscribed_at = NOW(),
        unsubscribed_at = NULL;

  RETURN TRUE;
END;
$$;

REVOKE ALL ON FUNCTION public.subscribe_to_newsletter(TEXT, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.subscribe_to_newsletter(TEXT, TEXT) TO anon, authenticated;

-- Guest tokens are stored only as SHA-256 hashes. The raw token is returned once by the
-- order-creation Edge Function and is required for guest verification/invoice access.
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS guest_access_token_hash TEXT,
  ADD COLUMN IF NOT EXISTS razorpay_signature TEXT,
  ADD COLUMN IF NOT EXISTS razorpay_refund_id TEXT,
  ADD COLUMN IF NOT EXISTS payment_verified_at TIMESTAMPTZ;

-- Order totals, payment IDs, and line-item prices are now written only by the
-- validated server-side checkout path. Customers retain read access through RLS.
DROP POLICY IF EXISTS "Users can insert their own orders." ON public.orders;
DROP POLICY IF EXISTS "Users can insert their own order items." ON public.order_items;
REVOKE INSERT ON TABLE public.orders FROM anon, authenticated;
REVOKE INSERT ON TABLE public.order_items FROM anon, authenticated;
GRANT ALL ON TABLE public.orders TO service_role;
GRANT ALL ON TABLE public.order_items TO service_role;

ALTER TABLE public.cart_items
  ADD COLUMN IF NOT EXISTS variant_id UUID REFERENCES public.product_variants(id) ON DELETE SET NULL;

-- A client-generated merge ID makes guest-cart migration atomic and idempotent even
-- when the browser retries after losing a network response.
CREATE TABLE IF NOT EXISTS public.cart_merge_events (
  merge_id UUID PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  cart_id UUID NOT NULL REFERENCES public.carts(id) ON DELETE CASCADE,
  completed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.cart_merge_events ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.cart_merge_events FROM anon, authenticated;
GRANT ALL ON TABLE public.cart_merge_events TO service_role;

CREATE OR REPLACE FUNCTION public.merge_guest_cart(
  p_merge_id UUID,
  p_items JSONB
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_user_id UUID := (SELECT auth.uid());
  v_cart_id UUID;
  v_item JSONB;
  v_product_id UUID;
  v_variant_id UUID;
  v_quantity INTEGER;
  v_size TEXT;
  v_color TEXT;
  v_claimed BOOLEAN := FALSE;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Authentication is required';
  END IF;

  IF p_merge_id IS NULL
     OR p_items IS NULL
     OR jsonb_typeof(p_items) IS DISTINCT FROM 'array'
     OR jsonb_array_length(p_items) = 0
     OR jsonb_array_length(p_items) > 50 THEN
    RAISE EXCEPTION 'A valid cart merge payload is required';
  END IF;

  INSERT INTO public.carts (user_id)
  VALUES (v_user_id)
  ON CONFLICT (user_id) DO UPDATE SET user_id = EXCLUDED.user_id
  RETURNING id INTO v_cart_id;

  INSERT INTO public.cart_merge_events (merge_id, user_id, cart_id)
  VALUES (p_merge_id, v_user_id, v_cart_id)
  ON CONFLICT (merge_id) DO NOTHING
  RETURNING TRUE INTO v_claimed;

  IF NOT COALESCE(v_claimed, FALSE) THEN
    IF NOT EXISTS (
      SELECT 1
      FROM public.cart_merge_events
      WHERE merge_id = p_merge_id
        AND user_id = v_user_id
    ) THEN
      RAISE EXCEPTION 'Cart merge ID belongs to another account';
    END IF;
    RETURN FALSE;
  END IF;

  FOR v_item IN SELECT value FROM jsonb_array_elements(p_items)
  LOOP
    IF COALESCE(v_item->>'product_id', '') !~* '^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$'
       OR COALESCE(v_item->>'quantity', '') !~ '^[1-9][0-9]?$' THEN
      RAISE EXCEPTION 'The cart contains an invalid item';
    END IF;

    v_product_id := (v_item->>'product_id')::UUID;
    v_quantity := (v_item->>'quantity')::INTEGER;
    v_size := left(COALESCE(NULLIF(trim(v_item->>'size'), ''), 'default'), 50);
    v_color := left(COALESCE(NULLIF(trim(v_item->>'color'), ''), 'default'), 50);
    v_variant_id := NULL;

    IF NULLIF(trim(v_item->>'variant_id'), '') IS NOT NULL THEN
      IF (v_item->>'variant_id') !~* '^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$' THEN
        RAISE EXCEPTION 'The cart contains an invalid variant';
      END IF;
      v_variant_id := (v_item->>'variant_id')::UUID;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM public.products WHERE id = v_product_id) THEN
      RAISE EXCEPTION 'Cart product not found';
    END IF;

    IF v_variant_id IS NOT NULL AND NOT EXISTS (
      SELECT 1
      FROM public.product_variants
      WHERE id = v_variant_id
        AND product_id = v_product_id
    ) THEN
      RAISE EXCEPTION 'Cart variant does not belong to its product';
    END IF;

    INSERT INTO public.cart_items (
      cart_id,
      product_id,
      variant_id,
      size,
      color,
      quantity
    )
    VALUES (
      v_cart_id,
      v_product_id,
      v_variant_id,
      v_size,
      v_color,
      v_quantity
    )
    ON CONFLICT (cart_id, product_id, size, color) DO UPDATE
      SET quantity = public.cart_items.quantity + EXCLUDED.quantity,
          variant_id = COALESCE(EXCLUDED.variant_id, public.cart_items.variant_id);
  END LOOP;

  RETURN TRUE;
END;
$$;

REVOKE ALL ON FUNCTION public.merge_guest_cart(UUID, JSONB) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.merge_guest_cart(UUID, JSONB) FROM anon;
GRANT EXECUTE ON FUNCTION public.merge_guest_cart(UUID, JSONB) TO authenticated, service_role;

CREATE UNIQUE INDEX IF NOT EXISTS orders_razorpay_order_id_key
  ON public.orders (razorpay_order_id)
  WHERE razorpay_order_id IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS orders_razorpay_payment_id_key
  ON public.orders (razorpay_payment_id)
  WHERE razorpay_payment_id IS NOT NULL;

CREATE TABLE IF NOT EXISTS public.razorpay_webhook_events (
  event_id TEXT PRIMARY KEY,
  event_type TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'processing' CHECK (status IN ('processing', 'processed', 'failed')),
  attempts INTEGER NOT NULL DEFAULT 1 CHECK (attempts > 0),
  received_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  processed_at TIMESTAMPTZ,
  error_message TEXT
);

ALTER TABLE public.razorpay_webhook_events ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON TABLE public.razorpay_webhook_events FROM anon, authenticated;
GRANT ALL ON TABLE public.razorpay_webhook_events TO service_role;

DROP POLICY IF EXISTS "Admins can view Razorpay webhook events" ON public.razorpay_webhook_events;
CREATE POLICY "Admins can view Razorpay webhook events"
  ON public.razorpay_webhook_events
  FOR SELECT
  TO authenticated
  USING (public.is_admin());

CREATE OR REPLACE FUNCTION public.claim_razorpay_webhook_event(
  p_event_id TEXT,
  p_event_type TEXT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = ''
AS $$
DECLARE
  v_claimed BOOLEAN := FALSE;
BEGIN
  IF p_event_id IS NULL OR length(trim(p_event_id)) = 0 OR length(p_event_id) > 255 THEN
    RAISE EXCEPTION 'A valid Razorpay event ID is required';
  END IF;

  INSERT INTO public.razorpay_webhook_events (
    event_id,
    event_type,
    status,
    attempts,
    received_at,
    processed_at,
    error_message
  )
  VALUES (p_event_id, p_event_type, 'processing', 1, NOW(), NULL, NULL)
  ON CONFLICT (event_id) DO UPDATE
    SET status = 'processing',
        attempts = public.razorpay_webhook_events.attempts + 1,
        received_at = NOW(),
        processed_at = NULL,
        error_message = NULL
  WHERE public.razorpay_webhook_events.status = 'failed'
     OR (
       public.razorpay_webhook_events.status = 'processing'
       AND public.razorpay_webhook_events.received_at < NOW() - INTERVAL '5 minutes'
     )
  RETURNING TRUE INTO v_claimed;

  RETURN COALESCE(v_claimed, FALSE);
END;
$$;

-- Atomically mark an order paid and deduct inventory once. Both the client-verification
-- function and the webhook use this same idempotent operation.
CREATE OR REPLACE FUNCTION public.finalize_razorpay_payment(
  p_order_id UUID,
  p_payment_id TEXT,
  p_signature TEXT DEFAULT NULL
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = ''
AS $$
DECLARE
  v_order public.orders%ROWTYPE;
  v_item RECORD;
BEGIN
  IF p_order_id IS NULL OR p_payment_id IS NULL OR length(trim(p_payment_id)) = 0 THEN
    RAISE EXCEPTION 'Order and payment IDs are required';
  END IF;

  SELECT *
  INTO v_order
  FROM public.orders
  WHERE id = p_order_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Order not found';
  END IF;

  IF v_order.payment_status = 'paid' THEN
    IF v_order.razorpay_payment_id IS DISTINCT FROM p_payment_id THEN
      RAISE EXCEPTION 'Order is already linked to a different payment';
    END IF;
    RETURN FALSE;
  END IF;

  IF v_order.payment_status = 'refunded' THEN
    RAISE EXCEPTION 'A refunded order cannot be paid again';
  END IF;

  FOR v_item IN
    SELECT variant_id, quantity
    FROM public.order_items
    WHERE order_id = p_order_id
      AND variant_id IS NOT NULL
  LOOP
    IF NOT public.deduct_variant_stock(v_item.variant_id, v_item.quantity) THEN
      RAISE EXCEPTION 'Insufficient inventory for variant %', v_item.variant_id;
    END IF;
  END LOOP;

  UPDATE public.orders
  SET payment_status = 'paid',
      status = 'processing',
      razorpay_payment_id = p_payment_id,
      razorpay_signature = COALESCE(p_signature, razorpay_signature),
      payment_verified_at = NOW()
  WHERE id = p_order_id;

  RETURN TRUE;
END;
$$;

CREATE OR REPLACE FUNCTION public.finalize_razorpay_refund(
  p_order_id UUID,
  p_refund_id TEXT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = ''
AS $$
DECLARE
  v_order public.orders%ROWTYPE;
  v_item RECORD;
BEGIN
  SELECT *
  INTO v_order
  FROM public.orders
  WHERE id = p_order_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Order not found';
  END IF;

  IF v_order.payment_status = 'refunded' THEN
    RETURN FALSE;
  END IF;

  IF v_order.payment_status <> 'paid' THEN
    RAISE EXCEPTION 'Only a paid order can be refunded';
  END IF;

  FOR v_item IN
    SELECT variant_id, quantity
    FROM public.order_items
    WHERE order_id = p_order_id
      AND variant_id IS NOT NULL
  LOOP
    PERFORM public.restore_variant_stock(v_item.variant_id, v_item.quantity);
  END LOOP;

  UPDATE public.orders
  SET payment_status = 'refunded',
      status = 'cancelled',
      razorpay_refund_id = p_refund_id
  WHERE id = p_order_id;

  RETURN TRUE;
END;
$$;

REVOKE ALL ON FUNCTION public.claim_razorpay_webhook_event(TEXT, TEXT) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.claim_razorpay_webhook_event(TEXT, TEXT) FROM anon, authenticated;
GRANT EXECUTE ON FUNCTION public.claim_razorpay_webhook_event(TEXT, TEXT) TO service_role;

REVOKE ALL ON FUNCTION public.finalize_razorpay_payment(UUID, TEXT, TEXT) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.finalize_razorpay_payment(UUID, TEXT, TEXT) FROM anon, authenticated;
GRANT EXECUTE ON FUNCTION public.finalize_razorpay_payment(UUID, TEXT, TEXT) TO service_role;

REVOKE ALL ON FUNCTION public.finalize_razorpay_refund(UUID, TEXT) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.finalize_razorpay_refund(UUID, TEXT) FROM anon, authenticated;
GRANT EXECUTE ON FUNCTION public.finalize_razorpay_refund(UUID, TEXT) TO service_role;

COMMIT;
