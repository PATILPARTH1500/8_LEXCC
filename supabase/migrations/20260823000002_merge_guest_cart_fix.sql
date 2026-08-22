BEGIN;

CREATE OR REPLACE FUNCTION public.merge_guest_cart(
  p_merge_id UUID,
  p_items JSONB
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, ''
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
    IF COALESCE(v_item->>'product_id', '') !~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
       OR COALESCE(v_item->>'quantity', '') !~ '^[1-9][0-9]?$' THEN
      RAISE EXCEPTION 'The cart contains an invalid item';
    END IF;

    v_product_id := (v_item->>'product_id')::UUID;
    v_quantity := (v_item->>'quantity')::INTEGER;
    v_size := left(COALESCE(NULLIF(trim(v_item->>'size'), ''), 'default'), 50);
    v_color := left(COALESCE(NULLIF(trim(v_item->>'color'), ''), 'default'), 50);
    v_variant_id := NULL;

    IF NULLIF(trim(v_item->>'variant_id'), '') IS NOT NULL THEN
      IF (v_item->>'variant_id') !~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' THEN
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

COMMIT;
