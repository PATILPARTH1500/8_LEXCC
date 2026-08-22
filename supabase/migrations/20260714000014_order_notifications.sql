-- Migration: order_notifications table for future notifications (email, WhatsApp, SMS)
CREATE TABLE IF NOT EXISTS public.order_notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE,
  type TEXT NOT NULL, -- e.g., 'email_shipped', 'whatsapp_confirmed'
  status TEXT DEFAULT 'pending', -- 'pending', 'sent', 'failed'
  recipient TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  sent_at TIMESTAMPTZ
);

ALTER TABLE public.order_notifications ENABLE ROW LEVEL SECURITY;

-- Admins can view and manage notifications
CREATE POLICY "Admins can manage order notifications" 
  ON public.order_notifications FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid() AND profiles.is_admin = true
    )
  );

-- Users can view notifications related to their orders
CREATE POLICY "Users can view notifications for their orders"
  ON public.order_notifications FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.orders
      WHERE orders.id = order_notifications.order_id AND orders.user_id = auth.uid()
    )
  );
