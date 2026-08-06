---
name: Provisions & Heritage
colors:
  surface: '#f8f9fa'
  surface-dim: '#d9dadb'
  surface-bright: '#f8f9fa'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f3f4f5'
  surface-container: '#edeeef'
  surface-container-high: '#e7e8e9'
  surface-container-highest: '#e1e3e4'
  on-surface: '#191c1d'
  on-surface-variant: '#434654'
  inverse-surface: '#2e3132'
  inverse-on-surface: '#f0f1f2'
  outline: '#737685'
  outline-variant: '#c3c6d6'
  surface-tint: '#2155cc'
  primary: '#00328c'
  on-primary: '#ffffff'
  primary-container: '#0046be'
  on-primary-container: '#afc1ff'
  inverse-primary: '#b4c5ff'
  secondary: '#745b00'
  on-secondary: '#ffffff'
  secondary-container: '#fecb00'
  on-secondary-container: '#6e5700'
  tertiary: '#7a0008'
  on-tertiary: '#ffffff'
  tertiary-container: '#a60010'
  on-tertiary-container: '#ffafa7'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#dbe1ff'
  primary-fixed-dim: '#b4c5ff'
  on-primary-fixed: '#00174b'
  on-primary-fixed-variant: '#003da9'
  secondary-fixed: '#ffe08b'
  secondary-fixed-dim: '#f1c100'
  on-secondary-fixed: '#241a00'
  on-secondary-fixed-variant: '#584400'
  tertiary-fixed: '#ffdad6'
  tertiary-fixed-dim: '#ffb4ab'
  on-tertiary-fixed: '#410002'
  on-tertiary-fixed-variant: '#93000d'
  background: '#f8f9fa'
  on-background: '#191c1d'
  surface-variant: '#e1e3e4'
  promo-orange: '#FF8F1C'
  surface-white: '#FFFFFF'
  text-dark: '#1a1a1a'
  border-subtle: '#e0e0e0'
typography:
  display-lg:
    fontFamily: Hanken Grotesk
    fontSize: 48px
    fontWeight: '700'
    lineHeight: 56px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Hanken Grotesk
    fontSize: 32px
    fontWeight: '700'
    lineHeight: 40px
  headline-lg-mobile:
    fontFamily: Hanken Grotesk
    fontSize: 24px
    fontWeight: '700'
    lineHeight: 32px
  title-md:
    fontFamily: Hanken Grotesk
    fontSize: 20px
    fontWeight: '600'
    lineHeight: 28px
  body-lg:
    fontFamily: Hanken Grotesk
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  body-sm:
    fontFamily: Hanken Grotesk
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  label-bold:
    fontFamily: Hanken Grotesk
    fontSize: 12px
    fontWeight: '700'
    lineHeight: 16px
    letterSpacing: 0.05em
  price-display:
    fontFamily: Hanken Grotesk
    fontSize: 18px
    fontWeight: '700'
    lineHeight: 24px
rounded:
  sm: 0.125rem
  DEFAULT: 0.25rem
  md: 0.375rem
  lg: 0.5rem
  xl: 0.75rem
  full: 9999px
spacing:
  base: 8px
  container-max: 1280px
  gutter-desktop: 24px
  gutter-mobile: 16px
  margin-desktop: 40px
  margin-mobile: 16px
  stack-sm: 4px
  stack-md: 12px
  stack-lg: 24px
---

## Brand & Style

The design system is rooted in the "Modern Corporate Retail" aesthetic. It prioritizes reliability, efficiency, and accessibility, reflecting a market leader that balances heritage with digital-first convenience. The target audience is the everyday consumer looking for a dependable and organized shopping experience.

The design style is **Corporate / Modern** with a focus on high-clarity information architecture. It avoids unnecessary decorative elements in favor of a structured, grid-based layout that emphasizes product visibility and ease of navigation. Key characteristics include:
- **Functional Clarity:** Clear distinction between navigational, promotional, and transactional zones.
- **Trustworthy Professionalism:** Using a primary blue to anchor the brand while utilizing vibrant accents to drive action.
- **Efficiency:** A layout designed for rapid scanning and quick mental processing of price points and categories.

## Colors

The palette is built on a foundation of "Retail Primary" colors. 
- **Primary (Blue):** Used for header backgrounds, primary buttons, and core branding elements to instill a sense of authority and stability.
- **Secondary (Yellow):** Reserved for high-attention "Call to Action" elements, badges, and highlighting savings or promotional alerts.
- **Tertiary (Red):** Exclusively used for urgency, error states, and price drops/clearance notifications.
- **Neutral:** A light-grey and white foundation ensures the interface remains airy and the product imagery takes center stage.

## Typography

This design system utilizes **Hanken Grotesk** for all levels of the hierarchy. Its clean, geometric sans-serif nature provides the sharp, contemporary feel required for a modern retail platform.

- **Weight Usage:** Bold (700) is used for headers and prices to ensure high legibility against busy product imagery. Medium (500) and Regular (400) are used for descriptive text and metadata.
- **Price Scaling:** Prices are always rendered with high-weight fonts. In product cards, the price should be at least 2px larger than the product name to prioritize value communication.
- **Mobile Adjustments:** Large display headers scale down significantly on mobile to maximize "above the fold" content visibility.

## Layout & Spacing

This design system follows a **Fixed Grid** model for desktop to maintain a premium, structured feel, transitioning to a **Fluid Grid** for mobile devices.

- **Grid System:** A 12-column grid is used for desktop (1280px max width). Product listings typically follow a 4-column (desktop), 3-column (tablet), or 2-column (mobile) span.
- **Spacing Rhythm:** An 8px base unit (linear scale) governs all padding and margins. 
- **Information Density:** Spacing between product card elements (Image, Title, Price) is tight (4px–8px) to allow for higher item density, while sections are separated by larger gaps (48px–64px) to define clear boundaries between categories.

## Elevation & Depth

To maintain a clean and professional retail look, this design system uses **Tonal Layers** and **Low-Contrast Outlines** rather than heavy shadows.

- **Surface Tiers:** The main background is a very light neutral (#f8f9fa), while interactive cards and containers are pure white (#FFFFFF).
- **Elevation:** Subtle shadows (e.g., `0px 2px 4px rgba(0,0,0,0.05)`) are only applied to floating elements like dropdown menus, tooltips, or "Add to Cart" sticky bars.
- **Borders:** A 1px solid border (#e0e0e0) is used to define product cards and input fields. This provides a "tile" look that is common in high-end e-commerce interfaces.

## Shapes

The shape language is **Soft** but disciplined. 
- **Standard Radius:** A 4px (0.25rem) radius is applied to buttons, input fields, and product cards. This provides a modern touch without appearing too "playful" or casual.
- **Search Bars:** These can utilize a larger `rounded-xl` (12px) radius to distinguish them as primary utility tools.
- **Badges:** Small promotional chips (e.g., "Sale" or "New") use a 2px radius to maintain a sharp, sticker-like appearance.

## Components

- **Buttons:** 
  - *Primary:* Solid Blue (#0046be) with White text. Bold weight.
  - *Secondary (CTA):* Solid Yellow (#ffcc00) with Blue text for high-conversion actions like "Checkout."
- **Input Fields:** 1px grey border, 4px corner radius. On focus, the border shifts to the Primary Blue with a subtle 2px glow.
- **Product Cards:** White background with a 1px subtle border. Images should be contained in a square aspect ratio. Titles are limited to 2 lines with ellipsis.
- **Chips & Badges:** Used for category tags or product attributes. Use a light tint of the primary color or the named "promo-orange" for specific callouts.
- **Search Bar:** A prominent feature in the header, stretching significantly across the grid, featuring a secondary yellow search icon button for immediate recognition.
- **Navigation:** Top-tier categories should use bold labels. Active states are indicated by a 3px bottom border in Primary Blue.