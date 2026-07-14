-- Phase 5: Cart & Cart Items Schema

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ==========================================
-- CARTS
-- ==========================================
CREATE TABLE IF NOT EXISTS public.carts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id) -- one active cart per user
);

ALTER TABLE public.carts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own cart." 
  ON public.carts FOR ALL
  USING ( auth.uid() = user_id );

-- ==========================================
-- CART ITEMS
-- ==========================================
CREATE TABLE IF NOT EXISTS public.cart_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  cart_id UUID REFERENCES public.carts(id) ON DELETE CASCADE,
  product_id UUID REFERENCES public.products(id) ON DELETE CASCADE,
  size TEXT,
  color TEXT,
  quantity INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(cart_id, product_id, size, color) -- Ensure unique variant per cart
);

ALTER TABLE public.cart_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own cart items." 
  ON public.cart_items FOR ALL
  USING ( auth.uid() IN (SELECT user_id FROM public.carts WHERE id = cart_id) );
