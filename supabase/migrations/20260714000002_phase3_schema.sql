-- Phase 3: Wishlists & Orders Schema

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ==========================================
-- WISHLISTS
-- ==========================================
CREATE TABLE IF NOT EXISTS public.wishlists (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id) -- one wishlist per user for now
);

ALTER TABLE public.wishlists ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own wishlist." 
  ON public.wishlists FOR ALL
  USING ( auth.uid() = user_id );

-- ==========================================
-- WISHLIST ITEMS
-- ==========================================
CREATE TABLE IF NOT EXISTS public.wishlist_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  wishlist_id UUID REFERENCES public.wishlists(id) ON DELETE CASCADE,
  product_id UUID REFERENCES public.products(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(wishlist_id, product_id)
);

ALTER TABLE public.wishlist_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own wishlist items." 
  ON public.wishlist_items FOR ALL
  USING ( auth.uid() IN (SELECT user_id FROM public.wishlists WHERE id = wishlist_id) );

-- ==========================================
-- ORDERS
-- ==========================================
CREATE TABLE IF NOT EXISTS public.orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  order_number TEXT UNIQUE NOT NULL,
  status TEXT DEFAULT 'pending', -- pending, processing, shipped, delivered, cancelled
  total_amount DECIMAL(10,2) NOT NULL,
  shipping_address JSONB,
  billing_address JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own orders." 
  ON public.orders FOR SELECT
  USING ( auth.uid() = user_id );

CREATE POLICY "Users can insert their own orders." 
  ON public.orders FOR INSERT
  WITH CHECK ( auth.uid() = user_id );

-- ==========================================
-- ORDER ITEMS
-- ==========================================
CREATE TABLE IF NOT EXISTS public.order_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE,
  product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
  variant_id UUID REFERENCES public.product_variants(id) ON DELETE SET NULL,
  quantity INTEGER NOT NULL,
  price_at_time DECIMAL(10,2) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own order items." 
  ON public.order_items FOR SELECT
  USING ( auth.uid() IN (SELECT user_id FROM public.orders WHERE id = order_id) );

CREATE POLICY "Users can insert their own order items." 
  ON public.order_items FOR INSERT
  WITH CHECK ( auth.uid() IN (SELECT user_id FROM public.orders WHERE id = order_id) );
