-- Phase 9: Pre-Stripe Enhancements (Inventory, Orders, Audit, Idempotency)

-- 1. Fix Inventory Logic
DROP TRIGGER IF EXISTS tr_decrement_stock ON public.order_items;

-- 2. Expand Order States & Metadata
ALTER TABLE public.orders
ADD COLUMN IF NOT EXISTS payment_status TEXT DEFAULT 'pending',
ADD COLUMN IF NOT EXISTS tracking_number TEXT,
ADD COLUMN IF NOT EXISTS carrier TEXT,
ADD COLUMN IF NOT EXISTS shipped_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS delivered_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS stripe_payment_intent_id TEXT UNIQUE;

-- 3. Atomic Inventory Procedures (Oversell Protection & Refunds)
CREATE OR REPLACE FUNCTION public.deduct_variant_stock(p_variant_id UUID, p_quantity INTEGER)
RETURNS BOOLEAN AS $$
DECLARE
  v_count INTEGER;
BEGIN
  UPDATE public.product_variants
  SET stock = stock - p_quantity
  WHERE id = p_variant_id AND stock >= p_quantity;
  
  -- Check if any row was actually updated (if stock was insufficient, it returns false)
  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count > 0;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.restore_variant_stock(p_variant_id UUID, p_quantity INTEGER)
RETURNS VOID AS $$
BEGIN
  UPDATE public.product_variants
  SET stock = stock + p_quantity
  WHERE id = p_variant_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Abandoned Order Cleanup (Run via pg_cron extension)
CREATE EXTENSION IF NOT EXISTS pg_cron;
-- Schedule to run every hour to delete unpaid orders older than 24 hours
-- SELECT cron.schedule('cleanup-abandoned-orders', '0 * * * *', $$ 
--    DELETE FROM public.orders WHERE payment_status = 'pending' AND created_at < NOW() - INTERVAL '24 hours';
-- $$);

-- 5. Admin Audit Logging Table
CREATE TABLE IF NOT EXISTS public.admin_activity_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  admin_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id UUID,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.admin_activity_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view audit logs" ON public.admin_activity_logs FOR SELECT USING (public.is_admin());
CREATE POLICY "Admins can insert audit logs" ON public.admin_activity_logs FOR INSERT WITH CHECK (public.is_admin());

-- 6. Triggers for Automatic Audit Logging
CREATE OR REPLACE FUNCTION public.log_admin_activity()
RETURNS TRIGGER AS $$
DECLARE
  v_admin_id UUID;
BEGIN
  -- We assume auth.uid() is the admin making the change via the API
  v_admin_id := auth.uid();
  
  -- If auth.uid() is null, it means a service-role (like a webhook) made the change.
  -- We still want to log it, but admin_id will be NULL.
  
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.admin_activity_logs (admin_id, action, entity_type, entity_id, metadata)
    VALUES (v_admin_id, 'CREATED', TG_TABLE_NAME, NEW.id, jsonb_build_object('data', row_to_json(NEW), 'is_system', v_admin_id IS NULL));
  ELSIF TG_OP = 'UPDATE' THEN
    INSERT INTO public.admin_activity_logs (admin_id, action, entity_type, entity_id, metadata)
    VALUES (v_admin_id, 'UPDATED', TG_TABLE_NAME, NEW.id, jsonb_build_object('old', row_to_json(OLD), 'new', row_to_json(NEW), 'is_system', v_admin_id IS NULL));
  ELSIF TG_OP = 'DELETE' THEN
    INSERT INTO public.admin_activity_logs (admin_id, action, entity_type, entity_id, metadata)
    VALUES (v_admin_id, 'DELETED', TG_TABLE_NAME, OLD.id, jsonb_build_object('data', row_to_json(OLD), 'is_system', v_admin_id IS NULL));
    RETURN OLD;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Apply Audit triggers to core admin tables
DROP TRIGGER IF EXISTS tr_audit_products ON public.products;
CREATE TRIGGER tr_audit_products
AFTER INSERT OR UPDATE OR DELETE ON public.products
FOR EACH ROW EXECUTE FUNCTION public.log_admin_activity();

DROP TRIGGER IF EXISTS tr_audit_categories ON public.categories;
CREATE TRIGGER tr_audit_categories
AFTER INSERT OR UPDATE OR DELETE ON public.categories
FOR EACH ROW EXECUTE FUNCTION public.log_admin_activity();

DROP TRIGGER IF EXISTS tr_audit_variants ON public.product_variants;
CREATE TRIGGER tr_audit_variants
AFTER INSERT OR UPDATE OR DELETE ON public.product_variants
FOR EACH ROW EXECUTE FUNCTION public.log_admin_activity();

DROP TRIGGER IF EXISTS tr_audit_orders ON public.orders;
CREATE TRIGGER tr_audit_orders
AFTER UPDATE ON public.orders
FOR EACH ROW EXECUTE FUNCTION public.log_admin_activity();

-- 7. Product Gallery Support (RLS)
DROP POLICY IF EXISTS "Admins can insert images" ON public.product_images;
CREATE POLICY "Admins can insert images" ON public.product_images FOR INSERT WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Admins can update images" ON public.product_images;
CREATE POLICY "Admins can update images" ON public.product_images FOR UPDATE USING (public.is_admin());

DROP POLICY IF EXISTS "Admins can delete images" ON public.product_images;
CREATE POLICY "Admins can delete images" ON public.product_images FOR DELETE USING (public.is_admin());

-- 8. System Health Monitoring
CREATE TABLE IF NOT EXISTS public.system_health_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_type TEXT NOT NULL, -- 'webhook_failure', 'payment_exception', 'inventory_error'
  severity TEXT NOT NULL, -- 'warning', 'error', 'critical'
  message TEXT NOT NULL,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.system_health_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins can view health logs" ON public.system_health_logs FOR SELECT USING (public.is_admin());
CREATE POLICY "Service roles can insert health logs" ON public.system_health_logs FOR INSERT WITH CHECK (true); -- Only used securely by server endpoints

