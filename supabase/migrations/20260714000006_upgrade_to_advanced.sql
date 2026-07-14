-- Migration: Upgrade simple products table to advanced ecommerce schema

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Create Categories table
CREATE TABLE IF NOT EXISTS public.categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT UNIQUE NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  image_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Alter Products table
ALTER TABLE public.products 
ADD COLUMN IF NOT EXISTS category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS is_featured BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS is_new_arrival BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active',
ADD COLUMN IF NOT EXISTS slug TEXT;

-- 3. Migrate existing data within Products
DO $$
BEGIN
  -- Migrate 'featured' to 'is_featured'
  IF EXISTS(SELECT * FROM information_schema.columns WHERE table_name='products' and column_name='featured') THEN
      EXECUTE 'UPDATE public.products SET is_featured = featured WHERE is_featured IS FALSE;';
  END IF;
  
  -- Generate slugs
  UPDATE public.products SET slug = LOWER(REPLACE(name, ' ', '-')) WHERE slug IS NULL;
  
  -- Try to create categories from existing 'category' TEXT column
  IF EXISTS(SELECT * FROM information_schema.columns WHERE table_name='products' and column_name='category') THEN
      EXECUTE 'INSERT INTO public.categories (name, slug) 
               SELECT DISTINCT category, LOWER(REPLACE(category, '' '', ''-'')) 
               FROM public.products WHERE category IS NOT NULL 
               ON CONFLICT DO NOTHING;';
               
      EXECUTE 'UPDATE public.products p SET category_id = c.id 
               FROM public.categories c 
               WHERE p.category = c.name;';
  END IF;
END $$;

-- Enforce unique constraint on slug now that data is populated
ALTER TABLE public.products ADD CONSTRAINT products_slug_key UNIQUE (slug);

-- 4. Create Product Images table
CREATE TABLE IF NOT EXISTS public.product_images (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id UUID REFERENCES public.products(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  display_order INTEGER DEFAULT 0
);

-- Migrate existing 'image_url' from products
DO $$
BEGIN
  IF EXISTS(SELECT * FROM information_schema.columns WHERE table_name='products' and column_name='image_url') THEN
      EXECUTE 'INSERT INTO public.product_images (product_id, image_url, display_order) 
               SELECT id, image_url, 0 FROM public.products WHERE image_url IS NOT NULL;';
  END IF;
END $$;

-- 5. Create Product Variants table
CREATE TABLE IF NOT EXISTS public.product_variants (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id UUID REFERENCES public.products(id) ON DELETE CASCADE,
  size TEXT,
  color TEXT,
  sku TEXT UNIQUE,
  stock INTEGER DEFAULT 0
);

-- Migrate existing 'stock' from products to a default variant
DO $$
BEGIN
  IF EXISTS(SELECT * FROM information_schema.columns WHERE table_name='products' and column_name='stock') THEN
      EXECUTE 'INSERT INTO public.product_variants (product_id, size, color, sku, stock) 
               SELECT id, ''OS'', ''Default'', id::text || ''-OS'', stock FROM public.products WHERE stock IS NOT NULL
               ON CONFLICT DO NOTHING;';
  END IF;
END $$;

-- 6. RLS Policies
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Categories are viewable by everyone" ON public.categories;
CREATE POLICY "Categories are viewable by everyone" ON public.categories FOR SELECT USING (true);

ALTER TABLE public.product_images ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Images are viewable by everyone" ON public.product_images;
CREATE POLICY "Images are viewable by everyone" ON public.product_images FOR SELECT USING (true);

ALTER TABLE public.product_variants ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Variants are viewable by everyone" ON public.product_variants;
CREATE POLICY "Variants are viewable by everyone" ON public.product_variants FOR SELECT USING (true);

-- Ensure active products are viewable
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Active products are viewable by everyone" ON public.products;
CREATE POLICY "Active products are viewable by everyone" ON public.products FOR SELECT USING (status = 'active');
