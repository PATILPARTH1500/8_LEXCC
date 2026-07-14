-- Phase 4: Additional Profile Fields

ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS dob DATE,
ADD COLUMN IF NOT EXISTS gender TEXT;
