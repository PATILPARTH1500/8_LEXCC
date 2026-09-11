-- Add payment_method to orders table
ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_method text NOT NULL DEFAULT 'razorpay';
ALTER TABLE orders ADD CONSTRAINT valid_payment_method CHECK (payment_method IN ('razorpay', 'cod'));
