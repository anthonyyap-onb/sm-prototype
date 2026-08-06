# SM Markets HTML → Next.js Conversion Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Convert two static HTML design files (SM Markets home page + chat modal overlay) into a working Next.js 16 / React 19 application with static JSON data, store-branch-aware product listings, and a slide-in chat modal.

**Architecture:** A single App Router route (`/`) renders the full page; interactive state (selected branch, chat open/closed) lives in a `'use client'` wrapper component (`HomeClient`). Static data is stored in `src/data/` JSON files; components import types from `src/types/`. The Tailwind v4 design system tokens from the HTML are migrated into `globals.css` via the `@theme` block.

**Tech Stack:** Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS v4 (`@import "tailwindcss"` + `@theme` inline tokens), Google Fonts via `next/font/google`, Material Symbols via a `<link>` in `layout.tsx`.

## Global Constraints

- Next.js version: `16.3.0` — App Router only, no Pages Router.
- React version: `19.2.8` — Server Components by default; use `'use client'` only where state/events are needed.
- Tailwind version: `^4` — uses `@theme` blocks in CSS, **not** `tailwind.config.js`; all custom tokens go in `globals.css`.
- TypeScript strict mode is on (`tsconfig.json` already configured).
- External image hostnames (`lh3.googleusercontent.com`) must be added to `next.config.ts` `remotePatterns` so `next/image` works.
- Font: `Hanken Grotesk` loaded via `next/font/google`, variable exposed as `--font-hanken`.
- Material Symbols Outlined: loaded via `<link>` tag in `src/app/layout.tsx` (not via `next/font` — it does not support variable icon fonts).
- No new npm packages needed; use only what is already installed.
- Static data lives in `src/data/*.json` — do **not** fetch from any API.
- Products displayed change based on selected store branch; default branch is `"sm-megamall"` (SM Megamall, Mandaluyong).

---

## File Map

| File | Action | Responsibility |
|---|---|---|
| `src/data/stores.json` | Create | List of store branches with id, name, city |
| `src/data/products.json` | Create | All products keyed by `storeId`; each entry has `featuredProducts[]` and `priceDrop[]` |
| `src/types/index.ts` | Create | Shared TypeScript types: `Store`, `Product`, `StoreProducts` |
| `src/app/globals.css` | Modify | Replace placeholder tokens; add full Tailwind v4 `@theme` block and utility styles |
| `src/app/layout.tsx` | Modify | Load Hanken Grotesk via `next/font/google`; add Material Symbols `<link>`; update metadata |
| `next.config.ts` | Modify | Add `remotePatterns` for `lh3.googleusercontent.com` |
| `src/components/TopNavBar.tsx` | Create | `'use client'` — header with logo, store branch button (opens picker), search bar, login + cart buttons |
| `src/components/StorePicker.tsx` | Create | `'use client'` — dropdown listing all branches; calls `onSelect(storeId)` |
| `src/components/SideNavBar.tsx` | Create | Server component — left sidebar with promo banner, Recipe/Blog links, category nav |
| `src/components/ProductCard.tsx` | Create | Server component — single product card (image, tags, name, price, Add to Cart + Favourite buttons) |
| `src/components/ProductGrid.tsx` | Create | Server component — section wrapper rendering a `ProductCard` grid with section title |
| `src/components/ChatModal.tsx` | Create | `'use client'` — slide-in chat panel (header, message history, typing indicator, input area) |
| `src/components/ChatFAB.tsx` | Create | `'use client'` — floating action button that toggles `ChatModal` open/closed |
| `src/app/HomeClient.tsx` | Create | `'use client'` — holds `selectedStoreId` + `isChatOpen` state; passes filtered data to child components |
| `src/app/page.tsx` | Replace | Server component — imports JSON data, renders `HomeClient` |

---

## Task 1: Static Data + Types + Config

**Files:**
- Create: `src/types/index.ts`
- Create: `src/data/stores.json`
- Create: `src/data/products.json`
- Modify: `next.config.ts`

**Interfaces:**
- Produces:
  - `Store { id: string; name: string; city: string }`
  - `Product { id: string; name: string; imageUrl: string; weight: string; price: number; originalPrice?: number; discountPercent?: number }`
  - `StoreProducts { storeId: string; featuredProducts: Product[]; priceDrop: Product[] }`

- [ ] **Step 1: Create `src/types/index.ts`**

```typescript
export interface Store {
  id: string;
  name: string;
  city: string;
}

export interface Product {
  id: string;
  name: string;
  imageUrl: string;
  weight: string;
  price: number;
  originalPrice?: number;
  discountPercent?: number;
}

export interface StoreProducts {
  storeId: string;
  featuredProducts: Product[];
  priceDrop: Product[];
}
```

- [ ] **Step 2: Create `src/data/stores.json`**

```json
[
  { "id": "sm-megamall",     "name": "SM Megamall",     "city": "Mandaluyong" },
  { "id": "sm-mall-of-asia", "name": "SM Mall of Asia", "city": "Pasay" },
  { "id": "sm-north-edsa",   "name": "SM North EDSA",   "city": "Quezon City" },
  { "id": "sm-aura",         "name": "SM Aura Premier", "city": "Taguig" }
]
```

- [ ] **Step 3: Create `src/data/products.json`**

Use image URLs from the HTML designs. Vary product names and prices per store so branch-switching is visually apparent.

```json
[
  {
    "storeId": "sm-megamall",
    "featuredProducts": [
      {
        "id": "mp-1",
        "name": "PureFoods Chicken Breast Nuggets Crispy 'N Juicy | 200g",
        "imageUrl": "https://lh3.googleusercontent.com/aida/AP1WRLtch1HS9gR61PRmqsXHfYOmCqEk_-avTU9IxI-Xc-BpH3TCkGOFf69FigdSpyF1kJ8L-InzudEZBphhwPLwOCyCzXeZmSRqfT2Eq1TEeoZ8Hsr1go30skc01KnZqvo2-QeW3_zqsoQx7SIO8bPDu1IUi4LkwuIMBpUC2AQTMVZzIZvESfwrPYxsl5yWq2-x5Zw0cj8UIXsE5_i2XQdXaprwoCwEiTbT91MG8kP4_cgs51cg4Nt7UZOLfl9P",
        "weight": "200G",
        "price": 114.00
      },
      {
        "id": "mp-2",
        "name": "Dari Creme Butter Salted | 200g",
        "imageUrl": "https://lh3.googleusercontent.com/aida/AP1WRLuzo_nYNj3Ue-sZnFW-7llkYKodt5R_s9CnXn0oHEHWH9FpYhBXo-ucydqhSOR1JQYfUnLC0G6FvUcsMRnwQHn6WalotXXorq-T-HOG56YMLap2TpLfNhWUYCg0wZnW7Rx_ELTaxkqSxg9vgl7X42SZKGPj-V3lD8iU9jn4Tj8cT61F7isPm_VRTuzEAJqPtAYPdT6BNTqwL5uWSmup1VONO1MDHmojGovfUumkgTq0NEthUiTJGpqSkiUv",
        "weight": "200G",
        "price": 57.00,
        "originalPrice": 66.50,
        "discountPercent": 14
      },
      {
        "id": "mp-3",
        "name": "Gardenia Pinoy Tasty | 450g",
        "imageUrl": "https://lh3.googleusercontent.com/aida/AP1WRLuceXvpT7wdmQ1XgiqggJ-biiIYvvNHsXijRC1OoJ9r7_DInG1bDaGhe6WA32aakJ-uBlqYKpKifhlapN-eyW8SHs9XehXoRsC6j6lF1PY1QU-NZAUvIG-6xdyLSKeDQpWdZW7pTsR1BAIy6_MC7W3eZ88ncsb4Rn9v49GoFruAPrQc62_hI8ky-7R6FTQxMhgHBmaNeUKrpXIQIEimEWPq37mdkmGDsmXtp7PTXvxNizZe5j9SxVZsyyhu",
        "weight": "450G",
        "price": 44.00
      }
    ],
    "priceDrop": [
      {
        "id": "mpd-1",
        "name": "Argentina Corned Beef | 260g",
        "imageUrl": "https://lh3.googleusercontent.com/aida/AP1WRLuWTX4gd3Qe2QvRjngPXPbLN8xyGdSavjqXWC_ae0NxRRIHQk0_moahBKSXaG7-6NKhwF8TK2Ji2GZuhprom2-ZglgNRlPUQay_Yrpd3hZyI9SspymGhc29zvKbC2JbU_Y8hnnZUlAod_TRwtP6UQQ4j7v8qEm2nsAeggBZI04Vv4FaO0C8pS72mf0JnJ9RSAiPfXYbPXREa_nFTIrmIp_sd93W20hGMiDQJs1x13QWjy5dHJ2Ct8jn5K-M",
        "weight": "260G",
        "price": 52.75,
        "originalPrice": 65.00,
        "discountPercent": 19
      },
      {
        "id": "mpd-2",
        "name": "Century Tuna Flakes in Oil | 180g",
        "imageUrl": "https://lh3.googleusercontent.com/aida/AP1WRLuO28H7LnSFCwo6-pvjsInmgsKyKA9gGj7fGNvpHLY3adrsyaZUeSh4CTr8NlpbFCVXmOdCRpkTDYv-JXzqD9neGRX83tKsAhLaLLLSqBmqzXRggB5EpJXyUrnp1rHck4qTs_f0BZwPBNlQjv8l8XdHXNrnQMl1jMWBGDbaCsn3ZwcEMj1gLOzarhvG75mMwkqvqqzE0EHn0jTcnADb3mrrPgPiCa0vyCmy0lnuRsmlgVgWIXjcXmUkmg2f",
        "weight": "180G",
        "price": 28.50,
        "originalPrice": 35.00,
        "discountPercent": 19
      }
    ]
  },
  {
    "storeId": "sm-mall-of-asia",
    "featuredProducts": [
      {
        "id": "moa-1",
        "name": "Coco Mama Fresh Gata | 200ml",
        "imageUrl": "https://lh3.googleusercontent.com/aida-public/AB6AXuAHHsHOTFfZnjiLCTMYuYo1NJKhbgdJyNQLBGDEbXtojCVTqyL0nESzmWn74VhhLNkQdNdl1F0bRb17Oqb5wZR1_0H45np-GPJVOtWmOUfukk8obd_5pdTozWnJP52sCxiC_aItW9m-Evz9YPwa3Zsml_QX-EMfYMhqsmiCm64QyMOVZDwO_VEC6erFow5gaA06GpoPKU8gjkF40eiKRhqUUUqLcmi4ndWSCTGrr5W4TpzFrD-D8Jv2vQ",
        "weight": "200ML",
        "price": 34.75
      },
      {
        "id": "moa-2",
        "name": "Dari Creme Butter Salted | 200g",
        "imageUrl": "https://lh3.googleusercontent.com/aida-public/AB6AXuAjeja2MY6VFDE3tDupTlJf-a87RlqShBgsJp4SQ2OwNU5Uq_A81RvOVj6Okguno2vuB7DubQsIarMMpuZCee9SN6P_zguw1ea4l7qCP6bW0m_rORoCTeisWIW3UcY-G2tG9J1yisvutx3234A0j7mKeKzRhbG0yZqT8q71QS2vGz3iZDBSyV1z-p5mj72SqtA53giZ9-1wzcNWaXRc9XbF4IeHCXZywQUnnqJR9Nu877wFyo6ty0XL6w",
        "weight": "200G",
        "price": 57.00,
        "originalPrice": 66.50,
        "discountPercent": 14
      },
      {
        "id": "moa-3",
        "name": "PureFoods Chicken Breast Nuggets | 200g",
        "imageUrl": "https://lh3.googleusercontent.com/aida-public/AB6AXuB8lo7fYHt_TcR44zJr0_1v48h0cjAkejcFw7VCrRRV-dcNp-Ywry1yfocjuT5B8-K8C7pMAQjNPc1K0HwmyocNce6pLq1piHmHcy6KqE1qbXYoAnSl5Sdy6gHtJfic1bwafWFVCNSk9SWASQA6PTuIo3pZGAx3e6EnwfivofhR_2ZKk1YH8kbHKilHqrK0miJkw9p9ySVttmASsGZNkf-fpBccUEaCSBkWy2vvXggwGZa4dtdHpXi3eQ",
        "weight": "200G",
        "price": 114.00
      }
    ],
    "priceDrop": [
      {
        "id": "moad-1",
        "name": "Lucky Me Pancit Canton Original | 80g",
        "imageUrl": "https://lh3.googleusercontent.com/aida/AP1WRLuWTX4gd3Qe2QvRjngPXPbLN8xyGdSavjqXWC_ae0NxRRIHQk0_moahBKSXaG7-6NKhwF8TK2Ji2GZuhprom2-ZglgNRlPUQay_Yrpd3hZyI9SspymGhc29zvKbC2JbU_Y8hnnZUlAod_TRwtP6UQQ4j7v8qEm2nsAeggBZI04Vv4FaO0C8pS72mf0JnJ9RSAiPfXYbPXREa_nFTIrmIp_sd93W20hGMiDQJs1x13QWjy5dHJ2Ct8jn5K-M",
        "weight": "80G",
        "price": 12.00,
        "originalPrice": 15.00,
        "discountPercent": 20
      },
      {
        "id": "moad-2",
        "name": "San Miguel Beer Pale Pilsen | 330ml",
        "imageUrl": "https://lh3.googleusercontent.com/aida/AP1WRLuO28H7LnSFCwo6-pvjsInmgsKyKA9gGj7fGNvpHLY3adrsyaZUeSh4CTr8NlpbFCVXmOdCRpkTDYv-JXzqD9neGRX83tKsAhLaLLLSqBmqzXRggB5EpJXyUrnp1rHck4qTs_f0BZwPBNlQjv8l8XdHXNrnQMl1jMWBGDbaCsn3ZwcEMj1gLOzarhvG75mMwkqvqqzE0EHn0jTcnADb3mrrPgPiCa0vyCmy0lnuRsmlgVgWIXjcXmUkmg2f",
        "weight": "330ML",
        "price": 55.00,
        "originalPrice": 65.00,
        "discountPercent": 15
      }
    ]
  },
  {
    "storeId": "sm-north-edsa",
    "featuredProducts": [
      {
        "id": "ne-1",
        "name": "Gardenia White Bread | 600g",
        "imageUrl": "https://lh3.googleusercontent.com/aida/AP1WRLuceXvpT7wdmQ1XgiqggJ-biiIYvvNHsXijRC1OoJ9r7_DInG1bDaGhe6WA32aakJ-uBlqYKpKifhlapN-eyW8SHs9XehXoRsC6j6lF1PY1QU-NZAUvIG-6xdyLSKeDQpWdZW7pTsR1BAIy6_MC7W3eZ88ncsb4Rn9v49GoFruAPrQc62_hI8ky-7R6FTQxMhgHBmaNeUKrpXIQIEimEWPq37mdkmGDsmXtp7PTXvxNizZe5j9SxVZsyyhu",
        "weight": "600G",
        "price": 68.00
      },
      {
        "id": "ne-2",
        "name": "PureFoods Chicken Breast Nuggets | 400g",
        "imageUrl": "https://lh3.googleusercontent.com/aida/AP1WRLtch1HS9gR61PRmqsXHfYOmCqEk_-avTU9IxI-Xc-BpH3TCkGOFf69FigdSpyF1kJ8L-InzudEZBphhwPLwOCyCzXeZmSRqfT2Eq1TEeoZ8Hsr1go30skc01KnZqvo2-QeW3_zqsoQx7SIO8bPDu1IUi4LkwuIMBpUC2AQTMVZzIZvESfwrPYxsl5yWq2-x5Zw0cj8UIXsE5_i2XQdXaprwoCwEiTbT91MG8kP4_cgs51cg4Nt7UZOLfl9P",
        "weight": "400G",
        "price": 185.00
      },
      {
        "id": "ne-3",
        "name": "Dari Creme Butter Unsalted | 225g",
        "imageUrl": "https://lh3.googleusercontent.com/aida/AP1WRLuzo_nYNj3Ue-sZnFW-7llkYKodt5R_s9CnXn0oHEHWH9FpYhBXo-ucydqhSOR1JQYfUnLC0G6FvUcsMRnwQHn6WalotXXorq-T-HOG56YMLap2TpLfNhWUYCg0wZnW7Rx_ELTaxkqSxg9vgl7X42SZKGPj-V3lD8iU9jn4Tj8cT61F7isPm_VRTuzEAJqPtAYPdT6BNTqwL5uWSmup1VONO1MDHmojGovfUumkgTq0NEthUiTJGpqSkiUv",
        "weight": "225G",
        "price": 72.00,
        "originalPrice": 85.00,
        "discountPercent": 15
      }
    ],
    "priceDrop": [
      {
        "id": "ned-1",
        "name": "Nescafe 3-in-1 Original | 28g x 10",
        "imageUrl": "https://lh3.googleusercontent.com/aida/AP1WRLuWTX4gd3Qe2QvRjngPXPbLN8xyGdSavjqXWC_ae0NxRRIHQk0_moahBKSXaG7-6NKhwF8TK2Ji2GZuhprom2-ZglgNRlPUQay_Yrpd3hZyI9SspymGhc29zvKbC2JbU_Y8hnnZUlAod_TRwtP6UQQ4j7v8qEm2nsAeggBZI04Vv4FaO0C8pS72mf0JnJ9RSAiPfXYbPXREa_nFTIrmIp_sd93W20hGMiDQJs1x13QWjy5dHJ2Ct8jn5K-M",
        "weight": "280G",
        "price": 78.00,
        "originalPrice": 95.00,
        "discountPercent": 18
      },
      {
        "id": "ned-2",
        "name": "Alaska Condensada Sweetened Milk | 300ml",
        "imageUrl": "https://lh3.googleusercontent.com/aida/AP1WRLuO28H7LnSFCwo6-pvjsInmgsKyKA9gGj7fGNvpHLY3adrsyaZUeSh4CTr8NlpbFCVXmOdCRpkTDYv-JXzqD9neGRX83tKsAhLaLLLSqBmqzXRggB5EpJXyUrnp1rHck4qTs_f0BZwPBNlQjv8l8XdHXNrnQMl1jMWBGDbaCsn3ZwcEMj1gLOzarhvG75mMwkqvqqzE0EHn0jTcnADb3mrrPgPiCa0vyCmy0lnuRsmlgVgWIXjcXmUkmg2f",
        "weight": "300ML",
        "price": 42.00,
        "originalPrice": 52.00,
        "discountPercent": 19
      }
    ]
  },
  {
    "storeId": "sm-aura",
    "featuredProducts": [
      {
        "id": "aura-1",
        "name": "Coco Mama Fresh Gata | 400ml",
        "imageUrl": "https://lh3.googleusercontent.com/aida-public/AB6AXuAHHsHOTFfZnjiLCTMYuYo1NJKhbgdJyNQLBGDEbXtojCVTqyL0nESzmWn74VhhLNkQdNdl1F0bRb17Oqb5wZR1_0H45np-GPJVOtWmOUfukk8obd_5pdTozWnJP52sCxiC_aItW9m-Evz9YPwa3Zsml_QX-EMfYMhqsmiCm64QyMOVZDwO_VEC6erFow5gaA06GpoPKU8gjkF40eiKRhqUUUqLcmi4ndWSCTGrr5W4TpzFrD-D8Jv2vQ",
        "weight": "400ML",
        "price": 58.50
      },
      {
        "id": "aura-2",
        "name": "Gardenia Wheat Bread | 400g",
        "imageUrl": "https://lh3.googleusercontent.com/aida/AP1WRLuceXvpT7wdmQ1XgiqggJ-biiIYvvNHsXijRC1OoJ9r7_DInG1bDaGhe6WA32aakJ-uBlqYKpKifhlapN-eyW8SHs9XehXoRsC6j6lF1PY1QU-NZAUvIG-6xdyLSKeDQpWdZW7pTsR1BAIy6_MC7W3eZ88ncsb4Rn9v49GoFruAPrQc62_hI8ky-7R6FTQxMhgHBmaNeUKrpXIQIEimEWPq37mdkmGDsmXtp7PTXvxNizZe5j9SxVZsyyhu",
        "weight": "400G",
        "price": 58.00
      },
      {
        "id": "aura-3",
        "name": "Argentina Corned Beef | 380g",
        "imageUrl": "https://lh3.googleusercontent.com/aida/AP1WRLuWTX4gd3Qe2QvRjngPXPbLN8xyGdSavjqXWC_ae0NxRRIHQk0_moahBKSXaG7-6NKhwF8TK2Ji2GZuhprom2-ZglgNRlPUQay_Yrpd3hZyI9SspymGhc29zvKbC2JbU_Y8hnnZUlAod_TRwtP6UQQ4j7v8qEm2nsAeggBZI04Vv4FaO0C8pS72mf0JnJ9RSAiPfXYbPXREa_nFTIrmIp_sd93W20hGMiDQJs1x13QWjy5dHJ2Ct8jn5K-M",
        "weight": "380G",
        "price": 78.25,
        "originalPrice": 95.00,
        "discountPercent": 18
      }
    ],
    "priceDrop": [
      {
        "id": "aurad-1",
        "name": "Magnolia All-Purpose Cream | 250ml",
        "imageUrl": "https://lh3.googleusercontent.com/aida-public/AB6AXuAjeja2MY6VFDE3tDupTlJf-a87RlqShBgsJp4SQ2OwNU5Uq_A81RvOVj6Okguno2vuB7DubQsIarMMpuZCee9SN6P_zguw1ea4l7qCP6bW0m_rORoCTeisWIW3UcY-G2tG9J1yisvutx3234A0j7mKeKzRhbG0yZqT8q71QS2vGz3iZDBSyV1z-p5mj72SqtA53giZ9-1wzcNWaXRc9XbF4IeHCXZywQUnnqJR9Nu877wFyo6ty0XL6w",
        "weight": "250ML",
        "price": 46.00,
        "originalPrice": 58.00,
        "discountPercent": 21
      },
      {
        "id": "aurad-2",
        "name": "Del Monte Tomato Sauce | 250g",
        "imageUrl": "https://lh3.googleusercontent.com/aida/AP1WRLuO28H7LnSFCwo6-pvjsInmgsKyKA9gGj7fGNvpHLY3adrsyaZUeSh4CTr8NlpbFCVXmOdCRpkTDYv-JXzqD9neGRX83tKsAhLaLLLSqBmqzXRggB5EpJXyUrnp1rHck4qTs_f0BZwPBNlQjv8l8XdHXNrnQMl1jMWBGDbaCsn3ZwcEMj1gLOzarhvG75mMwkqvqqzE0EHn0jTcnADb3mrrPgPiCa0vyCmy0lnuRsmlgVgWIXjcXmUkmg2f",
        "weight": "250G",
        "price": 22.50,
        "originalPrice": 28.00,
        "discountPercent": 20
      }
    ]
  }
]
```

- [ ] **Step 4: Modify `next.config.ts` — add remotePatterns**

```typescript
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com",
        pathname: "/**",
      },
    ],
  },
};

export default nextConfig;
```

- [ ] **Step 5: Verify dev server starts**

```bash
npm run dev
```

Expected: server starts on port 3000, no TypeScript or config errors.

- [ ] **Step 6: Commit**

```bash
git add src/types/index.ts src/data/stores.json src/data/products.json next.config.ts
git commit -m "feat: add static data, types, and image remote patterns"
```

---

## Task 2: Global CSS — Tailwind v4 Theme Tokens + Layout

**Files:**
- Modify: `src/app/globals.css`
- Modify: `src/app/layout.tsx`

**Interfaces:**
- Produces: CSS custom properties consumed by all components; `--font-hanken` variable for Hanken Grotesk.

---

- [ ] **Step 1: Replace `src/app/globals.css`**

Tailwind v4 uses `@theme` blocks instead of `tailwind.config.js`. All custom tokens from the HTML go here.

```css
@import "tailwindcss";

@theme inline {
  /* Typography */
  --font-sans: var(--font-hanken), 'Hanken Grotesk', sans-serif;

  /* Colors */
  --color-surface:                  #f8f9fa;
  --color-on-background:            #191c1d;
  --color-on-surface:               #191c1d;
  --color-primary-container:        #0046be;
  --color-border-subtle:            #e0e0e0;
  --color-primary-fixed-dim:        #b4c5ff;
  --color-on-primary-container:     #afc1ff;
  --color-inverse-on-surface:       #f0f1f2;
  --color-surface-white:            #ffffff;
  --color-surface-container-high:   #e7e8e9;
  --color-secondary-fixed:          #ffe08b;
  --color-surface-container-lowest: #ffffff;
  --color-inverse-surface:          #2e3132;
  --color-inverse-primary:          #b4c5ff;
  --color-secondary-container:      #fecb00;
  --color-on-tertiary-fixed:        #410002;
  --color-on-error-container:       #93000a;
  --color-on-surface-variant:       #434654;
  --color-surface-dim:              #d9dadb;
  --color-promo-orange:             #ff8f1c;
  --color-secondary-fixed-dim:      #f1c100;
  --color-surface-variant:          #e1e3e4;
  --color-surface-tint:             #2155cc;
  --color-on-secondary:             #ffffff;
  --color-on-primary-fixed:         #00174b;
  --color-tertiary:                 #7a0008;
  --color-on-tertiary-container:    #ffafa7;
  --color-secondary:                #745b00;
  --color-surface-container-highest:#e1e3e4;
  --color-on-error:                 #ffffff;
  --color-primary:                  #00328c;
  --color-outline-variant:          #c3c6d6;
  --color-outline:                  #737685;
  --color-on-tertiary:              #ffffff;
  --color-surface-container:        #edeeef;
  --color-surface-container-low:    #f3f4f5;
  --color-tertiary-fixed:           #ffdad6;
  --color-error:                    #ba1a1a;
  --color-surface-bright:           #f8f9fa;
  --color-error-container:          #ffdad6;
  --color-primary-fixed:            #dbe1ff;
  --color-tertiary-container:       #a60010;
  --color-on-primary-fixed-variant: #003da9;
  --color-text-dark:                #1a1a1a;
  --color-background:               #f8f9fa;
  --color-on-secondary-container:   #6e5700;
  --color-on-secondary-fixed:       #241a00;
  --color-tertiary-fixed-dim:       #ffb4ab;
  --color-on-primary:               #ffffff;

  /* Spacing */
  --spacing-margin-desktop:  40px;
  --spacing-margin-mobile:   16px;
  --spacing-stack-sm:        4px;
  --spacing-stack-md:        12px;
  --spacing-stack-lg:        24px;
  --spacing-gutter-desktop:  24px;
  --spacing-gutter-mobile:   16px;
}

body {
  background-color: var(--color-background);
  color: var(--color-on-background);
  font-family: var(--font-sans);
}

/* Sidebar custom scrollbar */
.custom-scrollbar::-webkit-scrollbar       { width: 6px; }
.custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
.custom-scrollbar::-webkit-scrollbar-thumb {
  background-color: #e0e0e0;
  border-radius: 10px;
}

/* Chat modal message area — hide scrollbar */
.no-scrollbar::-webkit-scrollbar { display: none; }
.no-scrollbar {
  -ms-overflow-style: none;
  scrollbar-width: none;
}

/* Material Symbols variants */
.material-symbols-outlined {
  font-variation-settings: 'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24;
}
.material-symbols-outlined.fill {
  font-variation-settings: 'FILL' 1, 'wght' 400, 'GRAD' 0, 'opsz' 24;
}
```

- [ ] **Step 2: Replace `src/app/layout.tsx`**

```tsx
import type { Metadata } from "next";
import { Hanken_Grotesk } from "next/font/google";
import "./globals.css";

const hankenGrotesk = Hanken_Grotesk({
  subsets: ["latin"],
  weight: ["400", "600", "700"],
  variable: "--font-hanken",
  display: "swap",
});

export const metadata: Metadata = {
  title: "SM Markets",
  description: "Shop groceries online at SM Markets – fresh produce, meat, dairy and more delivered to your door.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${hankenGrotesk.variable} h-full`}>
      <head>
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200&display=swap"
        />
      </head>
      <body className="min-h-full flex flex-col">
        {children}
      </body>
    </html>
  );
}
```

- [ ] **Step 3: Start dev server and verify Hanken Grotesk loads**

```bash
npm run dev
```

Open `http://localhost:3000` → DevTools → Elements → body → Computed → `font-family` should show `Hanken Grotesk`.

- [ ] **Step 4: Commit**

```bash
git add src/app/globals.css src/app/layout.tsx
git commit -m "feat: Tailwind v4 theme tokens, Hanken Grotesk, Material Symbols"
```

---

## Task 3: Shared Components — TopNavBar, StorePicker, SideNavBar

**Files:**
- Create: `src/components/TopNavBar.tsx`
- Create: `src/components/StorePicker.tsx`
- Create: `src/components/SideNavBar.tsx`

**Interfaces:**
- Consumes: `Store` from `@/types`
- `TopNavBar` props: `{ stores: Store[]; selectedStoreId: string; onStoreChange: (id: string) => void }`
- `StorePicker` props: `{ stores: Store[]; selectedStoreId: string; onSelect: (id: string) => void; onClose: () => void }`
- `SideNavBar` props: none
- Produces: exported React components

---

- [ ] **Step 1: Create `src/components/StorePicker.tsx`**

```tsx
'use client';

import { useEffect, useRef } from 'react';
import type { Store } from '@/types';

interface StorePickerProps {
  stores: Store[];
  selectedStoreId: string;
  onSelect: (id: string) => void;
  onClose: () => void;
}

export default function StorePicker({ stores, selectedStoreId, onSelect, onClose }: StorePickerProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        onClose();
      }
    }
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [onClose]);

  return (
    <div
      ref={ref}
      className="absolute top-full left-0 mt-1 bg-white rounded-lg shadow-xl border border-[var(--color-border-subtle)] z-50 min-w-[220px] overflow-hidden"
      role="listbox"
      aria-label="Select store branch"
    >
      {stores.map((store) => (
        <button
          key={store.id}
          role="option"
          aria-selected={store.id === selectedStoreId}
          onClick={() => { onSelect(store.id); onClose(); }}
          className={`w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-[var(--color-surface-container-high)] transition-colors ${
            store.id === selectedStoreId
              ? 'bg-[var(--color-primary-fixed)] text-[var(--color-primary)] font-semibold'
              : 'text-[var(--color-on-surface)]'
          }`}
        >
          <span className="material-symbols-outlined text-[var(--color-primary)] text-lg">location_on</span>
          <div>
            <div className="text-sm font-semibold leading-tight">{store.name}</div>
            <div className="text-xs text-[var(--color-on-surface-variant)] leading-tight">{store.city}</div>
          </div>
          {store.id === selectedStoreId && (
            <span className="material-symbols-outlined text-[var(--color-primary)] text-base ml-auto">check</span>
          )}
        </button>
      ))}
    </div>
  );
}
```

- [ ] **Step 2: Create `src/components/TopNavBar.tsx`**

```tsx
'use client';

import { useState } from 'react';
import type { Store } from '@/types';
import StorePicker from './StorePicker';

interface TopNavBarProps {
  stores: Store[];
  selectedStoreId: string;
  onStoreChange: (id: string) => void;
}

export default function TopNavBar({ stores, selectedStoreId, onStoreChange }: TopNavBarProps) {
  const [isPickerOpen, setIsPickerOpen] = useState(false);
  const selectedStore = stores.find((s) => s.id === selectedStoreId) ?? stores[0];

  return (
    <header className="bg-[var(--color-primary)] text-[var(--color-on-primary)] sticky top-0 z-50 flex justify-between items-center w-full h-16 px-10 shadow-md border-b border-white/10">
      {/* Logo */}
      <div className="flex items-center gap-4">
        <a href="#" className="flex items-center" aria-label="SM Markets home">
          <span className="text-2xl font-bold text-white tracking-tight">SM MARKETS</span>
        </a>

        {/* Store picker */}
        <div className="relative">
          <button
            id="store-picker-trigger"
            onClick={() => setIsPickerOpen((v) => !v)}
            className="flex items-center gap-2 border border-white/30 rounded px-3 py-1.5 hover:bg-[var(--color-primary-container)] transition-colors duration-200"
            aria-haspopup="listbox"
            aria-expanded={isPickerOpen}
          >
            <span className="material-symbols-outlined text-white text-xl">location_on</span>
            <div className="flex flex-col text-left">
              <span className="text-[12px] font-bold text-white leading-tight">{selectedStore.name}</span>
              <span className="text-[10px] text-white/80 leading-tight">{selectedStore.city}</span>
            </div>
            <span className="material-symbols-outlined text-white text-sm ml-1">
              {isPickerOpen ? 'expand_less' : 'expand_more'}
            </span>
          </button>
          {isPickerOpen && (
            <StorePicker
              stores={stores}
              selectedStoreId={selectedStoreId}
              onSelect={onStoreChange}
              onClose={() => setIsPickerOpen(false)}
            />
          )}
        </div>
      </div>

      {/* Search */}
      <div className="flex-1 max-w-2xl px-6 relative">
        <input
          type="text"
          id="search-input"
          placeholder="Search for products..."
          className="w-full h-10 pl-4 pr-10 rounded text-[var(--color-on-surface)] bg-white border-none focus:ring-2 focus:ring-[var(--color-secondary-container)] text-sm"
        />
        <button
          className="absolute right-8 top-1/2 -translate-y-1/2 text-[var(--color-on-surface-variant)] hover:text-[var(--color-primary)] transition-colors"
          aria-label="Search"
        >
          <span className="material-symbols-outlined">search</span>
        </button>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-4">
        <button
          id="login-btn"
          className="flex items-center gap-2 bg-white text-[var(--color-primary)] px-4 py-2 rounded font-bold text-xs hover:bg-[var(--color-surface-container-high)] transition-colors"
        >
          <span className="material-symbols-outlined text-sm">person</span>
          Login or Register
        </button>
        <button
          id="cart-btn"
          className="relative hover:bg-[var(--color-primary-container)] p-2 rounded transition-colors duration-200 text-white opacity-90"
          aria-label="Shopping cart"
        >
          <span className="material-symbols-outlined">shopping_cart</span>
        </button>
      </div>
    </header>
  );
}
```

- [ ] **Step 3: Create `src/components/SideNavBar.tsx`**

```tsx
// Server Component — no 'use client' needed

const CATEGORIES = [
  { icon: 'verified',       label: 'Only in SM Markets' },
  { icon: 'nutrition',      label: 'Fresh Produce' },
  { icon: 'restaurant',     label: 'Fresh Meat & Seafood' },
  { icon: 'icecream',       label: 'Frozen Goods' },
  { icon: 'microwave',      label: 'Ready To Heat & Eat Items' },
  { icon: 'cooking',        label: 'Ready To Cook' },
  { icon: 'egg_alt',        label: 'Chilled & Dairy Items' },
  { icon: 'bakery_dining',  label: 'Bakery' },
] as const;

export default function SideNavBar() {
  return (
    <aside className="fixed left-0 top-16 h-[calc(100vh-64px)] hidden md:flex flex-col bg-[var(--color-surface)] border-r border-[var(--color-border-subtle)] w-64 overflow-y-auto custom-scrollbar z-40">
      {/* Promo banner */}
      <div className="p-4 border-b border-[var(--color-border-subtle)]">
        <div className="w-full aspect-[2/1] rounded overflow-hidden mb-4 bg-gradient-to-br from-[var(--color-secondary-container)] to-[var(--color-promo-orange)] flex items-center justify-center">
          <span className="text-xs font-bold text-[var(--color-primary)] text-center px-2">SM Price Drop Promos</span>
        </div>
        <h3 className="text-lg font-bold text-[var(--color-primary)] mb-1">For you</h3>
        <p className="text-sm text-[var(--color-on-surface-variant)]">Browse our daily selections</p>
      </div>

      {/* Quick links */}
      <div className="py-2 border-b border-[var(--color-border-subtle)]">
        {[
          { icon: 'menu_book', label: 'Recipe' },
          { icon: 'article',   label: 'Blog' },
        ].map(({ icon, label }) => (
          <a
            key={label}
            href="#"
            className="flex items-center gap-3 py-3 px-4 text-[var(--color-on-surface-variant)] hover:bg-[var(--color-surface-container-high)] transition-all"
          >
            <span className="material-symbols-outlined text-[var(--color-primary)]">{icon}</span>
            <span className="text-sm font-semibold">{label}</span>
          </a>
        ))}
      </div>

      {/* Categories */}
      <div className="py-4">
        <h4 className="px-4 text-base font-bold text-[var(--color-primary)] mb-2">Categories</h4>
        <nav aria-label="Product categories">
          {CATEGORIES.map(({ icon, label }) => (
            <a
              key={label}
              href="#"
              className="flex items-center gap-3 py-3 px-4 text-[var(--color-on-surface-variant)] hover:bg-[var(--color-surface-container-high)] transition-all group"
            >
              <span className="material-symbols-outlined text-[var(--color-primary)] group-hover:scale-110 transition-transform">
                {icon}
              </span>
              <span className="text-sm font-semibold">{label}</span>
            </a>
          ))}
        </nav>
      </div>
    </aside>
  );
}
```

- [ ] **Step 4: Commit**

```bash
git add src/components/TopNavBar.tsx src/components/StorePicker.tsx src/components/SideNavBar.tsx
git commit -m "feat: TopNavBar, StorePicker, and SideNavBar components"
```

---

## Task 4: Product Components — ProductCard + ProductGrid

**Files:**
- Create: `src/components/ProductCard.tsx`
- Create: `src/components/ProductGrid.tsx`

**Interfaces:**
- Consumes: `Product` from `@/types`
- `ProductCard` props: `{ product: Product }`
- `ProductGrid` props: `{ title: string; products: Product[]; sectionClassName?: string; titleClassName?: string }`
- Produces: grid-layout product display used in `HomeClient.tsx`

---

- [ ] **Step 1: Create `src/components/ProductCard.tsx`**

```tsx
// Server Component
import Image from 'next/image';
import type { Product } from '@/types';

interface ProductCardProps {
  product: Product;
}

export default function ProductCard({ product }: ProductCardProps) {
  const { name, imageUrl, weight, price, originalPrice, discountPercent } = product;
  const isOnSale = Boolean(discountPercent && originalPrice);

  return (
    <div className="bg-white border border-[var(--color-border-subtle)] rounded-lg p-4 flex flex-col h-full hover:shadow-md transition-shadow">
      {/* Image */}
      <div className="aspect-square mb-4 relative bg-[var(--color-surface-container-low)] rounded p-2">
        <Image
          src={imageUrl}
          alt={name}
          fill
          className="object-contain p-2"
          sizes="(max-width: 768px) 50vw, (max-width: 1024px) 33vw, 20vw"
        />
      </div>

      <div className="flex-1 flex flex-col">
        {/* Badges */}
        <div className="flex gap-2 mb-2 flex-wrap">
          <span className="bg-[var(--color-primary-fixed)] text-[var(--color-primary)] px-2 py-0.5 rounded text-[10px] font-bold">
            {weight}
          </span>
          {isOnSale && (
            <span className="bg-[var(--color-promo-orange)] text-white px-2 py-0.5 rounded text-[10px] font-bold">
              {discountPercent}% OFF
            </span>
          )}
        </div>

        {/* Name */}
        <h3 className="text-sm text-[var(--color-on-surface)] font-semibold line-clamp-2 mb-2 flex-1 min-h-[40px]">
          {name}
        </h3>

        {/* Price */}
        <div className="mb-4 flex items-center gap-2">
          <span className={`text-lg font-bold ${isOnSale ? 'text-[var(--color-promo-orange)]' : 'text-[var(--color-on-surface)]'}`}>
            ₱{price.toFixed(2)}
          </span>
          {isOnSale && originalPrice && (
            <span className="text-xs text-[var(--color-on-surface-variant)] line-through">
              ₱{originalPrice.toFixed(2)}
            </span>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-2 mt-auto">
          <button
            className="flex-1 bg-[var(--color-primary)] text-white rounded font-bold text-xs py-2 hover:bg-[var(--color-primary-container)] transition-colors"
            aria-label={`Add ${name} to cart`}
          >
            Add to Cart
          </button>
          <button
            className="w-10 h-10 border border-[var(--color-border-subtle)] rounded flex items-center justify-center text-[var(--color-primary)] hover:bg-[var(--color-surface-container)] transition-colors"
            aria-label={`Add ${name} to favourites`}
          >
            <span className="material-symbols-outlined text-xl">favorite</span>
          </button>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Create `src/components/ProductGrid.tsx`**

```tsx
// Server Component
import type { Product } from '@/types';
import ProductCard from './ProductCard';

interface ProductGridProps {
  title: string;
  products: Product[];
  sectionClassName?: string;
  titleClassName?: string;
}

export default function ProductGrid({
  title,
  products,
  sectionClassName = '',
  titleClassName = 'text-[var(--color-primary)]',
}: ProductGridProps) {
  return (
    <section className={`rounded-lg p-6 relative ${sectionClassName}`}>
      <h2 className={`text-3xl font-bold mb-6 ${titleClassName}`}>{title}</h2>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {products.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </section>
  );
}
```

- [ ] **Step 3: Commit**

```bash
git add src/components/ProductCard.tsx src/components/ProductGrid.tsx
git commit -m "feat: ProductCard and ProductGrid components"
```

---

## Task 5: Chat Modal + FAB

**Files:**
- Create: `src/components/ChatModal.tsx`
- Create: `src/components/ChatFAB.tsx`

**Interfaces:**
- `ChatModal` props: `{ isOpen: boolean; onClose: () => void }`
- `ChatFAB` props: `{ onClick: () => void; isOpen: boolean }`
- Produces: exported client components used in `HomeClient.tsx`

---

- [ ] **Step 1: Create `src/components/ChatModal.tsx`**

```tsx
'use client';

import { useEffect, useRef } from 'react';

interface ChatModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const SUGGESTION_CHIPS = ['Track Order', 'Latest Promos', 'Store Hours'];

export default function ChatModal({ isOpen, onClose }: ChatModalProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (isOpen) textareaRef.current?.focus();
  }, [isOpen]);

  useEffect(() => {
    function handler(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [onClose]);

  return (
    <>
      {/* Backdrop */}
      <div
        aria-hidden="true"
        onClick={onClose}
        className={`fixed inset-0 bg-black/40 backdrop-blur-sm z-40 transition-opacity duration-300 ${
          isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
      />

      {/* Chat panel — slides in from right */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label="SM Markets Assistant"
        className={`fixed top-0 right-0 w-full max-w-md h-full bg-white shadow-2xl z-50 flex flex-col border-l border-[var(--color-border-subtle)] transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {/* Header */}
        <div className="bg-[var(--color-primary)] text-white p-4 flex justify-between items-center shrink-0 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center relative shrink-0">
              <span className="material-symbols-outlined fill text-[var(--color-primary)] text-lg">smart_toy</span>
              <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full" />
            </div>
            <div>
              <h2 className="text-lg font-bold leading-tight">SM Markets Assistant</h2>
              <span className="text-xs text-[var(--color-primary-fixed-dim)]">Online • Usually replies in minutes</span>
            </div>
          </div>
          <button
            id="chat-close-btn"
            aria-label="Close chat"
            onClick={onClose}
            className="text-white/80 hover:text-white p-1 rounded-full hover:bg-white/10 transition-colors"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto no-scrollbar p-4 bg-[var(--color-surface)] flex flex-col gap-4">
          <div className="text-center">
            <span className="text-[10px] text-[var(--color-on-surface-variant)] font-bold uppercase tracking-wider bg-[var(--color-surface-container-high)] px-2 py-1 rounded-full">
              Today, 10:42 AM
            </span>
          </div>

          {/* Bot greeting */}
          <div className="flex gap-2 max-w-[85%] self-start">
            <div className="w-8 h-8 rounded-full bg-[var(--color-primary-fixed)] flex items-center justify-center shrink-0">
              <span className="material-symbols-outlined text-[var(--color-primary)] text-sm fill">smart_toy</span>
            </div>
            <div className="bg-white p-3 rounded-2xl rounded-tl-none shadow-sm border border-[var(--color-border-subtle)] text-sm text-[var(--color-on-surface)]">
              <p>Hello! 👋 Welcome to SM Markets. How can I help you with your groceries today?</p>
            </div>
          </div>

          {/* Suggestion chips */}
          <div className="flex gap-2 max-w-[85%] self-start pl-10 flex-wrap">
            {SUGGESTION_CHIPS.map((chip) => (
              <button
                key={chip}
                className="text-xs bg-white border border-[var(--color-primary)] text-[var(--color-primary)] px-3 py-1.5 rounded-full hover:bg-[var(--color-primary)] hover:text-white transition-colors font-medium"
              >
                {chip}
              </button>
            ))}
          </div>

          {/* User message */}
          <div className="flex gap-2 max-w-[85%] self-end">
            <div className="bg-[var(--color-primary)] text-white p-3 rounded-2xl rounded-tr-none shadow-sm text-sm">
              <p>Do you have any fresh salmon available at the selected store?</p>
            </div>
          </div>

          {/* Typing indicator */}
          <div className="flex gap-2 max-w-[85%] self-start">
            <div className="w-8 h-8 rounded-full bg-[var(--color-primary-fixed)] flex items-center justify-center shrink-0">
              <span className="material-symbols-outlined text-[var(--color-primary)] text-sm fill">smart_toy</span>
            </div>
            <div className="bg-white p-3 rounded-2xl rounded-tl-none shadow-sm border border-[var(--color-border-subtle)] flex items-center gap-1 h-10 w-16">
              {[0, 0.15, 0.3].map((delay, i) => (
                <div
                  key={i}
                  className="w-2 h-2 bg-[var(--color-primary)]/40 rounded-full animate-bounce"
                  style={{ animationDelay: `${delay}s` }}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Input */}
        <div className="bg-white p-3 border-t border-[var(--color-border-subtle)] shrink-0">
          <div className="flex items-end gap-2 bg-[var(--color-surface-container-low)] rounded-xl border border-[var(--color-outline-variant)] focus-within:border-[var(--color-primary)] focus-within:ring-1 focus-within:ring-[var(--color-primary)] p-1 transition-all">
            <button className="p-2 text-[var(--color-outline)] hover:text-[var(--color-primary)] transition-colors shrink-0 rounded-full hover:bg-[var(--color-surface-variant)]" aria-label="Attach file">
              <span className="material-symbols-outlined">attach_file</span>
            </button>
            <textarea
              ref={textareaRef}
              id="chat-input"
              className="w-full bg-transparent border-none focus:ring-0 resize-none text-sm py-2 px-1 max-h-32 text-[var(--color-on-surface)]"
              placeholder="Type your message..."
              rows={1}
              style={{ minHeight: '40px' }}
            />
            <button
              id="chat-send-btn"
              className="p-2 bg-[var(--color-primary)] text-white rounded-full hover:bg-[var(--color-primary-container)] transition-colors shrink-0 mb-0.5 mr-0.5 flex items-center justify-center"
              aria-label="Send message"
            >
              <span className="material-symbols-outlined text-sm">send</span>
            </button>
          </div>
          <div className="text-center mt-2">
            <span className="text-[10px] text-[var(--color-outline)]">Powered by SM Assistant AI</span>
          </div>
        </div>
      </div>
    </>
  );
}
```

- [ ] **Step 2: Create `src/components/ChatFAB.tsx`**

```tsx
'use client';

interface ChatFABProps {
  onClick: () => void;
  isOpen: boolean;
}

export default function ChatFAB({ onClick, isOpen }: ChatFABProps) {
  return (
    <button
      id="chat-fab"
      onClick={onClick}
      aria-label={isOpen ? 'Close chat assistant' : 'Open chat assistant'}
      aria-expanded={isOpen}
      className="fixed bottom-8 right-8 w-14 h-14 bg-[var(--color-primary)] text-white rounded-full shadow-lg flex items-center justify-center hover:bg-[var(--color-primary-container)] transition-transform hover:scale-105 z-30"
    >
      <span className="material-symbols-outlined fill text-3xl">
        {isOpen ? 'close' : 'chat_bubble'}
      </span>
    </button>
  );
}
```

- [ ] **Step 3: Commit**

```bash
git add src/components/ChatModal.tsx src/components/ChatFAB.tsx
git commit -m "feat: ChatModal slide-in panel and ChatFAB"
```

---

## Task 6: Page Assembly — HomeClient + page.tsx

**Files:**
- Create: `src/app/HomeClient.tsx`
- Modify: `src/app/page.tsx`

**Interfaces:**
- Consumes: `Store[]` and `StoreProducts[]` from JSON imports; all components from Tasks 3–5
- `HomeClient` props: `{ stores: Store[]; allStoreProducts: StoreProducts[] }`
- `page.tsx`: Server Component — loads JSON, passes to `HomeClient`

---

- [ ] **Step 1: Create `src/app/HomeClient.tsx`**

```tsx
'use client';

import { useState } from 'react';
import type { Store, StoreProducts } from '@/types';
import TopNavBar from '@/components/TopNavBar';
import SideNavBar from '@/components/SideNavBar';
import ProductGrid from '@/components/ProductGrid';
import ChatModal from '@/components/ChatModal';
import ChatFAB from '@/components/ChatFAB';

const DEFAULT_STORE_ID = 'sm-megamall';

interface HomeClientProps {
  stores: Store[];
  allStoreProducts: StoreProducts[];
}

export default function HomeClient({ stores, allStoreProducts }: HomeClientProps) {
  const [selectedStoreId, setSelectedStoreId] = useState(DEFAULT_STORE_ID);
  const [isChatOpen, setIsChatOpen] = useState(false);

  const storeData = allStoreProducts.find((sp) => sp.storeId === selectedStoreId)
    ?? allStoreProducts[0];

  return (
    <div className="flex flex-col min-h-screen">
      <TopNavBar
        stores={stores}
        selectedStoreId={selectedStoreId}
        onStoreChange={setSelectedStoreId}
      />

      <div className="flex flex-1 overflow-hidden">
        <SideNavBar />

        {/* Main content — blurs when chat is open */}
        <main
          className={`flex-1 md:ml-64 p-10 overflow-y-auto bg-[var(--color-surface-bright)] transition-all duration-300 ${
            isChatOpen ? 'blur-sm pointer-events-none select-none' : ''
          }`}
        >
          <ProductGrid
            title="Featured Products"
            products={storeData.featuredProducts}
            sectionClassName="bg-[var(--color-secondary-container)] mb-8"
            titleClassName="text-[var(--color-primary)]"
          />
          <ProductGrid
            title="SM Price Drop"
            products={storeData.priceDrop}
            sectionClassName="bg-[var(--color-error)]"
            titleClassName="text-white"
          />
        </main>
      </div>

      <ChatFAB onClick={() => setIsChatOpen((v) => !v)} isOpen={isChatOpen} />
      <ChatModal isOpen={isChatOpen} onClose={() => setIsChatOpen(false)} />
    </div>
  );
}
```

- [ ] **Step 2: Replace `src/app/page.tsx`**

```tsx
// Server Component
import type { Store, StoreProducts } from '@/types';
import storesData from '@/data/stores.json';
import productsData from '@/data/products.json';
import HomeClient from './HomeClient';

export default function Home() {
  const stores = storesData as Store[];
  const allStoreProducts = productsData as StoreProducts[];

  return <HomeClient stores={stores} allStoreProducts={allStoreProducts} />;
}
```

- [ ] **Step 3: Verify `@/*` path alias in `tsconfig.json`**

Open `tsconfig.json` and confirm this exists under `compilerOptions`:

```json
"paths": {
  "@/*": ["./src/*"]
}
```

If missing, add it. Next.js create-next-app includes this by default.

- [ ] **Step 4: Run dev server and manually verify all acceptance criteria**

```bash
npm run dev
```

Open `http://localhost:3000` and check:

1. ✅ Page loads with SM Megamall (Mandaluyong) selected by default.
2. ✅ Clicking the store button opens a dropdown listing all 4 branches.
3. ✅ Selecting SM Mall of Asia changes the featured and price-drop products to MOA-specific items.
4. ✅ Chat FAB is visible at bottom-right.
5. ✅ Clicking FAB opens the chat panel sliding in from the right.
6. ✅ Background content blurs when chat is open.
7. ✅ Clicking the backdrop or pressing Escape closes the chat.
8. ✅ Hanken Grotesk font applies globally.
9. ✅ Material Symbols icons render correctly (location_on, shopping_cart, etc.)
10. ✅ No TypeScript errors in terminal.

- [ ] **Step 5: Commit**

```bash
git add src/app/HomeClient.tsx src/app/page.tsx
git commit -m "feat: assemble home page with branch-aware product grid and chat modal"
```

---

## Self-Review Checklist

### Spec Coverage

| Requirement | Task |
|---|---|
| Convert HTML to Next.js React | Tasks 3–6 |
| Static data in JSON files | Task 1 |
| Products change by selected store branch | Task 6 (`HomeClient` `useState`) |
| Default branch pre-selected | `DEFAULT_STORE_ID = 'sm-megamall'` in `HomeClient` |
| Chat modal overlay (second HTML file) | Task 5 |
| Background blurs when chat is open | `HomeClient` `blur-sm` conditional class |
| Follow Next.js App Router standards | Server Components default, `'use client'` only for state/events |
| Tailwind v4 `@theme` tokens | Task 2 |
| Hanken Grotesk via `next/font/google` | Task 2 |
| Material Symbols via `<link>` | Task 2 |
| `next/image` with `remotePatterns` | Task 1 |
| TypeScript types for all data shapes | Task 1 |

### Type Consistency

- `Store`, `Product`, `StoreProducts` defined once in `src/types/index.ts`.
- `ProductCard` consumes `Product`. `ProductGrid` consumes `Product[]`. `HomeClient` consumes `Store[]` and `StoreProducts[]`. `TopNavBar` and `StorePicker` consume `Store[]`. All consistent.

### Placeholder Scan

All code blocks are complete and runnable. No TBDs, TODOs, or "similar to Task N" references.
