# CareerLogic AI — Next.js Theme

A drop-in, dark-first design system extracted from the **CareerLogic AI**
portfolio UI. Warm near-black canvas, crimson + deep-maroon brand reds, cream
editorial type, heavy condensed display headings. Built for **Next.js +
Tailwind + shadcn/ui**.

## 1. Install

Copy these into your project:

```
styles/globals.css          → your styles folder
lib/fonts.ts, tokens.ts, utils.ts → your lib folder
components/ui/*              → your components/ui folder
```

Dependencies (already present in most shadcn projects):

```bash
npm i clsx tailwind-merge
```

Fonts (Anton + Inter) are pulled by `next/font/google` at build time — nothing
to install.

> Path aliases: components import from `@/lib/utils`. If your alias differs,
> either add `"@/*": ["./*"]` in `tsconfig.json` or find-replace `@/`.

## 2. Wire fonts + styles in your root layout

```tsx
// app/layout.tsx
import "@/styles/globals.css";
import { fontDisplay, fontSans } from "@/lib/fonts";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${fontDisplay.variable} ${fontSans.variable}`}
    >
      <body>{children}</body>
    </html>
  );
}
```

## 3. Tailwind v4 vs v3

- **Tailwind v4 (default / recommended):** use `styles/globals.css`. Tokens live
  in CSS via `@theme inline` — no JS config needed. Delete `tailwind.config.ts`
  and `globals.v3.css`.
- **Tailwind v3:** use `styles/globals.v3.css` **and** `tailwind.config.ts`
  (merge its `theme.extend` into your existing config). Delete `globals.css`.

Either way you get utilities like `bg-background`, `bg-card`, `text-primary`,
`text-muted`, `border-border`, `font-display`, `rounded-2xl`.

## 4. Use it

```tsx
import {
  Button, Card, CardHeader, CardTitle, CardContent,
  Badge, TechPill, SectionLabel, AccentRule, StatCard, ProgressBar, NavItem,
} from "@/components/ui";

<Badge tone="featured" dot>Featured Project</Badge>

<h1 className="font-display text-6xl text-foreground">CareerLogic AI</h1>
<SectionLabel accent>AI-Powered Resume Builder</SectionLabel>
<AccentRule className="mt-4" />

<Button variant="primary">View Case Study</Button>   {/* deep maroon */}
<Button variant="cream">Download Resume</Button>       {/* inverted cream */}
<Button variant="icon" aria-label="Next">→</Button>

<Card glow className="p-6">
  <CardHeader><CardTitle>Key Strengths</CardTitle></CardHeader>
  <CardContent className="space-y-4">
    <ProgressBar label="Skills Match" value={90} />
    <ProgressBar label="Keyword Usage" value={80} />
  </CardContent>
</Card>

<div className="flex flex-wrap gap-2">
  {["Next.js","TypeScript","Tailwind CSS","Groq API"].map((t) => (
    <TechPill key={t}>{t}</TechPill>
  ))}
</div>

<StatCard value="3K+" label="Users" />
<StatCard value="95%" label="Satisfaction" />
```

Handy utility classes from `globals.css`:

- `label-overline` — tracked-out uppercase micro-label
- `glow-radial` — the maroon radial wash behind hero panels
- `ring-brand` — crimson focus ring (already on Button/NavItem)

## 5. Rebrand in one place

- **Colors:** edit the `:root` block in `globals.css` (or `globals.v3.css`).
  `lib/tokens.ts` mirrors the same hex for JS usage — keep them in sync.
- **Fonts:** change the two exports in `lib/fonts.ts`. For a Vercel-native
  look, swap Anton → `geist` or `Archivo` (weight 800/900).

## File map

```
styles/
├── globals.css        # Tailwind v4 tokens + base + utilities  (primary)
└── globals.v3.css     # Tailwind v3 fallback
tailwind.config.ts     # Tailwind v3 token mapping (v3 only)
lib/
├── fonts.ts           # next/font — Anton (display) + Inter (sans)
├── tokens.ts          # raw hex tokens + radius/font tokens for JS
└── utils.ts           # cn()
components/ui/
├── index.ts           # barrel export
├── button.tsx         # maroon / crimson / ghost / cream / icon
├── badge.tsx          # Badge (featured pill) + TechPill
├── card.tsx           # Card (+ glow) + Header/Content/Title
├── section-label.tsx  # tracked uppercase label + AccentRule
├── stat-card.tsx      # PROJECT HIGHLIGHTS metric tile
├── progress-bar.tsx   # Key Strengths meter
└── nav-item.tsx       # sidebar row with active crimson state
```

## Notes / honest edges

- Tokens use **full hex** in the CSS variables (not shadcn's bare-HSL-channel
  format). Cleaner and portable; if you're merging into an existing shadcn
  theme that expects `hsl(var(--x))`, match that project's format instead.
- **Anton is my closest read** of the display face in the mockups. If it's not
  exact, it's a one-line swap in `lib/fonts.ts`.
- The green accents in the mockup are third-party tech logos (React/Node/Mongo),
  not part of the palette, so they're intentionally excluded.
