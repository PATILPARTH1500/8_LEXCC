-- Migration: Add phone and address_line_2 to addresses for Indian schema
ALTER TABLE public.addresses
ADD COLUMN IF NOT EXISTS phone TEXT,
ADD COLUMN IF NOT EXISTS address_line_2 TEXT;

-- Enforce India as default and potentially the only valid country moving forward for checkout
-- (We won't delete historical data, but we can update defaults)
ALTER TABLE public.addresses
ALTER COLUMN country SET DEFAULT 'India';

-- Ensure postal_code and phone exist in our future inserts
