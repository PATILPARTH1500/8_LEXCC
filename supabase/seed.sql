-- Seed data for LEXCC eCommerce

-- 1. Categories
INSERT INTO public.categories (id, name, slug, description) VALUES
  ('a1b2c3d4-0000-0000-0000-000000000001', 'Men', 'men', 'Men''s luxury streetwear'),
  ('a1b2c3d4-0000-0000-0000-000000000002', 'Footwear', 'footwear', 'Premium footwear collection'),
  ('a1b2c3d4-0000-0000-0000-000000000003', 'Collections', 'collections', 'Curated signature collections'),
  ('a1b2c3d4-0000-0000-0000-000000000004', 'Accessories', 'accessories', 'Luxury accessories')
ON CONFLICT (slug) DO NOTHING;

-- 2. Products
INSERT INTO public.products (id, category_id, name, slug, description, price, status, is_featured, is_new_arrival) VALUES
  ('b1b2c3d4-0000-0000-0000-000000000001', 'a1b2c3d4-0000-0000-0000-000000000001', 'Black Oversized Tee', 'black-oversized-tee', 'A premium heavyweight oversized tee tailored for a relaxed fit.', 120.00, 'active', true, true),
  ('b1b2c3d4-0000-0000-0000-000000000002', 'a1b2c3d4-0000-0000-0000-000000000001', 'White Essential Tee', 'white-essential-tee', 'The ultimate classic white tee made from luxury cotton.', 95.00, 'active', false, false),
  ('b1b2c3d4-0000-0000-0000-000000000003', 'a1b2c3d4-0000-0000-0000-000000000001', 'Heavyweight Hoodie', 'heavyweight-hoodie', 'A cozy, ultra-heavyweight hoodie for everyday wear.', 180.00, 'active', true, false),
  ('b1b2c3d4-0000-0000-0000-000000000004', 'a1b2c3d4-0000-0000-0000-000000000001', 'Cargo Pants', 'cargo-pants', 'Utilitarian cargo pants crafted from durable, high-quality fabric.', 220.00, 'active', false, true),
  ('b1b2c3d4-0000-0000-0000-000000000005', 'a1b2c3d4-0000-0000-0000-000000000001', 'Relaxed Denim', 'relaxed-denim', 'Perfectly washed relaxed denim for a vintage feel.', 240.00, 'active', true, false),
  ('b1b2c3d4-0000-0000-0000-000000000006', 'a1b2c3d4-0000-0000-0000-000000000002', 'Leather Sneakers', 'leather-sneakers', 'Minimalist white leather sneakers with a chunky sole.', 350.00, 'active', true, true),
  ('b1b2c3d4-0000-0000-0000-000000000007', 'a1b2c3d4-0000-0000-0000-000000000002', 'Running Sneakers', 'running-sneakers', 'Performance-inspired running sneakers with breathable mesh.', 280.00, 'active', false, false),
  ('b1b2c3d4-0000-0000-0000-000000000008', 'a1b2c3d4-0000-0000-0000-000000000003', 'Varsity Jacket', 'varsity-jacket', 'A classic wool varsity jacket with leather sleeves.', 550.00, 'active', true, false),
  ('b1b2c3d4-0000-0000-0000-000000000009', 'a1b2c3d4-0000-0000-0000-000000000001', 'Bomber Jacket', 'bomber-jacket', 'Sleek nylon bomber jacket perfect for layering.', 420.00, 'active', false, true),
  ('b1b2c3d4-0000-0000-0000-000000000010', 'a1b2c3d4-0000-0000-0000-000000000004', 'Minimal Cap', 'minimal-cap', 'Six-panel minimal cap featuring subtle embroidery.', 65.00, 'active', false, false),
  ('b1b2c3d4-0000-0000-0000-000000000011', 'a1b2c3d4-0000-0000-0000-000000000004', 'Crossbody Bag', 'crossbody-bag', 'Compact leather crossbody bag for daily essentials.', 150.00, 'active', true, true),
  ('b1b2c3d4-0000-0000-0000-000000000012', 'a1b2c3d4-0000-0000-0000-000000000001', 'Premium Sweatshirt', 'premium-sweatshirt', 'French terry sweatshirt offering unparalleled comfort.', 140.00, 'active', false, false)
ON CONFLICT (slug) DO NOTHING;

-- 3. Product Variants (XS, S, M, L, XL in Black, White, Grey)
-- Using a CROSS JOIN approach to quickly generate variants for all products
INSERT INTO public.product_variants (product_id, size, color, sku, stock_quantity)
SELECT 
  p.id AS product_id,
  s.size,
  c.color,
  p.slug || '-' || s.size || '-' || c.color AS sku,
  floor(random() * 50 + 10)::int AS stock_quantity
FROM public.products p
CROSS JOIN (VALUES ('XS'), ('S'), ('M'), ('L'), ('XL')) AS s(size)
CROSS JOIN (VALUES ('Black'), ('White'), ('Grey')) AS c(color)
ON CONFLICT (sku) DO NOTHING;

-- 4. Product Images
INSERT INTO public.product_images (product_id, image_url, display_order)
SELECT 
  id AS product_id,
  'https://images.unsplash.com/photo-1523381210434-271e8be1f52b?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80' AS image_url,
  0 AS display_order
FROM public.products;
