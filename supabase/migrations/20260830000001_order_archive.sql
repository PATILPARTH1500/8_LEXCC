BEGIN;

-- Add is_archived to orders
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS is_archived BOOLEAN DEFAULT FALSE;

COMMIT;
