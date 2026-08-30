-- Fix: Standardize all admin mutations to use public.is_admin() to ensure shared catalog ownership.

BEGIN;

-- 1. PRODUCTS
DROP POLICY IF EXISTS "Admins can insert products." ON public.products;
DROP POLICY IF EXISTS "Admins can update products." ON public.products;
DROP POLICY IF EXISTS "Admins can delete products." ON public.products;
DROP POLICY IF EXISTS "Admins can insert products" ON public.products;
DROP POLICY IF EXISTS "Admins can update products" ON public.products;
DROP POLICY IF EXISTS "Admins can delete products" ON public.products;

CREATE POLICY "Admins can insert products" ON public.products FOR INSERT WITH CHECK (public.is_admin());
CREATE POLICY "Admins can update products" ON public.products FOR UPDATE USING (public.is_admin());
CREATE POLICY "Admins can delete products" ON public.products FOR DELETE USING (public.is_admin());

-- 2. CATEGORIES
DROP POLICY IF EXISTS "Admins can insert categories." ON public.categories;
DROP POLICY IF EXISTS "Admins can update categories." ON public.categories;
DROP POLICY IF EXISTS "Admins can delete categories." ON public.categories;
DROP POLICY IF EXISTS "Admins can insert categories" ON public.categories;
DROP POLICY IF EXISTS "Admins can update categories" ON public.categories;
DROP POLICY IF EXISTS "Admins can delete categories" ON public.categories;

CREATE POLICY "Admins can insert categories" ON public.categories FOR INSERT WITH CHECK (public.is_admin());
CREATE POLICY "Admins can update categories" ON public.categories FOR UPDATE USING (public.is_admin());
CREATE POLICY "Admins can delete categories" ON public.categories FOR DELETE USING (public.is_admin());

-- 3. PRODUCT IMAGES
DROP POLICY IF EXISTS "Admins can manage product images." ON public.product_images;
DROP POLICY IF EXISTS "Admins can manage product images" ON public.product_images;

CREATE POLICY "Admins can insert product images" ON public.product_images FOR INSERT WITH CHECK (public.is_admin());
CREATE POLICY "Admins can update product images" ON public.product_images FOR UPDATE USING (public.is_admin());
CREATE POLICY "Admins can delete product images" ON public.product_images FOR DELETE USING (public.is_admin());

-- 4. PRODUCT VARIANTS
DROP POLICY IF EXISTS "Admins can manage product variants." ON public.product_variants;
DROP POLICY IF EXISTS "Admins can manage product variants" ON public.product_variants;
DROP POLICY IF EXISTS "Admins can insert product variants" ON public.product_variants;
DROP POLICY IF EXISTS "Admins can update product variants" ON public.product_variants;
DROP POLICY IF EXISTS "Admins can delete product variants" ON public.product_variants;

CREATE POLICY "Admins can insert product variants" ON public.product_variants FOR INSERT WITH CHECK (public.is_admin());
CREATE POLICY "Admins can update product variants" ON public.product_variants FOR UPDATE USING (public.is_admin());
CREATE POLICY "Admins can delete product variants" ON public.product_variants FOR DELETE USING (public.is_admin());

-- 5. ORDERS
DROP POLICY IF EXISTS "Admins can delete orders" ON public.orders;
CREATE POLICY "Admins can delete orders" ON public.orders FOR DELETE USING (public.is_admin());

COMMIT;
