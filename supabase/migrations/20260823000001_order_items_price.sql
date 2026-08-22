BEGIN;

DO $$
BEGIN
    BEGIN
        ALTER TABLE public.order_items ALTER COLUMN price DROP NOT NULL;
    EXCEPTION WHEN undefined_column THEN END;
END $$;

COMMIT;
