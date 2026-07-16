-- Seed data for LEXCC eCommerce

-- 1. Categories
INSERT INTO public.categories (id, name, slug, description) VALUES
  ('a1b2c3d4-0000-0000-0000-000000000001', 'Men', 'men', 'Men''s luxury streetwear'),
  ('a1b2c3d4-0000-0000-0000-000000000002', 'Footwear', 'footwear', 'Premium footwear collection'),
  ('a1b2c3d4-0000-0000-0000-000000000003', 'Collections', 'collections', 'Curated signature collections'),
  ('a1b2c3d4-0000-0000-0000-000000000004', 'Accessories', 'accessories', 'Luxury accessories')
ON CONFLICT (slug) DO NOTHING;

-- 2. Products
INSERT INTO public.products (id, category_id, name, slug, description, price, status, is_featured, is_new_arrival, image_url) VALUES
  ('b1b2c3d4-0000-0000-0000-000000000001', 'a1b2c3d4-0000-0000-0000-000000000001', 'OBSIDIAN OVERSIZED TEE', 'obsidian-oversized-tee', 'A premium heavyweight oversized tee tailored for a relaxed, draped fit. Cut from 450gsm luxury cotton.', 180.00, 'active', true, true, 'https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?q=80&w=1200&auto=format&fit=crop'),
  ('b1b2c3d4-0000-0000-0000-000000000002', 'a1b2c3d4-0000-0000-0000-000000000001', 'CHALK ESSENTIAL TEE', 'chalk-essential-tee', 'The ultimate classic white tee made from mercerized luxury cotton for a subtle sheen and structured drape.', 160.00, 'active', false, false, 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?q=80&w=1200&auto=format&fit=crop'),
  ('b1b2c3d4-0000-0000-0000-000000000003', 'a1b2c3d4-0000-0000-0000-000000000001', 'ECLIPSE HEAVY HOODIE', 'eclipse-heavy-hoodie', 'A cozy, ultra-heavyweight 600gsm hoodie featuring an aggressive drop shoulder and cropped hem.', 320.00, 'active', true, false, 'https://images.unsplash.com/photo-1556821840-3a63f95609a7?q=80&w=1200&auto=format&fit=crop'),
  ('b1b2c3d4-0000-0000-0000-000000000004', 'a1b2c3d4-0000-0000-0000-000000000001', 'TACTICAL CARGO PANTS', 'tactical-cargo-pants', 'Utilitarian cargo pants crafted from durable, high-quality Japanese ripstop fabric.', 420.00, 'active', false, true, 'https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?q=80&w=1200&auto=format&fit=crop'),
  ('b1b2c3d4-0000-0000-0000-000000000005', 'a1b2c3d4-0000-0000-0000-000000000001', 'VINTAGE WASH DENIM', 'vintage-wash-denim', 'Perfectly washed relaxed denim with slight distressing for an authentic vintage feel.', 380.00, 'active', true, false, 'https://images.unsplash.com/photo-1541099649105-f69ad21f3246?q=80&w=1200&auto=format&fit=crop'),
  ('b1b2c3d4-0000-0000-0000-000000000006', 'a1b2c3d4-0000-0000-0000-000000000002', 'MONOLITH SNEAKERS', 'monolith-sneakers', 'Minimalist black leather sneakers with a chunky aggressive sole unit.', 550.00, 'active', true, true, 'https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?q=80&w=1200&auto=format&fit=crop'),
  ('b1b2c3d4-0000-0000-0000-000000000007', 'a1b2c3d4-0000-0000-0000-000000000002', 'AERO RUNNERS', 'aero-runners', 'Performance-inspired running sneakers with breathable engineered mesh and a translucent air sole.', 480.00, 'active', false, false, 'https://images.unsplash.com/photo-1608231387042-66d1773070a5?q=80&w=1200&auto=format&fit=crop'),
  ('b1b2c3d4-0000-0000-0000-000000000008', 'a1b2c3d4-0000-0000-0000-000000000003', 'HERITAGE VARSITY', 'heritage-varsity', 'A classic wool varsity jacket with calfskin leather sleeves and chenille logo patches.', 1250.00, 'active', true, false, 'https://images.unsplash.com/photo-1559551409-dadc959f76b8?q=80&w=1200&auto=format&fit=crop'),
  ('b1b2c3d4-0000-0000-0000-000000000009', 'a1b2c3d4-0000-0000-0000-000000000001', 'NYLON BOMBER', 'nylon-bomber', 'Sleek oversized nylon bomber jacket with heavy-duty silver hardware.', 620.00, 'active', false, true, 'https://images.unsplash.com/photo-1591047139829-d91aecb6caea?q=80&w=1200&auto=format&fit=crop'),
  ('b1b2c3d4-0000-0000-0000-000000000010', 'a1b2c3d4-0000-0000-0000-000000000004', 'SIGNATURE CAP', 'signature-cap', 'Six-panel minimal cap featuring subtle tonal embroidery.', 110.00, 'active', false, false, 'https://images.unsplash.com/photo-1588850561407-ed78c282e89b?q=80&w=1200&auto=format&fit=crop'),
  ('b1b2c3d4-0000-0000-0000-000000000011', 'a1b2c3d4-0000-0000-0000-000000000004', 'UTILITY CROSSBODY', 'utility-crossbody', 'Compact Italian leather crossbody bag for daily essentials.', 350.00, 'active', true, true, 'https://images.unsplash.com/photo-1590874103328-eac38a683ce7?q=80&w=1200&auto=format&fit=crop'),
  ('b1b2c3d4-0000-0000-0000-000000000012', 'a1b2c3d4-0000-0000-0000-000000000001', 'ESSENTIAL SWEATSHIRT', 'essential-sweatshirt', 'Loopback French terry sweatshirt offering unparalleled comfort and a boxy fit.', 240.00, 'active', false, false, 'https://images.unsplash.com/photo-1556821840-3a63f95609a7?q=80&w=1200&auto=format&fit=crop')
ON CONFLICT (slug) DO UPDATE SET image_url = EXCLUDED.image_url;

-- 3. Product Variants (XS, S, M, L, XL in Black, White, Grey)
-- Delete existing to ensure clean seed
DELETE FROM public.product_variants;

INSERT INTO public.product_variants (product_id, size, color, sku, stock)
SELECT 
  p.id AS product_id,
  s.size,
  c.color,
  p.slug || '-' || s.size || '-' || c.color AS sku,
  floor(random() * 20 + 0)::int AS stock
FROM public.products p
CROSS JOIN (VALUES ('XS'), ('S'), ('M'), ('L'), ('XL')) AS s(size)
CROSS JOIN (VALUES ('Black'), ('White'), ('Grey'), ('Navy'), ('Olive')) AS c(color)
ON CONFLICT (sku) DO NOTHING;

-- 4. Product Images (Fallback just in case)
INSERT INTO public.product_images (product_id, image_url, display_order)
SELECT 
  id AS product_id,
  image_url,
  0 AS display_order
FROM public.products
ON CONFLICT DO NOTHING;
