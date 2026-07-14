-- Phase 2: Product Catalog Schema

-- Enable UUID extension if not already enabled (should be from phase 1)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ==========================================
-- CATEGORIES
-- ==========================================
CREATE TABLE IF NOT EXISTS public.categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT UNIQUE NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  image_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Categories are viewable by everyone." 
  ON public.categories FOR SELECT 
  USING ( true );

CREATE POLICY "Admins can insert categories." 
  ON public.categories FOR INSERT 
  WITH CHECK ( auth.uid() IN (SELECT id FROM profiles WHERE role IN ('admin', 'super_admin')) );

CREATE POLICY "Admins can update categories." 
  ON public.categories FOR UPDATE 
  USING ( auth.uid() IN (SELECT id FROM profiles WHERE role IN ('admin', 'super_admin')) );

CREATE POLICY "Admins can delete categories." 
  ON public.categories FOR DELETE 
  USING ( auth.uid() IN (SELECT id FROM profiles WHERE role IN ('admin', 'super_admin')) );


-- ==========================================
-- PRODUCTS
-- ==========================================
CREATE TABLE IF NOT EXISTS public.products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  price DECIMAL(10,2) NOT NULL,
  is_featured BOOLEAN DEFAULT FALSE,
  is_new_arrival BOOLEAN DEFAULT FALSE,
  status TEXT DEFAULT 'active', -- 'active', 'draft', 'archived'
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Active products are viewable by everyone." 
  ON public.products FOR SELECT 
  USING ( status = 'active' );

CREATE POLICY "Admins can view all products." 
  ON public.products FOR SELECT 
  USING ( auth.uid() IN (SELECT id FROM profiles WHERE role IN ('admin', 'super_admin')) );

CREATE POLICY "Admins can insert products." 
  ON public.products FOR INSERT 
  WITH CHECK ( auth.uid() IN (SELECT id FROM profiles WHERE role IN ('admin', 'super_admin')) );

CREATE POLICY "Admins can update products." 
  ON public.products FOR UPDATE 
  USING ( auth.uid() IN (SELECT id FROM profiles WHERE role IN ('admin', 'super_admin')) );

CREATE POLICY "Admins can delete products." 
  ON public.products FOR DELETE 
  USING ( auth.uid() IN (SELECT id FROM profiles WHERE role IN ('admin', 'super_admin')) );


-- ==========================================
-- PRODUCT IMAGES
-- ==========================================
CREATE TABLE IF NOT EXISTS public.product_images (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id UUID REFERENCES public.products(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  display_order INTEGER DEFAULT 0
);

ALTER TABLE public.product_images ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Product images are viewable by everyone." 
  ON public.product_images FOR SELECT 
  USING ( true );

CREATE POLICY "Admins can manage product images." 
  ON public.product_images FOR ALL
  USING ( auth.uid() IN (SELECT id FROM profiles WHERE role IN ('admin', 'super_admin')) );


-- ==========================================
-- PRODUCT VARIANTS
-- ==========================================
CREATE TABLE IF NOT EXISTS public.product_variants (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id UUID REFERENCES public.products(id) ON DELETE CASCADE,
  size TEXT,
  color TEXT,
  sku TEXT UNIQUE,
  stock_quantity INTEGER DEFAULT 0
);

ALTER TABLE public.product_variants ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Product variants are viewable by everyone." 
  ON public.product_variants FOR SELECT 
  USING ( true );

CREATE POLICY "Admins can manage product variants." 
  ON public.product_variants FOR ALL
  USING ( auth.uid() IN (SELECT id FROM profiles WHERE role IN ('admin', 'super_admin')) );
