LEXCC MASTER PROJECT CONTEXT (READ FIRST)

You are joining an existing production-grade ecommerce project called LEXCC.

Before making any changes, treat the following as the source of truth.

Project Overview

LEXCC is a luxury fashion ecommerce platform built for a small-scale premium clothing brand.

The design language is:

Luxury
Editorial
Minimal
Black + Gold theme
Premium fashion experience
Mobile-first
Smooth animations using Framer Motion

This is NOT a generic ecommerce store.

The objective is to provide a premium luxury brand experience similar to high-end fashion retailers.

Tech Stack

Frontend:

React
Vite
React Router
Framer Motion

Backend:

Supabase

Database:

PostgreSQL

Storage:

Supabase Storage

Payments:

Stripe (currently being finalized)

Bot Protection:

Cloudflare Turnstile (not yet configured)

Deployment:

Production deployment pending
Authentication Features

Completed:

Registration
Login
Logout
Session Persistence
Forgot Password
Reset Password
Google Sign-In
Email Verification
Protected Routes
Admin Route Protection

Database:

profiles table linked to auth.users

Admin access controlled using:

profiles.is_admin
Customer Features

Completed:

Shopping
Product Catalog
Product Search
Category Filtering
Price Filtering
Size Filtering
Color Filtering
Sorting
Featured Products
New Arrivals
Best Sellers
Product Detail
Image Gallery
Product Zoom
Variant Selection
Size Selection
Color Selection
Stock Availability
Related Products
Wishlist
Add
Remove
Persistence
Cart
Add to Cart
Update Quantity
Remove Items
Persistent Cart
Profile
Profile Editing
Address Management
Avatar Upload
Order History
Admin Features

Admin panel exists inside the same project.

Admin users are identified through:

profiles.is_admin = true

Maximum expected admins:

Owner
Backup Admin

Only 2 admins expected.

Admin Dashboard

Implemented:

Revenue Overview
Order Analytics
Product Analytics
Customer Analytics
Recent Orders Feed
Inventory Insights
Product Management

Implemented:

Create Product
Edit Product
Delete Product
Categories
Variants
Image Upload
Featured Product Toggle
New Arrival Toggle

Storefront must always reflect database changes immediately.

No mock data allowed.

Order Management

Implemented:

View Orders
Search Orders
Filter Orders
Update Status

Current order statuses:

pending
processing
shipped
delivered
cancelled

Payment statuses:

pending
paid
failed
refunded
partially_refunded
Database Architecture

Primary tables:

profiles
categories
products
product_variants
carts
cart_items
orders
order_items
wishlists
admin_activity_logs
Storage

Buckets:

avatars
products

Avatar uploads use:

avatars/{user_id}/filename

Product images use:

products/*

Storage RLS must remain intact.

Security

Implemented:

RLS enabled
RBAC
JWT Auth
Protected Routes
Admin Protection
Secure Storage Policies

Never expose:

Service Role Key
Stripe Secret Key
Webhook Secret
Turnstile Secret

Frontend only receives:

VITE_SUPABASE_URL
VITE_SUPABASE_ANON_KEY
VITE_STRIPE_PUBLIC_KEY
VITE_CLOUDFLARE_TURNSTILE_SITE_KEY
Stripe Architecture

Current approach:

Order Created:

status = pending

payment_status = pending

Inventory is NOT deducted.

Stripe webhook handles:

payment_intent.succeeded

Then:

payment_status = paid
status = processing
inventory deduction

Inventory deduction occurs ONLY after successful payment.

Webhook includes:

signature verification
idempotency protection
payment_intent tracking
Shipping Workflow (IMPORTANT)

We are NOT integrating Blue Dart API right now.

Workflow:

Customer:

Registers
Browses
Purchases
Receives order

Owner:

Opens Admin Panel
Sees paid order
Creates shipment manually in Blue Dart portal
Receives tracking number
Enters tracking number in Admin Order

System:

Saves tracking number
Saves carrier
Saves shipped_at

Then automatically:

Email customer
WhatsApp customer
Update customer dashboard

Customer can:

View tracking number
View shipment status
Click Track Shipment
Next Priorities

Priority 1

Shipping Tracking Workflow

Priority 2

Email Notifications

Priority 3

WhatsApp Notifications

Priority 4

Floating WhatsApp Support Button

Priority 5

Stripe Production Deployment

Priority 6

Cloudflare Turnstile Setup

Priority 7

Production Launch

Rules
Never introduce mock data.
Never introduce placeholder APIs.
Always use live database queries.
Maintain luxury black/gold design language.
Preserve Supabase RLS.
Preserve Stripe security architecture.
Audit existing code before making changes.
Do not rebuild features that already exist.
Treat this as a near-production application, not a prototype.

END OF PROJECT CONTEXT