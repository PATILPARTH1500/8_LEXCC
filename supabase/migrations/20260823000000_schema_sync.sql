BEGIN;

-- 1. cart_items: add variant_id
ALTER TABLE public.cart_items 
ADD COLUMN IF NOT EXISTS variant_id UUID REFERENCES public.product_variants(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_cart_items_variant_id ON public.cart_items(variant_id);

-- 2. order_items: add variant_id
ALTER TABLE public.order_items 
ADD COLUMN IF NOT EXISTS variant_id UUID REFERENCES public.product_variants(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_order_items_variant_id ON public.order_items(variant_id);

-- 3. orders table: synchronize schema
-- The live DB may have legacy columns that are NOT NULL. We should make them nullable.
DO $$
BEGIN
    BEGIN
        ALTER TABLE public.orders ALTER COLUMN customer_name DROP NOT NULL;
    EXCEPTION WHEN undefined_column THEN END;
    BEGIN
        ALTER TABLE public.orders ALTER COLUMN email DROP NOT NULL;
    EXCEPTION WHEN undefined_column THEN END;
    BEGIN
        ALTER TABLE public.orders ALTER COLUMN address_line_1 DROP NOT NULL;
    EXCEPTION WHEN undefined_column THEN END;
    BEGIN
        ALTER TABLE public.orders ALTER COLUMN city DROP NOT NULL;
    EXCEPTION WHEN undefined_column THEN END;
    BEGIN
        ALTER TABLE public.orders ALTER COLUMN state DROP NOT NULL;
    EXCEPTION WHEN undefined_column THEN END;
    BEGIN
        ALTER TABLE public.orders ALTER COLUMN postal_code DROP NOT NULL;
    EXCEPTION WHEN undefined_column THEN END;
    BEGIN
        ALTER TABLE public.orders ALTER COLUMN country DROP NOT NULL;
    EXCEPTION WHEN undefined_column THEN END;
    BEGIN
        ALTER TABLE public.orders ALTER COLUMN total DROP NOT NULL;
    EXCEPTION WHEN undefined_column THEN END;
END $$;

ALTER TABLE public.orders 
  ADD COLUMN IF NOT EXISTS total_amount DECIMAL(10,2),
  ADD COLUMN IF NOT EXISTS shipping_address JSONB,
  ADD COLUMN IF NOT EXISTS billing_address JSONB,
  ADD COLUMN IF NOT EXISTS payment_status TEXT DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS razorpay_order_id TEXT,
  ADD COLUMN IF NOT EXISTS razorpay_payment_id TEXT,
  ADD COLUMN IF NOT EXISTS guest_access_token_hash TEXT,
  ADD COLUMN IF NOT EXISTS razorpay_signature TEXT,
  ADD COLUMN IF NOT EXISTS razorpay_refund_id TEXT,
  ADD COLUMN IF NOT EXISTS payment_verified_at TIMESTAMPTZ;

COMMIT;
