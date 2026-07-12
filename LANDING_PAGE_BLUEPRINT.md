# LEXCC Luxury Landing Page Blueprint

## 1. Section Hierarchy
1. **Hero**: Full-screen cinematic entrance establishing brand authority.
2. **Featured Collections**: Interactive grid showcasing core product lines.
3. **Brand Manifesto**: Editorial text reveal communicating brand values.
4. **New Arrivals**: Horizontal scrolling product showcase.
5. **Craftsmanship**: Parallax storytelling of materials and quality.
6. **Lookbook Experience**: Dome gallery featuring fashion campaign visuals.
7. **Best Sellers**: 3D interactive cards for top products.
8. **Community & Culture**: Animated social proof and lifestyle connection.
9. **Newsletter**: Premium lead capture form.
10. **Footer**: Luxury brand links and secondary navigation.

## 2. UX Rationale
The landing page transitions LEXCC from a generic storefront to a luxury fashion campaign. By prioritizing storytelling, cinematic motion, and editorial layouts over immediate product grids, we build brand equity. Users must feel the "expensive, exclusive, and confident" identity of LEXCC before they are prompted to buy. We enforce a 4-6 scroll desktop experience to let the brand narrative breathe.

## 3. Animation Strategy
- **Global**: Lenis smooth scrolling for weight and momentum. Custom gold ring cursor reflecting hover states (SHOP, VIEW, EXPLORE).
- **Entrance**: Cinematic text reveals and fade-ins to avoid jarring pop-ins. 
- **Scroll-driven**: Sections reveal themselves via GSAP ScrollTrigger to feel like a continuous editorial piece.
- **Hover/Interactive**: Magnetic buttons, tilt effects, and particle sparks (Click Spark) provide premium tactile feedback.

## 4. React Bits Components Per Section
- **Hero**: *Split Text* (headline reveal), *Magnetic Button* (CTAs), *Spotlight* (background).
- **Featured Collections**: *Bounce Cards* (interactive categories).
- **Brand Manifesto**: *Curved Loop* (background depth) + *Text Reveal* (scroll-driven message).
- **New Arrivals**: *Infinite Scroll* (premium horizontal showcase).
- **Craftsmanship**: *Parallax* (split-screen luxury storytelling).
- **Lookbook Experience**: *Dome Gallery* (immersive fashion campaign).
- **Best Sellers**: *Hover Cards* / *Tilted Card* (3D lift effect).
- **Community & Culture**: *Counter* (animated stats).
- **Newsletter**: *Glow Border* (interactive email input).
- **Global**: *Click Spark* (tactile clicks on key elements).

## 5. GSAP Strategy
GSAP will handle scroll-linked animations and complex timelines.
- `ScrollTrigger` for pinning sections (e.g., Craftsmanship parallax, Lookbook transitions).
- Staggered reveals for grids (Featured Collections, Best Sellers).
- Timeline sequencing for the initial page load (Hero loading sequence).

## 6. Framer Motion Strategy
Framer Motion will handle micro-interactions and layout transitions.
- Page transitions between routes.
- Fluid layout changes.
- Complex state-driven animations (e.g., custom cursor states).
- Magnetic hover interpolations.

## 7. Visual References
- **Aesthetic**: Apple × Amiri × Fear Of God. 
- **Colors**: Primary #000000, Secondary #0F0F0F, Accent #D4AF37, Text #FFFFFF.
- **Typography**: Large, bold, sans-serif or elegant serif pairings, layered over imagery.
- **Textures**: Premium grain overlay to give a tactile, print-like feel.

## 8. Component Architecture
Components will be highly modular, wrapping React Bits with brand-specific styling.
- `src/components/animations/` (Lenis wrapper, CustomCursor, SparkButton)
- `src/components/sections/Hero/`
- `src/components/sections/Lookbook/`
- `src/components/sections/Manifesto/`
- `src/components/ui/` (LuxuryButton, GlowInput)

## 9. Folder Structure
```text
src/
├── components/
│   ├── animations/     # Framer/GSAP/React Bits wrappers
│   ├── sections/       # Landing page sections (Hero, Lookbook, etc.)
│   └── ui/             # Reusable UI elements (Buttons, Cards, Inputs)
├── pages/
│   └── Home.jsx        # Assembles the landing page blueprint
├── styles/
│   └── globals.css     # Luxury tokens, Lenis styles, custom cursors
└── utils/
    └── gsap.js         # GSAP registration and utility functions
```

## 10. Development Roadmap
1. **Foundation setup**: Install Lenis, React Bits, GSAP, configure Custom Cursor and Grain Overlay.
2. **Hero & Manifesto**: Build the first impression (Split Text, Magnetic Buttons, Curved Loop).
3. **Core Showcases**: Implement Featured Collections (Bounce Cards) and Best Sellers.
4. **Immersive Sections**: Build the Lookbook (Dome Gallery) and Craftsmanship (Parallax).
5. **Conversion Elements**: Add New Arrivals, Community (Counters), and Newsletter (Glow Border).
6. **Polish**: Link everything with GSAP ScrollTrigger, refine timings, ensure pixel-perfect luxury styling.
