-- Phase 8 & 9: Admin RLS Policies and Schema Upgrades

-- 1. Standardize Admin Checking Function
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND is_admin = TRUE
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Add RLS Policies for Profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
CREATE POLICY "Admins can view all profiles" ON public.profiles
FOR SELECT USING (public.is_admin());

DROP POLICY IF EXISTS "Admins can update all profiles" ON public.profiles;
CREATE POLICY "Admins can update all profiles" ON public.profiles
FOR UPDATE USING (public.is_admin());

-- 3. Add RLS Policies for Orders
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Admins can view all orders" ON public.orders;
CREATE POLICY "Admins can view all orders" ON public.orders
FOR SELECT USING (public.is_admin());

DROP POLICY IF EXISTS "Admins can update all orders" ON public.orders;
CREATE POLICY "Admins can update all orders" ON public.orders
FOR UPDATE USING (public.is_admin());

-- 4. Add RLS Policies for Order Items
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Admins can view all order items" ON public.order_items;
CREATE POLICY "Admins can view all order items" ON public.order_items
FOR SELECT USING (public.is_admin());

-- 5. Add RLS Policies for Addresses & Wishlists
ALTER TABLE public.addresses ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Admins can view all addresses" ON public.addresses;
CREATE POLICY "Admins can view all addresses" ON public.addresses
FOR SELECT USING (public.is_admin());

/*
ALTER TABLE public.wishlists ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Admins can view all wishlists" ON public.wishlists;
CREATE POLICY "Admins can view all wishlists" ON public.wishlists
FOR SELECT USING (public.is_admin());
*/

-- 6. Add Schema Improvements to Orders
ALTER TABLE public.orders
ADD COLUMN IF NOT EXISTS tracking_number TEXT,
ADD COLUMN IF NOT EXISTS carrier TEXT;

-- 7. Database Triggers for Inventory
-- Function to decrement stock when an order is placed
CREATE OR REPLACE FUNCTION public.decrement_stock_on_order()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.product_variants
  SET stock = stock - NEW.quantity
  WHERE id = NEW.variant_id AND stock >= NEW.quantity;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS tr_decrement_stock ON public.order_items;
CREATE TRIGGER tr_decrement_stock
AFTER INSERT ON public.order_items
FOR EACH ROW
EXECUTE FUNCTION public.decrement_stock_on_order();
