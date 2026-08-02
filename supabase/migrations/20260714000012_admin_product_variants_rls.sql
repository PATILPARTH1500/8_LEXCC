-- Migration: Add Admin RLS Policies for product_variants

-- 1. Admin-only INSERT
DROP POLICY IF EXISTS "Admins can insert product variants" ON public.product_variants;
CREATE POLICY "Admins can insert product variants"
  ON public.product_variants FOR INSERT
  WITH CHECK ( public.is_admin() );

-- 2. Admin-only UPDATE
DROP POLICY IF EXISTS "Admins can update product variants" ON public.product_variants;
CREATE POLICY "Admins can update product variants"
  ON public.product_variants FOR UPDATE
  USING ( public.is_admin() );

-- 3. Admin-only DELETE
DROP POLICY IF EXISTS "Admins can delete product variants" ON public.product_variants;
CREATE POLICY "Admins can delete product variants"
  ON public.product_variants FOR DELETE
  USING ( public.is_admin() );
