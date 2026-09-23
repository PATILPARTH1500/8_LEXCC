BEGIN;

ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS payment_method TEXT NOT NULL DEFAULT 'razorpay';

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conrelid = 'public.orders'::regclass
      AND conname = 'orders_payment_method_check'
  ) THEN
    ALTER TABLE public.orders
      ADD CONSTRAINT orders_payment_method_check
      CHECK (payment_method IN ('razorpay', 'cod'));
  END IF;
END;
$$;

CREATE INDEX IF NOT EXISTS order_items_order_id_idx
  ON public.order_items (order_id);

CREATE INDEX IF NOT EXISTS product_variants_product_id_idx
  ON public.product_variants (product_id);

CREATE INDEX IF NOT EXISTS product_images_product_order_idx
  ON public.product_images (product_id, display_order);

-- Called only by the authenticated COD Edge Function through the service role.
-- Product prices and stock are read and mutated inside this transaction so a
-- browser cannot choose prices and concurrent checkouts cannot oversell stock.
CREATE OR REPLACE FUNCTION public.create_cod_order_atomic(
  p_user_id UUID,
  p_shipping_address JSONB,
  p_items JSONB
)
RETURNS TABLE (
  order_id UUID,
  order_number TEXT,
  total NUMERIC
)
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = ''
AS $$
DECLARE
  v_order_id UUID := gen_random_uuid();
  v_order_number TEXT;
  v_item JSONB;
  v_product_id UUID;
  v_variant_id UUID;
  v_quantity INTEGER;
  v_price NUMERIC;
  v_product_status TEXT;
  v_total NUMERIC := 0;
  v_updated_id UUID;
  v_first_name TEXT;
  v_last_name TEXT;
  v_street TEXT;
  v_address_line_2 TEXT;
  v_city TEXT;
  v_state TEXT;
  v_postal_code TEXT;
  v_country TEXT;
  v_email TEXT;
  v_phone TEXT;
BEGIN
  IF p_user_id IS NULL THEN
    RAISE EXCEPTION 'Authentication is required for Cash on Delivery';
  END IF;

  IF p_shipping_address IS NULL OR jsonb_typeof(p_shipping_address) <> 'object' THEN
    RAISE EXCEPTION 'A shipping address is required';
  END IF;

  v_first_name := trim(COALESCE(p_shipping_address->>'first_name', ''));
  v_last_name := trim(COALESCE(p_shipping_address->>'last_name', ''));
  v_street := trim(COALESCE(p_shipping_address->>'street', ''));
  v_address_line_2 := NULLIF(trim(COALESCE(p_shipping_address->>'address_line_2', '')), '');
  v_city := trim(COALESCE(p_shipping_address->>'city', ''));
  v_state := trim(COALESCE(p_shipping_address->>'state', ''));
  v_postal_code := trim(COALESCE(p_shipping_address->>'postal_code', ''));
  v_country := trim(COALESCE(p_shipping_address->>'country', ''));
  v_email := NULLIF(lower(trim(COALESCE(p_shipping_address->>'email', ''))), '');
  v_phone := NULLIF(regexp_replace(COALESCE(p_shipping_address->>'phone', ''), '[^0-9]', '', 'g'), '');

  IF v_first_name = '' OR v_last_name = '' OR v_street = '' OR v_city = '' OR v_state = '' THEN
    RAISE EXCEPTION 'The shipping address is incomplete';
  END IF;

  IF lower(v_country) <> 'india' OR v_postal_code !~ '^[0-9]{6}$' THEN
    RAISE EXCEPTION 'Cash on Delivery is unavailable for this address';
  END IF;

  IF p_items IS NULL
    OR jsonb_typeof(p_items) <> 'array'
    OR jsonb_array_length(p_items) = 0
    OR jsonb_array_length(p_items) > 50 THEN
    RAISE EXCEPTION 'A valid cart is required';
  END IF;

  v_order_number := 'LEX-'
    || to_char(clock_timestamp() AT TIME ZONE 'UTC', 'YYYYMMDDHH24MISSMS')
    || '-'
    || upper(substr(replace(v_order_id::TEXT, '-', ''), 1, 8));

  INSERT INTO public.orders (
    id,
    user_id,
    order_number,
    customer_name,
    email,
    phone,
    address_line_1,
    address_line_2,
    city,
    state,
    postal_code,
    country,
    shipping_address,
    total,
    total_amount,
    status,
    payment_status,
    payment_method
  )
  VALUES (
    v_order_id,
    p_user_id,
    v_order_number,
    concat_ws(' ', v_first_name, v_last_name),
    v_email,
    v_phone,
    v_street,
    v_address_line_2,
    v_city,
    v_state,
    v_postal_code,
    'India',
    p_shipping_address,
    0,
    0,
    'pending',
    'pending',
    'cod'
  );

  FOR v_item IN
    SELECT value
    FROM jsonb_array_elements(p_items)
    ORDER BY value->>'product_id', COALESCE(value->>'variant_id', '')
  LOOP
    IF COALESCE(v_item->>'product_id', '') !~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
      OR COALESCE(v_item->>'quantity', '') !~ '^[0-9]+$' THEN
      RAISE EXCEPTION 'The cart contains an invalid item';
    END IF;

    v_product_id := (v_item->>'product_id')::UUID;
    v_quantity := (v_item->>'quantity')::INTEGER;

    IF v_quantity < 1 OR v_quantity > 99 THEN
      RAISE EXCEPTION 'The cart contains an invalid quantity';
    END IF;

    IF NULLIF(v_item->>'variant_id', '') IS NOT NULL THEN
      IF (v_item->>'variant_id') !~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' THEN
        RAISE EXCEPTION 'The selected product variant is invalid';
      END IF;
      v_variant_id := (v_item->>'variant_id')::UUID;
    ELSE
      v_variant_id := NULL;
    END IF;

    SELECT p.price, p.status
    INTO v_price, v_product_status
    FROM public.products AS p
    WHERE p.id = v_product_id
    FOR SHARE;

    IF NOT FOUND OR v_product_status IS DISTINCT FROM 'active' OR v_price IS NULL OR v_price <= 0 THEN
      RAISE EXCEPTION 'Selected product is unavailable';
    END IF;

    IF v_variant_id IS NOT NULL THEN
      v_updated_id := NULL;
      UPDATE public.product_variants AS pv
      SET stock = pv.stock - v_quantity
      WHERE pv.id = v_variant_id
        AND pv.product_id = v_product_id
        AND COALESCE(pv.stock, 0) >= v_quantity
      RETURNING pv.id INTO v_updated_id;

      IF v_updated_id IS NULL THEN
        IF NOT EXISTS (
          SELECT 1
          FROM public.product_variants AS pv
          WHERE pv.id = v_variant_id
            AND pv.product_id = v_product_id
        ) THEN
          RAISE EXCEPTION 'The selected product variant is invalid';
        END IF;
        RAISE EXCEPTION 'Selected product is out of stock';
      END IF;
    ELSE
      IF EXISTS (
        SELECT 1
        FROM public.product_variants AS pv
        WHERE pv.product_id = v_product_id
      ) THEN
        RAISE EXCEPTION 'Please select a product variant before checkout';
      END IF;

      v_updated_id := NULL;
      UPDATE public.products AS p
      SET stock = p.stock - v_quantity
      WHERE p.id = v_product_id
        AND p.stock >= v_quantity
      RETURNING p.id INTO v_updated_id;

      IF v_updated_id IS NULL THEN
        RAISE EXCEPTION 'Selected product is out of stock';
      END IF;
    END IF;

    INSERT INTO public.order_items (
      order_id,
      product_id,
      variant_id,
      quantity,
      price,
      price_at_time
    )
    VALUES (
      v_order_id,
      v_product_id,
      v_variant_id,
      v_quantity,
      v_price,
      v_price
    );

    v_total := v_total + (v_price * v_quantity);
  END LOOP;

  UPDATE public.orders AS o
  SET total = v_total,
      total_amount = v_total
  WHERE o.id = v_order_id;

  RETURN QUERY SELECT v_order_id, v_order_number, v_total;
END;
$$;

REVOKE ALL ON FUNCTION public.create_cod_order_atomic(UUID, JSONB, JSONB) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.create_cod_order_atomic(UUID, JSONB, JSONB) FROM anon, authenticated;
GRANT EXECUTE ON FUNCTION public.create_cod_order_atomic(UUID, JSONB, JSONB) TO service_role;

-- Customer cancellation is exposed as a narrowly authorized transaction.
-- The row lock plus the terminal cancelled state makes stock restoration idempotent.
CREATE OR REPLACE FUNCTION public.cancel_cod_order(p_order_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_order public.orders%ROWTYPE;
  v_item RECORD;
  v_caller_id UUID := auth.uid();
  v_is_admin BOOLEAN := FALSE;
  v_restored_id UUID;
BEGIN
  IF v_caller_id IS NULL THEN
    RAISE EXCEPTION 'Authentication is required';
  END IF;

  IF p_order_id IS NULL THEN
    RAISE EXCEPTION 'Order ID is required';
  END IF;

  SELECT *
  INTO v_order
  FROM public.orders AS o
  WHERE o.id = p_order_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Order not found';
  END IF;

  v_is_admin := public.is_admin();

  IF v_order.user_id IS DISTINCT FROM v_caller_id AND NOT v_is_admin THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  IF v_order.payment_method IS DISTINCT FROM 'cod' THEN
    RAISE EXCEPTION 'Only Cash on Delivery orders can use this cancellation';
  END IF;

  IF v_order.status = 'cancelled' OR v_order.payment_status = 'cancelled' THEN
    RETURN FALSE;
  END IF;

  IF v_order.payment_status IS DISTINCT FROM 'pending' THEN
    RAISE EXCEPTION 'This order can no longer be cancelled';
  END IF;

  IF (NOT v_is_admin AND v_order.status <> 'pending')
    OR (v_is_admin AND v_order.status NOT IN ('pending', 'processing')) THEN
    RAISE EXCEPTION 'This order can no longer be cancelled';
  END IF;

  FOR v_item IN
    SELECT oi.product_id, oi.variant_id, oi.quantity
    FROM public.order_items AS oi
    WHERE oi.order_id = p_order_id
    ORDER BY COALESCE(oi.variant_id, oi.product_id)
  LOOP
    v_restored_id := NULL;

    IF v_item.variant_id IS NOT NULL THEN
      UPDATE public.product_variants AS pv
      SET stock = COALESCE(pv.stock, 0) + v_item.quantity
      WHERE pv.id = v_item.variant_id
      RETURNING pv.id INTO v_restored_id;
    ELSIF v_item.product_id IS NOT NULL THEN
      UPDATE public.products AS p
      SET stock = p.stock + v_item.quantity
      WHERE p.id = v_item.product_id
      RETURNING p.id INTO v_restored_id;
    END IF;

    IF v_restored_id IS NULL THEN
      RAISE EXCEPTION 'Unable to restore stock for an order item';
    END IF;
  END LOOP;

  UPDATE public.orders AS o
  SET status = 'cancelled',
      payment_status = 'cancelled'
  WHERE o.id = p_order_id;

  RETURN TRUE;
END;
$$;

REVOKE ALL ON FUNCTION public.cancel_cod_order(UUID) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.cancel_cod_order(UUID) FROM anon, service_role;
GRANT EXECUTE ON FUNCTION public.cancel_cod_order(UUID) TO authenticated;

COMMIT;
