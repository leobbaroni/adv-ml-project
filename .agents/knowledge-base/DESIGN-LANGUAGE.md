# Design Language

Premium-but-restrained. Linear/Vercel/Stripe energy with one tasteful 3D moment.

## Palette

- **Background**: near-black `#0A0A0B` (dashboard) / pure white `#FFFFFF` (print views)
- **Surface**: `#111114` with `#1F1F23` borders
- **Text**: `#F4F4F5` primary / `#A1A1AA` secondary
- **Accent**: warm amber `#F59E0B` (action, focus rings)
- **Semantic**:
  - success `#10B981`
  - warning `#F59E0B`
  - danger `#EF4444` (overlap highlights)
  - info `#3B82F6`

Light mode is supported via `next-themes` but the default is dark.

## Typography

- UI: **Inter** (variable font, 400 / 500 / 600).
- Numbers in tables: **JetBrains Mono** (tabular figures).
- Display headings: Inter at -2% letter-spacing, weight 600.

## Spacing & layout

- 4px base unit. Use Tailwind's default scale.
- Page gutter: 24px on mobile, 48px on desktop.
- Card radius: 12px. Button radius: 8px. Pill radius: 9999px.

## Motion

- Framer Motion. Default transition: `{ type: 'spring', stiffness: 260, damping: 26 }`.
- Page transitions: fade + 4px y-translate. Never more than 200ms.
- List items: stagger 30ms.
- Reduced motion is respected (`prefers-reduced-motion`).

## 3D moment

- One R3F scene on the dashboard hero: a slowly rotating low-poly house with soft shadow.
- Lazy-loaded (`next/dynamic`, `ssr: false`).
- Falls back to a static SVG silhouette if WebGL unavailable.
- Pauses on tab blur. Max 60fps. Budget: <40kb gzip including drei deps used.

## Components

- shadcn/ui primitives (Button, Card, Dialog, Sheet, Table, Tabs, Toast).
- Calendar: custom (we render a month grid). Not from a library.
- Print stylesheet: hide nav/buttons, force light palette, 8.5x11 friendly.

## Iconography

- `lucide-react` only.
