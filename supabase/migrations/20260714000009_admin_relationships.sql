-- Phase 8: Schema Relationships & Cache Reload
-- This file ensures all foreign keys exist and reloads the Supabase PostgREST cache

-- 1. Safely ensure the relationship between orders and profiles exists
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'orders_user_id_fkey'
  ) THEN
    ALTER TABLE public.orders 
    ADD CONSTRAINT orders_user_id_fkey 
    FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;
  END IF;
END $$;

-- 2. Force Supabase API to reload its cache so the frontend can query joins
NOTIFY pgrst, 'reload schema';
