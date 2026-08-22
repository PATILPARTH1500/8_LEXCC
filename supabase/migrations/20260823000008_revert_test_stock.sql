-- Migration: Revert test stock
DO $$
DECLARE
    m_id UUID;
BEGIN
    SELECT id INTO m_id FROM products WHERE name = 'MONOLITH SNEAKERS' LIMIT 1;
    
    IF m_id IS NOT NULL THEN
        UPDATE product_variants
        SET stock = 0
        WHERE product_id = m_id AND size = 'UK 8';
    END IF;
END $$;
