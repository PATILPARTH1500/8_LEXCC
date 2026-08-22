-- Migration: Add temporary stock to test footwear QA
DO $$
DECLARE
    footwear_cat_id UUID;
    m_id UUID;
BEGIN
    SELECT id INTO footwear_cat_id FROM categories WHERE slug = 'footwear' LIMIT 1;
    SELECT id INTO m_id FROM products WHERE name = 'MONOLITH SNEAKERS' LIMIT 1;
    
    IF m_id IS NOT NULL THEN
        UPDATE product_variants
        SET stock = 5
        WHERE product_id = m_id AND size = 'UK 8';
    END IF;
END $$;
