-- Migration: Normalize Footwear Sizes
DO $$
DECLARE
    footwear_cat_id UUID;
    v_product RECORD;
    v_invalid_variant RECORD;
    v_color TEXT;
    v_size TEXT;
    v_sku TEXT;
    v_slug TEXT;
    uk_sizes TEXT[] := ARRAY['UK 5', 'UK 6', 'UK 7', 'UK 8', 'UK 9', 'UK 10', 'UK 11', 'UK 12'];
    invalid_sizes TEXT[] := ARRAY['XS', 'S', 'M', 'L', 'XL', 'XXL', 'OS'];
    found_colors TEXT[];
BEGIN
    -- 1. Find footwear category
    SELECT id INTO footwear_cat_id FROM categories WHERE slug = 'footwear' LIMIT 1;
    
    IF footwear_cat_id IS NULL THEN
        RAISE NOTICE 'No footwear category found. Skipping migration.';
        RETURN;
    END IF;

    -- 2. Iterate through footwear products
    FOR v_product IN SELECT id, name FROM products WHERE category_id = footwear_cat_id
    LOOP
        -- Find invalid variants for this product
        FOR v_invalid_variant IN SELECT id, color FROM product_variants WHERE product_id = v_product.id AND size = ANY(invalid_sizes)
        LOOP
            -- Archive invalid variant safely
            UPDATE product_variants SET stock = 0 WHERE id = v_invalid_variant.id;
        END LOOP;
        
        -- Get unique colors that this product had
        SELECT array_agg(DISTINCT color) INTO found_colors 
        FROM product_variants 
        WHERE product_id = v_product.id AND color IS NOT NULL;
        
        IF found_colors IS NULL OR array_length(found_colors, 1) = 0 THEN
            found_colors := ARRAY['Black'];
        END IF;
        
        v_slug := lower(regexp_replace(v_product.name, '\s+', '-', 'g'));
        
        -- Insert new valid UK size variants
        FOREACH v_color IN ARRAY found_colors
        LOOP
            FOREACH v_size IN ARRAY uk_sizes
            LOOP
                v_sku := upper(regexp_replace(v_slug || '-' || v_size || '-' || v_color, '[^a-zA-Z0-9-]', '', 'g'));
                
                -- Check if it already exists to avoid duplicates
                IF NOT EXISTS (SELECT 1 FROM product_variants WHERE product_id = v_product.id AND size = v_size AND color = v_color) THEN
                    INSERT INTO product_variants (product_id, size, color, stock, sku)
                    VALUES (v_product.id, v_size, v_color, 10, v_sku);
                END IF;
            END LOOP;
        END LOOP;
        
        RAISE NOTICE 'Normalized footwear product: %', v_product.name;
    END LOOP;
END $$;
