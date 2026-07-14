-- Task 4 & Audit Fixes: Altering tables to match frontend requirements seamlessly

-- 1. Profiles Table
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS first_name TEXT,
ADD COLUMN IF NOT EXISTS last_name TEXT,
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW());

-- 2. Addresses Table
ALTER TABLE public.addresses
ADD COLUMN IF NOT EXISTS title TEXT,
ADD COLUMN IF NOT EXISTS first_name TEXT,
ADD COLUMN IF NOT EXISTS last_name TEXT,
ADD COLUMN IF NOT EXISTS street TEXT;

-- 3. Orders Table
ALTER TABLE public.orders
ADD COLUMN IF NOT EXISTS order_number TEXT,
ADD COLUMN IF NOT EXISTS total_amount DECIMAL(10, 2),
ADD COLUMN IF NOT EXISTS shipping_address JSONB;

-- 4. Order Items Table
ALTER TABLE public.order_items
ADD COLUMN IF NOT EXISTS price_at_time DECIMAL(10, 2);

-- Update existing data if necessary (optional fallback)
UPDATE public.orders SET total_amount = total WHERE total_amount IS NULL;
UPDATE public.order_items SET price_at_time = price WHERE price_at_time IS NULL;

-- 5. Trigger for Profile Creation
CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, first_name, last_name, phone)
  VALUES (
    NEW.id, 
    NEW.email,
    NEW.raw_user_meta_data->>'first_name',
    NEW.raw_user_meta_data->>'last_name',
    NEW.raw_user_meta_data->>'phone'
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
