-- Migration: Zero out fabricated inventory
-- Sets stock to 0 for generated UK footwear variants that still have the default demo stock of 10.
-- Any variants with stock != 10 are preserved, assuming they were manually adjusted by an admin.

DO $$
DECLARE
    footwear_cat_id UUID;
BEGIN
    SELECT id INTO footwear_cat_id FROM categories WHERE slug = 'footwear' LIMIT 1;
    
    IF footwear_cat_id IS NOT NULL THEN
        UPDATE product_variants
        SET stock = 0
        WHERE stock = 10
        AND size LIKE 'UK %'
        AND product_id IN (SELECT id FROM products WHERE category_id = footwear_cat_id);
        
        RAISE NOTICE 'Fabricated demo footwear stock has been zeroed.';
    END IF;
END $$;
