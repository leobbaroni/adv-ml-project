# Design Language

Premium-but-restrained. Linear/Vercel/Stripe energy with one tasteful 3D moment. App is branded as "Rental Buddy".

## Palette

- **Background**: white `#FFFFFF` (light) / near-black `#09090B` (dark)
- **Surface**: `#F4F4F5` (light) / `#18181B` (dark)
- **Border**: `#E4E4E7` (light) / `#27272A` (dark)
- **Text**: `#18181B` primary / `#71717A` secondary (light) vs `#FAFAFA` primary / `#A1A1AA` secondary (dark)
- **Accent**: Indigo `#4F46E5` (light) / `#6366F1` (dark) for actions and focus rings.
- **Semantic**:
  - success `#10B981`
  - warning `#F59E0B`
  - danger `#EF4444` (overlap highlights)
  - info `#3B82F6`

Theme default relies on `prefers-color-scheme` via `next-themes`, with a header toggle.

## Typography

- UI: **Inter** (variable font, 400 / 500 / 600).
- Numbers in tables: **JetBrains Mono** (tabular figures).
- Display headings: Inter at -2% letter-spacing, weight 600.

## Spacing & layout

- 4px base unit. Use Tailwind's default scale.
- Page gutter: 24px on mobile, 48px on desktop.
- Card radius: 16px. Button radius: 10px. Pill radius: 9999px.

## Motion

- Framer Motion. Default transition: `{ type: 'spring', stiffness: 260, damping: 26 }`.
- Page transitions: fade + 4px y-translate. Never more than 200ms.
- List items: stagger 30ms.
- Reduced motion is respected (`prefers-reduced-motion`).

## 3D moment

- Spline integration on the dashboard hero.
- Lazy-loaded via `next/dynamic`, `ssr: false`.
- Uses `<spline-viewer>` custom element.

## Components

- shadcn/ui primitives (Button, Card, Dialog, Sheet, Table, Tabs, Toast).
- Calendar: custom (we render a month grid). Not from a library.
- Print stylesheet: hide nav/buttons, force light palette, 8.5x11 friendly.

## Iconography

- `lucide-react` only.
