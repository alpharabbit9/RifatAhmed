# Portfolio Design System
## Rifat Ahmed — Burgundy Wine / Soft Cream / Deep Black

A premium editorial design system for a developer portfolio combining **dark luxury**, **editorial typography**, and **modern developer UI**.

The visual direction is inspired by high-end fashion/editorial layouts while remaining technical, minimal, and suitable for a Full Stack Developer + AI Agent Builder portfolio.

---

## 1. Design Direction

### Core Aesthetic

- Dark editorial
- Premium / luxury
- Masculine and understated
- High contrast
- Burgundy accents
- Soft cream typography
- Deep black surfaces
- Subtle grain and texture
- Large condensed display typography
- Minimal UI chrome
- Thin borders and precise spacing

### Brand Personality

**Confident · Technical · Creative · Refined · Experimental**

The portfolio should feel like a **designer/developer personal brand**, not a generic SaaS dashboard.

---

# 2. Color System

## Primary Palette

| Name | HEX | RGB | Usage |
|---|---|---|---|
| Burgundy Wine | `#5B0F18` | 91, 15, 24 | Primary brand accent, active states, highlights |
| Soft Cream | `#F8F1E7` | 248, 241, 231 | Main headings, primary text, light surfaces |
| Deep Black | `#0B0B0B` | 11, 11, 11 | Main background, hero background |
| Burgundy Dark | `#3A0A10` | 58, 10, 16 | Hover states, subtle background accents |
| Cream Muted | `#D8CEC1` | 216, 206, 193 | Secondary text |
| Warm Gray | `#A49C93` | 164, 156, 147 | Metadata and tertiary text |
| Border Gray | `#302D2B` | 48, 45, 43 | Borders and separators |

### Brand Colors

```css
--color-burgundy: #5B0F18;
--color-cream: #F8F1E7;
--color-black: #0B0B0B;
```

### Supporting Colors

```css
--color-burgundy-dark: #3A0A10;
--color-cream-muted: #D8CEC1;
--color-warm-gray: #A49C93;
--color-border: #302D2B;
```

---

# 3. Semantic Color Tokens

Use semantic tokens in the application instead of hard-coding palette colors repeatedly.

```css
:root {
  --background: #0B0B0B;
  --surface: #111111;
  --surface-elevated: #171515;

  --foreground: #F8F1E7;
  --foreground-muted: #D8CEC1;
  --foreground-subtle: #A49C93;

  --primary: #5B0F18;
  --primary-hover: #741522;
  --primary-foreground: #F8F1E7;

  --accent: #5B0F18;
  --accent-soft: rgba(91, 15, 24, 0.18);

  --border: #302D2B;
  --border-light: rgba(248, 241, 231, 0.12);

  --overlay: rgba(11, 11, 11, 0.82);
}
```

---

# 4. Color Usage Rules

### Deep Black

Use for:

- Main page background
- Hero background
- Navigation background
- Large visual areas
- Footer

Do not use pure `#000000` everywhere. `#0B0B0B` should be the primary black.

### Burgundy Wine

Use sparingly for:

- Primary CTA
- Active navigation
- Selected cards
- Important labels
- Decorative strokes
- Hover states
- Progress indicators
- Accent typography

**Rule:** Burgundy should be an accent, not the dominant background color.

### Soft Cream

Use for:

- Main headings
- Hero typography
- Important labels
- Primary buttons
- Large numbers
- High-priority content

### Supporting Gray

Use for:

- Paragraphs
- Metadata
- Dates
- Technology descriptions
- Secondary navigation

---

# 5. Typography

## Display Font — Brunson

**Primary display typeface:** `Brunson`

Use for:

- Hero name
- Project titles
- Major section headings
- Large statistics
- Editorial statements
- Featured project headings

### Recommended Style

```css
font-family: "Brunson", sans-serif;
font-weight: 400;
letter-spacing: -0.02em;
text-transform: uppercase;
```

### Display Hierarchy

| Element | Size | Line Height | Weight |
|---|---:|---:|---:|
| Hero Name | 96–180px | 0.82–0.95 | Regular |
| Project Title | 64–96px | 0.9 | Regular |
| Section Heading | 48–72px | 0.95 | Regular |
| Card Heading | 28–42px | 1.0 | Regular |
| Large Number | 48–72px | 1.0 | Regular |

Use `clamp()` for responsive sizing.

Example:

```css
.hero-title {
  font-family: "Brunson", sans-serif;
  font-size: clamp(4.5rem, 10vw, 11rem);
  line-height: 0.88;
  letter-spacing: -0.035em;
  text-transform: uppercase;
}
```

---

## Body Font — Inter

**Primary UI/body typeface:** `Inter`

Use for:

- Paragraphs
- Navigation
- Buttons
- Metadata
- Project descriptions
- Technology labels
- Forms
- UI elements

```css
font-family: "Inter", sans-serif;
```

### Body Hierarchy

| Element | Size | Line Height | Weight |
|---|---:|---:|---:|
| Body Large | 18px | 1.65 | 400 |
| Body | 16px | 1.6 | 400 |
| Body Small | 14px | 1.5 | 400 |
| Caption | 12px | 1.4 | 500 |
| Navigation | 14–15px | 1.2 | 500 |
| Button | 13–14px | 1 | 600 |

---

## Optional Editorial Accent Font

For occasional decorative statements, use a refined serif such as:

**Cormorant Garamond**

Use only for:

- Short quotes
- Editorial captions
- Decorative phrases

Do not use it for navigation or technical information.

---

# 6. Font Loading

Place the provided font file in:

```text
/public/fonts/
```

Recommended structure:

```text
public/
└── fonts/
    ├── Brunson.woff2
    └── InterVariable.woff2
```

Then define:

```css
@font-face {
  font-family: "Brunson";
  src: url("/fonts/Brunson.woff2") format("woff2");
  font-weight: 400;
  font-style: normal;
  font-display: swap;
}
```

---

# 7. Typography Rules

### Do

- Use Brunson for visual impact.
- Use Inter for readability.
- Keep large headings short.
- Use uppercase display typography.
- Use generous negative space.
- Use cream text against deep black.
- Use burgundy to emphasize selected words.

### Don't

- Use Brunson for long paragraphs.
- Use multiple display fonts in one section.
- Use excessive bold text.
- Use pure white everywhere.
- Use burgundy for every heading.
- Overuse uppercase body text.

---

# 8. Layout System

## Container

```css
--container-max: 1440px;
--container-padding: clamp(20px, 5vw, 80px);
```

Recommended:

```css
.container {
  width: min(100% - 40px, 1440px);
  margin-inline: auto;
}
```

For large screens:

```css
@media (min-width: 1280px) {
  .container {
    width: min(100% - 120px, 1440px);
  }
}
```

---

# 9. Spacing System

Use a consistent 4px base scale.

| Token | Value |
|---|---:|
| `space-1` | 4px |
| `space-2` | 8px |
| `space-3` | 12px |
| `space-4` | 16px |
| `space-5` | 20px |
| `space-6` | 24px |
| `space-8` | 32px |
| `space-10` | 40px |
| `space-12` | 48px |
| `space-16` | 64px |
| `space-20` | 80px |
| `space-24` | 96px |
| `space-32` | 128px |

Major sections should generally use:

```text
80px – 160px
```

vertical spacing depending on viewport size.

---

# 10. Grid

### Desktop

Use a 12-column grid.

```css
grid-template-columns: repeat(12, 1fr);
gap: 24px;
```

### Tablet

```css
grid-template-columns: repeat(8, 1fr);
gap: 20px;
```

### Mobile

```css
grid-template-columns: repeat(4, 1fr);
gap: 16px;
```

---

# 11. Border Radius

The portfolio should feel editorial rather than overly rounded.

| Element | Radius |
|---|---:|
| Large Card | 20px |
| Project Card | 18px |
| Small Card | 12px |
| Button | 999px / pill |
| Tag | 999px |
| Image Frame | 18–24px |

Avoid excessive `rounded-3xl` styling across every component.

---

# 12. Borders

Use extremely subtle borders.

```css
border: 1px solid rgba(248, 241, 231, 0.10);
```

Hover:

```css
border-color: rgba(91, 15, 24, 0.65);
```

Active:

```css
border-color: #5B0F18;
```

---

# 13. Shadows

Avoid heavy generic SaaS shadows.

### Card

```css
box-shadow:
  0 20px 60px rgba(0, 0, 0, 0.35);
```

### Burgundy Glow

```css
box-shadow:
  0 0 60px rgba(91, 15, 24, 0.18);
```

Use glow sparingly.

---

# 14. Texture & Background

The portfolio should have subtle visual texture.

Recommended:

- Fine film grain
- Very subtle noise
- Soft radial gradients
- Burgundy atmospheric glow
- Editorial brush textures
- Thin circular outlines
- Large abstract shapes

Example:

```css
background:
  radial-gradient(
    circle at 70% 30%,
    rgba(91, 15, 24, 0.18),
    transparent 35%
  ),
  #0B0B0B;
```

Texture opacity should remain around:

```text
3% – 8%
```

---

# 15. Buttons

## Primary Button

Background:

```text
#5B0F18
```

Text:

```text
#F8F1E7
```

Example:

```text
VIEW MY WORK →
```

Style:

- Height: 48–56px
- Horizontal padding: 24–32px
- Pill or slightly rounded
- Medium/semibold Inter
- Burgundy background
- Cream text

### Hover

```text
Background → #741522
Transform → translateY(-2px)
```

---

## Secondary Button

Transparent background:

```css
background: transparent;
border: 1px solid rgba(248, 241, 231, 0.18);
```

Hover:

```css
background: rgba(248, 241, 231, 0.06);
border-color: rgba(248, 241, 231, 0.35);
```

---

# 16. Project Cards

Every project card should contain:

1. Project category
2. Project name
3. Short description
4. Product/UI preview
5. Technology stack
6. Primary CTA
7. Optional year/status

### Example

```text
FEATURED PROJECT

CareerLogic AI

AI-POWERED RESUME BUILDER

AI-powered platform for analyzing,
tailoring and optimizing resumes.

[ Product Preview ]

Next.js   TypeScript   Groq   MongoDB

VIEW CASE STUDY →
```

---

# 17. Project Card Visual Rules

Project previews should be the visual focus.

Use:

- Deep black base
- Burgundy background shapes
- Soft cream typography
- Thin cream borders
- Burgundy highlights
- Subtle glass/blur only when necessary

Do not make project cards look like generic SaaS cards.

---

# 18. Navigation

Desktop navigation should be minimal.

Example:

```text
HOME
ABOUT
PROJECTS
EXPERIENCE
CONTACT
```

Active state:

```text
PROJECTS
────────
```

or Burgundy indicator.

Navigation typography:

```css
font-family: "Inter";
font-size: 13px;
font-weight: 500;
letter-spacing: 0.08em;
text-transform: uppercase;
```

---

# 19. Hero Section

The hero is the strongest visual section.

### Structure

```text
[Small Label]

RIFAT
AHMED

FULL STACK DEVELOPER
AI AGENT BUILDER

Short introduction

[ VIEW MY WORK ]

                    [ PORTRAIT ]

                         [ STATS ]
```

### Hero Principles

- Large typography
- Portrait centered/right
- Strong negative space
- Burgundy accent
- Deep black background
- Cream typography
- Minimal UI
- Editorial composition

---

# 20. Project Detail Page

Each project detail page should follow this hierarchy:

```text
Back to Projects

PROJECT CATEGORY

PROJECT NAME

Short project statement

[ Live Demo ] [ Source Code ]

Project Preview

────────────────────────

ABOUT THE PROJECT

KEY FEATURES

TECH STACK

PROJECT HIGHLIGHTS

────────────────────────

THE CHALLENGE

THE SOLUTION

THE IMPACT

────────────────────────

PROJECT SCREENSHOTS

────────────────────────

NEXT PROJECT →
```

---

# 21. Tech Stack Tags

Use small burgundy/black pills.

Example:

```text
Next.js
TypeScript
Tailwind CSS
ShadCN
Node.js
Express
MongoDB
Groq API
Zustand
Framer Motion
```

Style:

```css
background: rgba(91, 15, 24, 0.16);
border: 1px solid rgba(91, 15, 24, 0.45);
color: #D8CEC1;
```

---

# 22. Statistics

Statistics should be visually bold.

Example:

```text
20+
PROJECTS

AI
AGENTS

3+
YEARS
LEARNING

∞
CURIOSITY
```

Large values:

```text
Brunson
```

Labels:

```text
Inter
```

---

# 23. Icons

Recommended icon library:

**Lucide Icons**

Icon style:

- 1.5px–2px stroke
- Minimal
- Rounded
- Cream or muted gray
- Burgundy for active states

Avoid colorful icon collections.

---

# 24. Motion System

Use **Framer Motion**.

Animations should be subtle and intentional.

### Page Entry

```text
Opacity: 0 → 1
Y: 20px → 0
Duration: 0.6s
Ease: easeOut
```

### Project Card Hover

```text
Y: -4px
Image scale: 1 → 1.02
Border: muted → burgundy
```

### Hero Typography

Use staggered reveal.

Avoid:

- Excessive bouncing
- Constant floating
- Large rotations
- Overly flashy animations

The portfolio should feel **expensive, not animated for the sake of animation**.

---

# 25. Responsive Behavior

## Desktop

- Large editorial typography
- 12-column layouts
- Portrait integrated into hero
- Multi-column project cards
- Large whitespace

## Tablet

- Reduce heading sizes
- Maintain two-column layouts where possible
- Reduce decorative elements

## Mobile

Hero becomes:

```text
RIFAT
AHMED

Portrait

FULL STACK DEVELOPER
AI AGENT BUILDER

Description

[ VIEW MY WORK ]
```

Project cards become single-column.

Hide or simplify decorative background elements.

---

# 26. Accessibility

Minimum contrast should be maintained between:

```text
Soft Cream ↔ Deep Black
```

Interactive elements must have:

- Visible focus state
- Keyboard navigation
- Accessible labels
- Sufficient hit area

Do not communicate important information through color alone.

---

# 27. Image Treatment

Portfolio imagery should use:

- Dark cinematic treatment
- Slight grain
- High contrast
- Burgundy atmospheric accents
- Soft vignette

Portraits should maintain natural skin tones while harmonizing with the palette.

Avoid applying a heavy burgundy filter over the entire portrait.

---

# 28. Design Tokens

```css
:root {
  /* Colors */
  --black: #0B0B0B;
  --burgundy: #5B0F18;
  --burgundy-dark: #3A0A10;
  --cream: #F8F1E7;
  --cream-muted: #D8CEC1;
  --warm-gray: #A49C93;
  --border: #302D2B;

  /* Typography */
  --font-display: "Brunson", sans-serif;
  --font-body: "Inter", sans-serif;
  --font-editorial: "Cormorant Garamond", serif;

  /* Layout */
  --container: 1440px;

  /* Radius */
  --radius-card: 18px;
  --radius-large: 24px;
  --radius-pill: 999px;

  /* Motion */
  --duration-fast: 180ms;
  --duration-normal: 300ms;
  --duration-slow: 600ms;

  /* Shadows */
  --shadow-card: 0 20px 60px rgba(0, 0, 0, 0.35);
  --shadow-burgundy: 0 0 60px rgba(91, 15, 24, 0.18);
}
```

---

# 29. Tailwind Mapping

Recommended custom colors:

```js
colors: {
  black: "#0B0B0B",
  burgundy: "#5B0F18",
  "burgundy-dark": "#3A0A10",
  cream: "#F8F1E7",
  "cream-muted": "#D8CEC1",
  "warm-gray": "#A49C93",
  border: "#302D2B",
}
```

Recommended font families:

```js
fontFamily: {
  display: ["Brunson", "sans-serif"],
  sans: ["Inter", "sans-serif"],
  editorial: ["Cormorant Garamond", "serif"],
}
```

---

# 30. Component Style

Every component should follow:

```text
Strong hierarchy
↓
Large typography
↓
Controlled contrast
↓
Minimal decoration
↓
Subtle interaction
```

The design should never feel crowded.

---

# 31. Do / Don't

## DO

- Use deep black as the foundation.
- Use burgundy strategically.
- Use cream instead of pure white.
- Use Brunson for major typography.
- Use Inter for usability.
- Use large editorial layouts.
- Use subtle texture.
- Use cinematic imagery.
- Use thin borders.
- Use intentional motion.

## DON'T

- Use neon gradients.
- Use excessive glassmorphism.
- Use generic blue SaaS styling.
- Use excessive rounded cards.
- Use rainbow technology icons.
- Use huge shadows everywhere.
- Use too many animations.
- Put every piece of information inside a card.
- Overuse burgundy.
- Sacrifice readability for aesthetics.

---

# 32. Brand Formula

The visual identity can be summarized as:

```text
DEEP BLACK
+
SOFT CREAM
+
BURGUNDY
+
BRIDGEND EXPANDED
+
INTER
+
EDITORIAL GRID
+
CINEMATIC PORTRAIT
+
SUBTLE GRAIN
+
MINIMAL MOTION
=
RIFAT AHMED PORTFOLIO
```

---

## Final Design Principle

> **Make it feel like a creative director designed a developer portfolio — not like a developer designed a website.**

Every section should prioritize **identity, typography, visual hierarchy, and storytelling** while keeping the underlying interface fast, accessible, responsive, and technically clean.
