-- Temporary RPC for data audit
CREATE OR REPLACE FUNCTION audit_addresses()
RETURNS JSONB AS $$
DECLARE
    total_addresses INT;
    country_counts JSONB;
    malformed_pins INT;
    missing_phones INT;
    legacy_us INT;
    duplicate_defaults INT;
    result JSONB;
BEGIN
    SELECT count(*) INTO total_addresses FROM addresses;
    
    SELECT jsonb_object_agg(country, count) INTO country_counts
    FROM (SELECT country, count(*) as count FROM addresses GROUP BY country) sub;
    
    SELECT count(*) INTO malformed_pins FROM addresses 
    WHERE postal_code !~ '^\d{6}$';
    
    SELECT count(*) INTO missing_phones FROM addresses 
    WHERE phone IS NULL OR length(phone) < 7;
    
    SELECT count(*) INTO legacy_us FROM addresses 
    WHERE country ILIKE '%United States%' OR country ILIKE '%US%';
    
    SELECT count(*) INTO duplicate_defaults FROM (
        SELECT user_id FROM addresses WHERE is_default = true GROUP BY user_id HAVING count(*) > 1
    ) sub;
    
    result := jsonb_build_object(
        'total_addresses', total_addresses,
        'country_counts', country_counts,
        'malformed_pins', malformed_pins,
        'missing_phones', missing_phones,
        'legacy_us', legacy_us,
        'duplicate_defaults', duplicate_defaults
    );
    
    RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
