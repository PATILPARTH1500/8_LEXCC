# LEXCC

<div align="center">

# LUXURY STREETWEAR REDEFINED

### Own The Streets. Define The Standard.

LEXCC is a premium luxury streetwear e-commerce platform built for the next generation of creators, entrepreneurs, and trendsetters. Combining modern fashion aesthetics with a seamless digital shopping experience, LEXCC delivers exclusive apparel, footwear, and limited-edition collections through a world-class online storefront.

![React](https://img.shields.io/badge/React-18+-61DAFB?style=for-the-badge&logo=react&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-Latest-646CFF?style=for-the-badge&logo=vite&logoColor=white)
![Supabase](https://img.shields.io/badge/Supabase-Backend-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white)
![License](https://img.shields.io/badge/Status-Production%20Ready-black?style=for-the-badge)

</div>

---

## About LEXCC

LEXCC is more than a fashion brand.

It represents confidence, individuality, and ambition. Built around luxury streetwear culture, LEXCC blends premium craftsmanship with contemporary fashion to create collections designed for those who refuse to blend in.

From oversized essentials and signature hoodies to luxury sneakers and limited-edition drops, every product is designed to elevate everyday style.

---

## Core Features

### Customer Experience

- Luxury fashion storefront
- Responsive modern UI
- Advanced product search
- Category filtering
- Color filtering
- Size filtering
- Wishlist management
- Shopping cart system
- Secure checkout flow
- Customer profile dashboard
- Address management
- Order history
- Real-time inventory validation
- Mobile-first experience

---

### Authentication & Security

- Email & Password Authentication
- Google OAuth Login
- Email Verification
- Forgot Password
- Password Reset
- Session Persistence
- Protected Routes
- Role-Based Authorization
- Secure JWT Authentication
- Supabase Authentication

---

### Admin Dashboard

- Admin Login
- Product Management
- Product Variants Management
- Inventory Tracking
- Order Management
- Customer Management
- Product Image Uploads
- Sales Monitoring
- Dashboard Analytics

---

### Product Management

- Create Products
- Edit Products
- Delete Products
- Multiple Product Images
- Featured Products
- Product Variants
- Size Management
- Color Management
- Stock Management

---

### Order Management

- Place Orders
- Order Tracking
- Order Status Updates
- Shipping Information
- Order History
- Customer Details
- Inventory Synchronization

Order Statuses:

```text
Pending
Processing
Shipped
Delivered
Cancelled
```

---

## Technology Stack

### Frontend

```text
React 18
Vite
React Router DOM
Context API
Framer Motion
GSAP
Swiper
React Icons
React Hot Toast
```

### Backend

```text
Supabase
PostgreSQL
Row Level Security
Storage Buckets
Edge Functions
Authentication
```

### Deployment

```text
Vercel
Netlify
Render
```

---

## Database Architecture

### Profiles

Stores customer and admin account information.

```text
profiles
├── id
├── email
├── full_name
├── phone
├── avatar_url
├── role
├── created_at
```

### Products

Stores all fashion products.

```text
products
├── id
├── name
├── slug
├── description
├── category
├── price
├── featured
├── created_at
```

### Product Variants

Tracks inventory by size and color.

```text
product_variants
├── product_id
├── size
├── color
└── stock
```

### Orders

Stores customer purchases.

```text
orders
├── user_id
├── customer_name
├── email
├── phone
├── shipping_address
├── total
├── status
└── created_at
```

---

## User Journey

### Customer Flow

```text
Register
    ↓
Verify Email
    ↓
Login
    ↓
Browse Products
    ↓
Select Size & Color
    ↓
Add To Cart
    ↓
Checkout
    ↓
Place Order
    ↓
Order Confirmation
    ↓
Track Order
```

---

### Admin Flow

```text
Admin Login
    ↓
Dashboard
    ↓
Manage Products
    ↓
Manage Inventory
    ↓
View Orders
    ↓
Update Status
    ↓
Customer Fulfillment
```

---

## Security

LEXCC implements enterprise-grade security practices:

- Row Level Security (RLS)
- Protected Admin Routes
- Secure Storage Policies
- JWT Authentication
- User Data Isolation
- Secure Password Reset Flows
- OAuth Authentication
- Database Access Controls

---

## Performance Optimizations

- Code Splitting
- Lazy Loading
- Image Optimization
- Route-Based Loading
- Skeleton Screens
- Cached Queries
- Optimized Database Queries
- Responsive Asset Delivery

---

## Project Structure

```text
src
│
├── assets
├── components
│   ├── Navbar
│   ├── Footer
│   ├── ProductCard
│   ├── ProtectedRoute
│   ├── AdminRoute
│   ├── ErrorBoundary
│   └── UI
│
├── context
│   ├── AuthContext
│   ├── CartContext
│   ├── WishlistContext
│   └── ThemeContext
│
├── pages
│   ├── Home
│   ├── Shop
│   ├── ProductDetails
│   ├── Cart
│   ├── Checkout
│   ├── Wishlist
│   ├── Profile
│   ├── MyOrders
│   ├── Login
│   ├── Register
│   ├── ForgotPassword
│   ├── ResetPassword
│   ├── AdminLogin
│   ├── AdminDashboard
│   ├── AdminProducts
│   ├── AdminOrders
│   └── NotFound
│
├── lib
│   └── supabase.js
│
├── App.jsx
└── main.jsx
```

---

## Getting Started

### Clone Repository

```bash
git clone https://github.com/your-username/lexcc.git
cd lexcc
```

### Install Dependencies

```bash
npm install
```

### Configure Environment Variables

Create a `.env` file:

```env
VITE_SUPABASE_URL=YOUR_SUPABASE_URL
VITE_SUPABASE_ANON_KEY=YOUR_SUPABASE_ANON_KEY
```

### Start Development Server

```bash
npm run dev
```

### Production Build

```bash
npm run build
```

### Preview Production Build

```bash
npm run preview
```

---

## Future Roadmap

### Phase I

- Luxury Streetwear Collections
- Premium Sneakers
- Order Management
- Customer Dashboard

### Phase II

- Razorpay Integration
- Stripe Integration
- Product Reviews
- Coupon System
- Loyalty Rewards

### Phase III

- AI Product Recommendations
- Personalized Collections
- Mobile Application
- Push Notifications

### Phase IV

- International Expansion
- Multi-Warehouse Inventory
- Advanced Analytics
- Fashion Drops & Limited Releases

---

## Brand Philosophy

> Luxury is not about being noticed.
>
> It's about being remembered.

LEXCC exists for individuals who move with purpose, create their own lane, and redefine the standards around them.

---

<div align="center">

# LEXCC

### Luxury Streetwear • Premium Fashion • Modern Identity

**Own The Streets. Define The Standard.**

</div>