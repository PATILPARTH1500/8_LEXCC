-- A single RPC owns the product, variant, and gallery row transaction.
-- SECURITY INVOKER retains the existing admin RLS policies on all three tables.
CREATE POLICY "Admins can view cart items for variant history"
ON public.cart_items FOR SELECT TO authenticated
USING (public.is_admin());

CREATE FUNCTION public.save_admin_product_atomic(
  p_product_id uuid,
  p_product jsonb,
  p_variants jsonb,
  p_images jsonb
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = ''
AS $function$
DECLARE
  v_existing public.products%ROWTYPE;
  v_variant jsonb;
  v_image jsonb;
  v_saved public.product_variants%ROWTYPE;
  v_id uuid;
  v_seen_ids uuid[] := ARRAY[]::uuid[];
  v_seen_images uuid[] := ARRAY[]::uuid[];
  v_size text;
  v_color text;
  v_stock integer;
  v_order integer := 0;
  v_slug text;
  v_category_slug text;
  v_valid_sizes text[];
  v_seen_keys text[] := ARRAY[]::text[];
  v_key text;
BEGIN
  IF (SELECT auth.uid()) IS NULL OR NOT public.is_admin() THEN
    RAISE EXCEPTION 'Admin access is required' USING ERRCODE = '42501';
  END IF;
  IF p_product_id IS NULL OR jsonb_typeof(p_product) <> 'object'
    OR jsonb_typeof(p_variants) <> 'array' OR jsonb_typeof(p_images) <> 'array' THEN
    RAISE EXCEPTION 'Invalid product payload' USING ERRCODE = '22023';
  END IF;
  IF trim(COALESCE(p_product->>'name', '')) = ''
    OR trim(COALESCE(p_product->>'description', '')) = ''
    OR trim(COALESCE(p_product->>'slug', '')) = ''
    OR (p_product->>'price')::numeric <= 0
    OR jsonb_array_length(p_variants) = 0
    OR jsonb_array_length(p_images) = 0
    OR jsonb_array_length(p_images) > 8 THEN
    RAISE EXCEPTION 'Complete the product details, variants, and images' USING ERRCODE = '22023';
  END IF;

  SELECT c.slug INTO v_category_slug FROM public.categories c
  WHERE c.id = (p_product->>'category_id')::uuid;
  IF v_category_slug IS NULL THEN
    RAISE EXCEPTION 'Select a category' USING ERRCODE = '22023';
  END IF;
  v_valid_sizes := CASE
    WHEN lower(v_category_slug) = 'footwear' THEN ARRAY['UK 5','UK 6','UK 7','UK 8','UK 9','UK 10','UK 11','UK 12']
    WHEN lower(v_category_slug) IN ('accessories','collections') THEN ARRAY['OS']
    ELSE ARRAY['XS','S','M','L','XL','XXL'] END;

  SELECT * INTO v_existing FROM public.products WHERE id = p_product_id FOR UPDATE;
  v_slug := trim(p_product->>'slug');
  IF EXISTS (SELECT 1 FROM public.products WHERE slug = v_slug AND id <> p_product_id) THEN
    RAISE EXCEPTION 'A product with this name already exists' USING ERRCODE = '23505', CONSTRAINT = 'products_slug_key';
  END IF;
  IF v_existing.id IS NOT NULL THEN
    UPDATE public.products SET
      name = trim(p_product->>'name'), description = trim(p_product->>'description'),
      price = (p_product->>'price')::numeric,
      category_id = (p_product->>'category_id')::uuid,
      slug = v_slug, image_url = p_images->0->>'image_url',
      is_featured = COALESCE((p_product->>'is_featured')::boolean, false),
      is_new_arrival = COALESCE((p_product->>'is_new_arrival')::boolean, false),
      status = COALESCE(p_product->>'status', 'active')
    WHERE id = p_product_id;
  ELSE
    INSERT INTO public.products
      (id, name, description, price, category_id, slug, image_url, is_featured, is_new_arrival, status)
    VALUES
      (p_product_id, trim(p_product->>'name'), trim(p_product->>'description'),
       (p_product->>'price')::numeric, (p_product->>'category_id')::uuid,
       v_slug, p_images->0->>'image_url',
       COALESCE((p_product->>'is_featured')::boolean, false),
       COALESCE((p_product->>'is_new_arrival')::boolean, false),
       COALESCE(p_product->>'status', 'active'));
  END IF;

  -- Lock all rows before matching archived zero-stock variants or editing identities.
  PERFORM 1 FROM public.product_variants WHERE product_id = p_product_id FOR UPDATE;
  FOR v_variant IN SELECT value FROM jsonb_array_elements(p_variants) LOOP
    v_size := trim(COALESCE(v_variant->>'size', ''));
    v_color := trim(COALESCE(v_variant->>'color', ''));
    v_stock := (v_variant->>'stock')::integer;
    v_key := lower(v_size) || chr(31) || lower(v_color);
    IF NOT v_size = ANY(v_valid_sizes) OR v_color = '' OR v_stock IS NULL OR v_stock < 0
       OR v_key = ANY(v_seen_keys) THEN
      RAISE EXCEPTION 'Invalid or duplicate product variant' USING ERRCODE = '22023';
    END IF;
    v_seen_keys := array_append(v_seen_keys, v_key);
    v_id := NULLIF(v_variant->>'id', '')::uuid;
    v_saved := NULL;
    IF v_id IS NOT NULL THEN
      SELECT * INTO v_saved FROM public.product_variants
      WHERE id = v_id AND product_id = p_product_id;
      IF NOT FOUND THEN RAISE EXCEPTION 'Variant does not belong to this product' USING ERRCODE = '22023'; END IF;
    ELSE
      SELECT * INTO v_saved FROM public.product_variants
      WHERE product_id = p_product_id AND stock = 0
        AND lower(trim(size)) = lower(v_size)
        AND lower(trim(color)) = lower(v_color)
        AND NOT (id = ANY(v_seen_ids))
      ORDER BY id LIMIT 1;
    END IF;
    IF v_saved.id IS NOT NULL THEN
      IF (v_saved.size IS DISTINCT FROM v_size OR v_saved.color IS DISTINCT FROM v_color)
        AND (EXISTS (SELECT 1 FROM public.order_items WHERE variant_id = v_saved.id)
          OR EXISTS (SELECT 1 FROM public.cart_items WHERE variant_id = v_saved.id)) THEN
        RAISE EXCEPTION 'This variant has order or cart history. Remove it and add a new size instead.' USING ERRCODE = '22023';
      END IF;
      UPDATE public.product_variants SET size = v_size, color = v_color, stock = v_stock
      WHERE id = v_saved.id;
      v_seen_ids := array_append(v_seen_ids, v_saved.id);
    ELSE
      v_id := gen_random_uuid();
      INSERT INTO public.product_variants (id, product_id, size, color, stock, sku)
      VALUES (v_id, p_product_id, v_size, v_color, v_stock,
              'LEX-' || upper(replace(v_id::text, '-', '')));
      v_seen_ids := array_append(v_seen_ids, v_id);
    END IF;
  END LOOP;
  UPDATE public.product_variants SET stock = 0
  WHERE product_id = p_product_id AND NOT (id = ANY(v_seen_ids)) AND stock <> 0;

  FOR v_image IN SELECT value FROM jsonb_array_elements(p_images) LOOP
    IF trim(COALESCE(v_image->>'image_url', '')) = '' THEN
      RAISE EXCEPTION 'Product image URL is required' USING ERRCODE = '22023';
    END IF;
    v_id := NULLIF(v_image->>'id', '')::uuid;
    IF v_id IS NOT NULL THEN
      UPDATE public.product_images SET display_order = v_order
      WHERE id = v_id AND product_id = p_product_id;
      IF NOT FOUND THEN RAISE EXCEPTION 'Image does not belong to this product' USING ERRCODE = '22023'; END IF;
    ELSE
      INSERT INTO public.product_images(product_id, image_url, display_order)
      VALUES (p_product_id, v_image->>'image_url', v_order) RETURNING id INTO v_id;
    END IF;
    IF v_id = ANY(v_seen_images) THEN RAISE EXCEPTION 'Duplicate product image' USING ERRCODE = '22023'; END IF;
    v_seen_images := array_append(v_seen_images, v_id);
    v_order := v_order + 1;
  END LOOP;
  DELETE FROM public.product_images
  WHERE product_id = p_product_id AND NOT (id = ANY(v_seen_images));
  RETURN p_product_id;
END;
$function$;

REVOKE ALL ON FUNCTION public.save_admin_product_atomic(uuid, jsonb, jsonb, jsonb) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.save_admin_product_atomic(uuid, jsonb, jsonb, jsonb) TO authenticated;
