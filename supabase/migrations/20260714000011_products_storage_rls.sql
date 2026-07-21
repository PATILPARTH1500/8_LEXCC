-- Migration: Add RLS storage policies for the 'products' bucket
-- The 'products' bucket was created in migration 000000 but had no storage policies.
-- This migration adds complete public-read / admin-write RLS coverage.
-- Depends on: public.is_admin() function (defined in migration 000008)

-- ============================================================
-- PRODUCTS STORAGE BUCKET — RLS POLICIES
-- ============================================================

-- 1. Public read access for product images
--    Anyone (including unauthenticated visitors) can view product images.
DROP POLICY IF EXISTS "Product images are publicly readable." ON storage.objects;
CREATE POLICY "Product images are publicly readable."
  ON storage.objects FOR SELECT
  USING ( bucket_id = 'products' );

-- 2. Admin-only upload (INSERT)
--    Only users with is_admin = true in their profile may upload product images.
DROP POLICY IF EXISTS "Admins can upload product images." ON storage.objects;
CREATE POLICY "Admins can upload product images."
  ON storage.objects FOR INSERT
  WITH CHECK ( bucket_id = 'products' AND public.is_admin() );

-- 3. Admin-only update (UPDATE)
--    Only admins may overwrite/update existing product images.
DROP POLICY IF EXISTS "Admins can update product images." ON storage.objects;
CREATE POLICY "Admins can update product images."
  ON storage.objects FOR UPDATE
  USING ( bucket_id = 'products' AND public.is_admin() );

-- 4. Admin-only delete (DELETE)
--    Only admins may delete product images from storage.
DROP POLICY IF EXISTS "Admins can delete product images." ON storage.objects;
CREATE POLICY "Admins can delete product images."
  ON storage.objects FOR DELETE
  USING ( bucket_id = 'products' AND public.is_admin() );
