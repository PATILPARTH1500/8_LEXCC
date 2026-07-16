-- Add is_admin column to profiles table
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT FALSE;

-- Optional: Create a secure view for admins to see all profiles
CREATE OR REPLACE VIEW public.admin_profiles_view AS
SELECT * FROM public.profiles;

-- Ensure RLS allows admins to see other users (if needed in the future)
-- For now, we rely on the application logic for routing, but we can add policies later.
