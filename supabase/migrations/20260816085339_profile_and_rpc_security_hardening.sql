-- REQUIRES LIVE SUPABASE VERIFICATION
-- Harden profile access and inventory RPC privileges without rewriting migration history.

BEGIN;

-- Keep the admin predicate narrowly scoped, deterministic, and safe from search_path hijacking.
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE id = (SELECT auth.uid())
      AND is_admin IS TRUE
  );
$$;

REVOKE ALL ON FUNCTION public.is_admin() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.is_admin() FROM anon;
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated, service_role;

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Remove the historical policy that exposed every customer profile.
DROP POLICY IF EXISTS "Public profiles are viewable by everyone." ON public.profiles;

DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
CREATE POLICY "Users can view their own profile"
  ON public.profiles
  FOR SELECT
  TO authenticated
  USING ((SELECT auth.uid()) = id);

DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
CREATE POLICY "Admins can view all profiles"
  ON public.profiles
  FOR SELECT
  TO authenticated
  USING (public.is_admin());

DROP POLICY IF EXISTS "Users can update own profile." ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
CREATE POLICY "Users can update their own profile"
  ON public.profiles
  FOR UPDATE
  TO authenticated
  USING ((SELECT auth.uid()) = id)
  WITH CHECK ((SELECT auth.uid()) = id);

DROP POLICY IF EXISTS "Admins can update all profiles" ON public.profiles;
CREATE POLICY "Admins can update all profiles"
  ON public.profiles
  FOR UPDATE
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- RLS controls which row is editable; this trigger protects privileged columns within that row.
CREATE OR REPLACE FUNCTION public.protect_profile_privileges()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  IF NEW.id IS DISTINCT FROM OLD.id THEN
    RAISE EXCEPTION 'Profile ownership cannot be changed';
  END IF;

  IF NEW.role IS DISTINCT FROM OLD.role
     OR NEW.is_admin IS DISTINCT FROM OLD.is_admin THEN
    IF (SELECT auth.uid()) IS NOT NULL AND NOT public.is_admin() THEN
      RAISE EXCEPTION 'Only an administrator can change profile privileges';
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.protect_profile_privileges() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.protect_profile_privileges() FROM anon, authenticated;

DROP TRIGGER IF EXISTS tr_protect_profile_privileges ON public.profiles;
CREATE TRIGGER tr_protect_profile_privileges
BEFORE UPDATE ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.protect_profile_privileges();

-- These functions are called only by trusted Edge Functions using the service role.
-- SECURITY INVOKER is sufficient because the service role already has the required privileges.
CREATE OR REPLACE FUNCTION public.deduct_variant_stock(
  p_variant_id UUID,
  p_quantity INTEGER
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = ''
AS $$
DECLARE
  v_count INTEGER;
BEGIN
  IF p_variant_id IS NULL OR p_quantity IS NULL OR p_quantity <= 0 THEN
    RAISE EXCEPTION 'A variant and positive quantity are required';
  END IF;

  UPDATE public.product_variants
  SET stock = stock - p_quantity
  WHERE id = p_variant_id
    AND stock >= p_quantity;

  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count = 1;
END;
$$;

CREATE OR REPLACE FUNCTION public.restore_variant_stock(
  p_variant_id UUID,
  p_quantity INTEGER
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = ''
AS $$
DECLARE
  v_count INTEGER;
BEGIN
  IF p_variant_id IS NULL OR p_quantity IS NULL OR p_quantity <= 0 THEN
    RAISE EXCEPTION 'A variant and positive quantity are required';
  END IF;

  UPDATE public.product_variants
  SET stock = stock + p_quantity
  WHERE id = p_variant_id;

  GET DIAGNOSTICS v_count = ROW_COUNT;
  IF v_count <> 1 THEN
    RAISE EXCEPTION 'Variant not found';
  END IF;
END;
$$;

REVOKE ALL ON FUNCTION public.deduct_variant_stock(UUID, INTEGER) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.deduct_variant_stock(UUID, INTEGER) FROM anon, authenticated;
GRANT EXECUTE ON FUNCTION public.deduct_variant_stock(UUID, INTEGER) TO service_role;

REVOKE ALL ON FUNCTION public.restore_variant_stock(UUID, INTEGER) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.restore_variant_stock(UUID, INTEGER) FROM anon, authenticated;
GRANT EXECUTE ON FUNCTION public.restore_variant_stock(UUID, INTEGER) TO service_role;

-- The historical policy name implied service-only access but its WITH CHECK (true)
-- predicate applied to every role. Keep health-event writes server-side.
DROP POLICY IF EXISTS "Service roles can insert health logs" ON public.system_health_logs;
REVOKE INSERT ON TABLE public.system_health_logs FROM anon, authenticated;
GRANT INSERT ON TABLE public.system_health_logs TO service_role;

COMMIT;
