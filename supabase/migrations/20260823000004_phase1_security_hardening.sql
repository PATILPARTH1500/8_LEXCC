BEGIN;

-- TASK 1: INVENTORY RPC SECURITY
REVOKE ALL ON FUNCTION public.deduct_variant_stock(UUID, INTEGER) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.deduct_variant_stock(UUID, INTEGER) FROM anon;
REVOKE ALL ON FUNCTION public.deduct_variant_stock(UUID, INTEGER) FROM authenticated;
GRANT EXECUTE ON FUNCTION public.deduct_variant_stock(UUID, INTEGER) TO service_role;
ALTER FUNCTION public.deduct_variant_stock(UUID, INTEGER) SET search_path = public, '';

REVOKE ALL ON FUNCTION public.restore_variant_stock(UUID, INTEGER) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.restore_variant_stock(UUID, INTEGER) FROM anon;
REVOKE ALL ON FUNCTION public.restore_variant_stock(UUID, INTEGER) FROM authenticated;
GRANT EXECUTE ON FUNCTION public.restore_variant_stock(UUID, INTEGER) TO service_role;
ALTER FUNCTION public.restore_variant_stock(UUID, INTEGER) SET search_path = public, '';

-- TASK 2: STALE ORDER CLEANUP SECURITY
REVOKE ALL ON FUNCTION public.cancel_stale_pending_orders() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.cancel_stale_pending_orders() FROM anon;
REVOKE ALL ON FUNCTION public.cancel_stale_pending_orders() FROM authenticated;
GRANT EXECUTE ON FUNCTION public.cancel_stale_pending_orders() TO service_role;
ALTER FUNCTION public.cancel_stale_pending_orders() SET search_path = public, '';

-- TASK 3: CANCEL RAZORPAY ORDER SECURITY
REVOKE ALL ON FUNCTION public.cancel_razorpay_order(UUID, TEXT) FROM PUBLIC;
-- Ensure anon and authenticated can execute this
GRANT EXECUTE ON FUNCTION public.cancel_razorpay_order(UUID, TEXT) TO authenticated, anon;
ALTER FUNCTION public.cancel_razorpay_order(UUID, TEXT) SET search_path = public, '';

-- TASK 4: PROFILE PRIVILEGE ESCALATION
CREATE OR REPLACE FUNCTION public.protect_profile_privileges()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, ''
AS $$
BEGIN
  -- Prevent changing profile ownership
  IF NEW.id IS DISTINCT FROM OLD.id THEN
    RAISE EXCEPTION 'Profile ownership cannot be changed';
  END IF;

  -- Prevent anon/authenticated users from changing role or is_admin
  IF NEW.role IS DISTINCT FROM OLD.role
     OR NEW.is_admin IS DISTINCT FROM OLD.is_admin THEN
    IF (SELECT auth.uid()) IS NOT NULL AND NOT public.is_admin() THEN
      RAISE EXCEPTION 'Only an administrator can change profile privileges';
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS tr_protect_profile_privileges ON public.profiles;
CREATE TRIGGER tr_protect_profile_privileges
BEFORE UPDATE ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.protect_profile_privileges();

-- TASK 5: PRODUCT VISIBILITY RLS
DROP POLICY IF EXISTS "Products are viewable by everyone" ON public.products;
DROP POLICY IF EXISTS "Products are viewable by everyone." ON public.products;
DROP POLICY IF EXISTS "Active products are viewable by everyone" ON public.products;
DROP POLICY IF EXISTS "Active products are viewable by everyone." ON public.products;

CREATE POLICY "Active products are viewable by everyone" 
  ON public.products FOR SELECT 
  USING ( status = 'active' );

-- Admins should already have their policy from previous migrations, but explicitly enforce it:
DROP POLICY IF EXISTS "Admins can view all products" ON public.products;
DROP POLICY IF EXISTS "Admins can view all products." ON public.products;
CREATE POLICY "Admins can view all products" 
  ON public.products FOR SELECT 
  USING ( auth.uid() IN (SELECT id FROM profiles WHERE role IN ('admin', 'super_admin') OR is_admin IS TRUE) );

-- TASK 6: WISHLIST SCHEMA CLEANUP
DROP TABLE IF EXISTS public.wishlist CASCADE;

-- TASK 9: FUNCTION SEARCH_PATH HARDENING
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'handle_new_user') THEN
    EXECUTE 'ALTER FUNCTION public.handle_new_user() SET search_path = public, '''';';
  END IF;
  
  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'log_admin_activity') THEN
    EXECUTE 'ALTER FUNCTION public.log_admin_activity() SET search_path = public, '''';';
  END IF;

  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'is_admin') THEN
    EXECUTE 'ALTER FUNCTION public.is_admin() SET search_path = public, '''';';
  END IF;
  
  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'subscribe_to_newsletter') THEN
    EXECUTE 'ALTER FUNCTION public.subscribe_to_newsletter(TEXT, TEXT) SET search_path = public, '''';';
  END IF;

  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'merge_guest_cart') THEN
    EXECUTE 'ALTER FUNCTION public.merge_guest_cart(UUID, JSONB) SET search_path = public, '''';';
  END IF;

  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'claim_razorpay_webhook_event') THEN
    EXECUTE 'ALTER FUNCTION public.claim_razorpay_webhook_event(TEXT, TEXT) SET search_path = public, '''';';
  END IF;

  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'finalize_razorpay_payment') THEN
    EXECUTE 'ALTER FUNCTION public.finalize_razorpay_payment(UUID, TEXT, TEXT) SET search_path = public, '''';';
  END IF;

  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'finalize_razorpay_refund') THEN
    EXECUTE 'ALTER FUNCTION public.finalize_razorpay_refund(UUID, TEXT) SET search_path = public, '''';';
  END IF;
END $$;

COMMIT;
