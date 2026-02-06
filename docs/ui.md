# Editorial Minimalism Design System

A comprehensive design system for building refined, modern interfaces with an editorial aesthetic.

---

## Design Philosophy

**Aesthetic Direction: Editorial Minimalism**

This design system follows an editorial minimalist language inspired by high-end magazine layouts and contemporary publishing design. The interface prioritizes:

- **Restraint over excess** — Every element earns its place
- **Typography as hierarchy** — Text styling communicates structure
- **Negative space as design** — Generous breathing room between elements
- **Subtle over loud** — Muted colors, thin borders, gentle transitions

This aesthetic creates a refined, professional experience that feels premium without being ostentatious.

---

## Golden Rules

Before diving into specifics, follow these core principles to maintain consistency:

### 0. Use shadcn/ui Components & Standard Sizes (CRITICAL)

**Always use shadcn/ui components as the foundation.** Never create custom buttons, inputs, badges, or other primitives.

**Always use standard shadcn sizes:**

```tsx
// ✓ CORRECT - Use standard sizes
<Button size="sm">Small</Button>      // h-8 (32px)
<Button size="default">Default</Button> // h-9 (36px)
<Button size="lg">Large</Button>      // h-10 (40px)
<Input />                              // h-9 (36px)

// ✗ WRONG - Don't create custom sizes
<Button className="h-7">Custom</Button>
<div className="h-[38px]">Custom input</div>
```

**Standard icon size in components:** `size-4` (16px)

### 1. Reuse Before Creating

Always search existing components before creating new ones:

- `components/ui/` — Primitives (Button, Badge, Skeleton, Dialog, Input)
- `components/common/` — Utilities (wrappers, loaders, shared patterns)
- `components/[feature]/` — Domain-specific patterns

**IMPORTANT:** Before implementing any new UI, read the existing `components/ui/` files. All shadcn components have been pre-styled with the editorial minimalist aesthetic — `rounded-sm`, `border-border/50`, `font-light`, `duration-300`, etc. are already baked in. Don't add redundant class overrides.

### 2. Compose, Don't Duplicate

Build complex UIs by combining simpler components:

```tsx
// Compose existing components
<Card>
    <Header {...props} />
    <Stats {...props} />
</Card>

// Don't copy markup from other components
```

### 3. Extract Repeated Patterns

If markup appears 3+ times, extract it into a component:

```tsx
// This pattern → extract to SectionDivider
<div className="flex items-center gap-4">
    <div className="h-px flex-1 bg-border/50" />
    <span className="text-xs tracking-widest uppercase text-muted-foreground">{label}</span>
    <div className="h-px flex-1 bg-border/50" />
</div>
```

### 4. Extend, Don't Modify

Use `className` and `variant` props to customize, not source changes:

```tsx
// Extend via props
<Button className="h-12 px-8 tracking-wide" variant="outline" size="lg">

// Don't add one-off variants to base components
```

### 5. Follow the Token System

Use design tokens consistently:

- Colors: `text-muted-foreground`, `bg-muted/30`, `border-border/50`
- Typography: `text-xs tracking-widest uppercase` for labels
- Spacing: Multiples of 4px (`gap-4`, `p-6`, `py-12`)

### 6. Place Components Correctly

| Scope                    | Location                                 |
| ------------------------ | ---------------------------------------- |
| Generic, reusable        | `components/ui/` or `components/common/` |
| Domain-specific          | `components/[feature]/`                  |
| Used once, page-specific | Colocate in `app/[route]/`               |

---

## Pre-Styled shadcn/ui Components

All base UI primitives in `components/ui/` have been customized for the editorial minimalist aesthetic. **Always build upon these components** — they include the design system tokens so you don't need to re-apply them.

### What's Already Baked In

| Component        | Pre-styled Defaults                                                                                                                |
| ---------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| **Button**       | `rounded-sm`, `duration-300`, `border-border/50` (outline), `hover:bg-muted/50` (ghost), sizes: sm=`h-8`, default=`h-9`, lg=`h-10` |
| **Input**        | `rounded-sm`, `border-border/50`, `duration-300`, `h-9`, focus ring styling                                                        |
| **Badge**        | `rounded-sm`, `text-xs`, `px-2.5 py-0.5`, `tracking-wide`, default variant=`outline` with `border-border/50`                       |
| **Card**         | `rounded-sm`, `border-border/50`, `font-light` title                                                                               |
| **Dialog**       | `rounded-sm`, `border-border/50`, `font-light` title, backdrop blur                                                                |
| **Sheet**        | `border-border/50`, `font-light` title, `duration-300` animations                                                                  |
| **Select**       | `rounded-sm`, `border-border/50`, `duration-300`, `hover:bg-muted/50` items                                                        |
| **DropdownMenu** | `rounded-sm`, `border-border/50`, `duration-200` items, `hover:bg-muted/50`                                                        |
| **Checkbox**     | `rounded-sm`, `border-border/50`, `duration-300`                                                                                   |
| **Separator**    | `bg-border/50`                                                                                                                     |
| **Skeleton**     | `rounded-sm`, `bg-muted/50`                                                                                                        |
| **Tooltip**      | `rounded-sm`                                                                                                                       |
| **Alert**        | `rounded-sm`, `border-border/50`                                                                                                   |
| **Command**      | `rounded-sm`, `border-border/50` (input), `duration-200` items                                                                     |

### Usage Guidelines

```tsx
// ✓ CORRECT: Use shadcn components directly
<Button variant="outline" size="sm">Add</Button>
<Badge>PG-13</Badge>
<Dialog><DialogContent>...</DialogContent></Dialog>

// ✗ WRONG: Don't add redundant overrides
<Button className="rounded-sm border-border/50">  // Already in base
<Badge className="h-5 text-xs">              // Already in base
<DialogContent className="rounded-sm">            // Already in base
```

### When to Add Custom Classes

Only add classes for:

- **Layout specifics**: `className="w-full"`, `className="ml-auto"`
- **Contextual sizing**: `className="h-12"` for hero CTAs
- **Extra spacing**: `className="tracking-wide"` for emphasis
- **Custom colors**: `className="text-blue-500"` for type indicators

### Read Before Implementing

Before creating any UI:

1. Check if a shadcn component exists in `components/ui/`
2. Read the component file to understand its pre-baked styles
3. Compose existing components rather than building from scratch
4. Only add className overrides for truly custom behavior

---

## Standard Sizes (shadcn/ui)

**IMPORTANT:** Always use standard shadcn sizes. Don't create custom sizes unless absolutely necessary.

### Component Sizes

| Component | Size      | Height | Class    | Usage              |
| --------- | --------- | ------ | -------- | ------------------ |
| Button    | `sm`      | 32px   | `h-8`    | Compact, secondary |
| Button    | `default` | 36px   | `h-9`    | Standard actions   |
| Button    | `lg`      | 40px   | `h-10`   | Primary CTAs       |
| Button    | `icon`    | 36px   | `size-9` | Icon-only buttons  |
| Input     | `sm`      | 32px   | `h-8`    | Compact forms      |
| Input     | `default` | 36px   | `h-9`    | Standard forms     |
| Select    | `sm`      | 32px   | `h-8`    | Compact forms      |
| Select    | `default` | 36px   | `h-9`    | Standard forms     |

### Icon Sizes

| Size     | Pixels | Usage                              |
| -------- | ------ | ---------------------------------- |
| `size-3` | 12px   | Inline with small text             |
| `size-4` | 16px   | Default (buttons, inline, lists)   |
| `size-5` | 20px   | Section headers, brand icons       |
| `size-6` | 24px   | Page headers (with `text-primary`) |

### Spacing Scale (4px base unit)

| Token | Value | Tailwind          | Usage                     |
| ----- | ----- | ----------------- | ------------------------- |
| 1     | 4px   | `gap-1`, `p-1`    | Tight spacing             |
| 2     | 8px   | `gap-2`, `p-2`    | Inline element spacing    |
| 3     | 12px  | `gap-3`, `p-3`    | Card padding, button gaps |
| 4     | 16px  | `gap-4`, `p-4`    | Section padding           |
| 6     | 24px  | `gap-6`, `p-6`    | Container padding         |
| 8     | 32px  | `gap-8`, `py-8`   | Section margins           |
| 12    | 48px  | `gap-12`, `py-12` | Large section gaps        |
| 16    | 64px  | `gap-16`          | Feature grid gaps         |
| 20    | 80px  | `py-20`           | Page section padding      |

### Typography Scale

| Name      | Tailwind Classes                   | Usage                 |
| --------- | ---------------------------------- | --------------------- |
| Caption   | `text-xs` (12px)                   | Metadata, timestamps  |
| Body      | `text-sm` (14px)                   | Descriptions, content |
| Base      | `text-base` (16px)                 | Primary content       |
| Large     | `text-lg` (18px)                   | Emphasized text       |
| Heading 3 | `text-xl` (20px)                   | Subsection titles     |
| Heading 2 | `text-2xl md:text-3xl`             | Section titles        |
| Heading 1 | `text-3xl sm:text-4xl lg:text-5xl` | Hero/display titles   |

### Border Radius

| Class          | Size   | Usage                    |
| -------------- | ------ | ------------------------ |
| `rounded-sm`   | 2px    | Cards, badges, inputs    |
| `rounded-md`   | 6px    | Buttons (shadcn default) |
| `rounded-lg`   | 8px    | Large containers         |
| `rounded-full` | 9999px | Avatars, pills           |

**Editorial Minimalism Rule:** Use `rounded-sm` for most elements. Avoid `rounded-lg` except for specific cases.

---

## 1. Design System Foundations

### 1.1 Color Palette

This design system uses OKLCH color space for perceptually uniform colors with CSS custom properties for theme support.

#### Semantic Colors

| Token                      | Light Mode                 | Dark Mode                  | Usage                             |
| -------------------------- | -------------------------- | -------------------------- | --------------------------------- |
| `--background`             | `oklch(0.992 0 0)`         | `oklch(0.199 0 0)`         | Page background                   |
| `--foreground`             | `oklch(0.204 0 0)`         | `oklch(0.947 0 0)`         | Primary text                      |
| `--card`                   | `oklch(0.963 0 0)`         | `oklch(0.255 0 0)`         | Card backgrounds                  |
| `--muted`                  | `oklch(0.93 0 0)`          | `oklch(0.3 0 0)`           | Muted backgrounds                 |
| `--muted-foreground`       | `oklch(0.541 0 0)`         | `oklch(0.706 0 0)`         | Secondary text                    |
| `--border`                 | `oklch(0.891 0 0)`         | `oklch(0.364 0 0)`         | Borders, dividers                 |
| `--primary`                | `oklch(0.87 0.156 89.2)`   | `oklch(0.87 0.156 89.2)`   | Primary actions, accents          |
| `--secondary`              | `oklch(0.641 0.133 157.6)` | `oklch(0.641 0.133 157.6)` | Secondary accents                 |
| `--destructive`            | `oklch(0.625 0.193 22.9)`  | `oklch(0.625 0.193 22.9)`  | Error states, destructive actions |
| `--destructive-foreground` | `oklch(0.969 0 0)`         | `oklch(0.969 0 0)`         | Text on destructive backgrounds   |

#### Opacity Conventions

```css
/* Border opacity — subtle dividers */
border-border/50     /* 50% opacity for understated lines */

/* Background opacity — subtle fills */
bg-muted/30          /* 30% for gentle backgrounds */
bg-muted/50          /* 50% for interactive hover states */
bg-muted/20          /* 20% for very subtle tints */

/* Text opacity — hierarchy through transparency */
text-foreground/80   /* 80% for body text */
text-foreground/70   /* 70% for less prominent text */
text-muted-foreground/* Dedicated muted color */
```

#### Primary Color Accents

Use `primary` color sparingly to add visual interest and break the monotony of neutral tones:

```css
/* Icon accents — page headers, feature highlights */
text-primary         /* Icons alongside headings */

/* Subtle backgrounds — tags, indicators */
bg-primary/10        /* Very subtle primary tint */
bg-primary/20        /* Slightly more visible tint */

/* Accent borders — selected states, highlights */
border-primary/50    /* Subtle primary border */
ring-primary         /* Selection rings */
```

**When to use primary accents:**

- Page header icons (creates visual hierarchy)
- Selected/active state indicators
- Feature highlights and call-to-action elements
- Interactive element focus states

**When NOT to use:**

- Body text or descriptions
- Decorative borders (use `border-border/50` instead)
- Background fills for large areas

#### Accessibility

- All text meets WCAG 2.1 AA contrast requirements (4.5:1 for normal text, 3:1 for large text)
- Interactive elements maintain 3:1 contrast against backgrounds
- Focus states use `ring` color with visible outlines

### 1.2 Typography

#### Font Stack

```css
--font-sans: Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
--font-mono: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace;
```

#### Type Scale

| Name      | Size                     | Weight              | Tracking                              | Usage                                        |
| --------- | ------------------------ | ------------------- | ------------------------------------- | -------------------------------------------- |
| Display   | `text-3xl` to `text-5xl` | `font-light` (300)  | Default                               | Hero titles, page headers                    |
| Heading 1 | `text-2xl` to `text-3xl` | `font-light` (300)  | Default                               | Section titles                               |
| Heading 2 | `text-xl` to `text-2xl`  | `font-light` (300)  | Default                               | Subsection titles                            |
| Heading 3 | `text-lg`                | `font-medium` (500) | Default                               | Card titles, list headers                    |
| Body      | `text-sm` to `text-base` | `font-normal` (400) | Default                               | Paragraphs, descriptions                     |
| Caption   | `text-xs`                | `font-normal` (400) | Default                               | Metadata, timestamps, captions               |
| Label     | `text-xs`                | `font-medium` (500) | `tracking-wider` to `tracking-widest` | Editorial labels (with tracking + uppercase) |

**Important**: Always use standard Tailwind text sizes (`text-xs`, `text-sm`, `text-base`, `text-lg`, etc.). Never use custom arbitrary values like `text-xs` or `text-xs`.

#### Editorial Label Pattern

The signature design element — ultra-wide letter-spacing for labels:

```tsx
// Section divider label
<span className="text-xs tracking-widest uppercase text-muted-foreground">
  Section Name
</span>

// Category label
<span className="text-xs tracking-wider uppercase text-muted-foreground">
  01
</span>
```

#### Line Heights

```css
leading-tight    /* 1.25 — Headlines */
leading-snug     /* 1.375 — Subheadlines */
leading-relaxed  /* 1.625 — Body text, descriptions */
```

### 1.3 Spacing System

Base unit: `0.25rem` (4px)

#### Scale Progression

| Token | Value | Tailwind          | Usage                       |
| ----- | ----- | ----------------- | --------------------------- |
| 1     | 4px   | `p-1`, `gap-1`    | Icon padding, tight spacing |
| 2     | 8px   | `p-2`, `gap-2`    | Inline element spacing      |
| 3     | 12px  | `p-3`, `gap-3`    | Card padding, button gaps   |
| 4     | 16px  | `p-4`, `gap-4`    | Section padding             |
| 6     | 24px  | `p-6`, `gap-6`    | Container padding           |
| 8     | 32px  | `py-8`, `gap-8`   | Section margins             |
| 12    | 48px  | `py-12`, `gap-12` | Large section gaps          |
| 16    | 64px  | `gap-16`          | Feature grid gaps           |
| 20    | 80px  | `py-20`           | Page section padding        |
| 32    | 128px | `py-32`           | Hero section padding        |

#### Container Widths

```css
max-w-6xl        /* 1152px — Primary content container */
max-w-2xl        /* 672px — Text content, forms */
max-w-xl         /* 576px — Search bars, narrow content */
max-w-md         /* 448px — Modals, small forms */
```

### 1.4 Icon Sizes

Standardized icon sizes ensure visual consistency across the interface:

| Size     | Pixels | Usage                                                   |
| -------- | ------ | ------------------------------------------------------- |
| `size-4` | 16px   | Default for inline icons, buttons, list items, metadata |
| `size-5` | 20px   | Brand icons, section header icons                       |
| `size-6` | 24px   | Page header icons (with `text-primary`)                 |

```tsx
// Page header icon
<Icon className="size-6 text-primary" strokeWidth={1.5} />

// Button with icon (default)
<Button><Icon className="size-4" /> Label</Button>

// Inline with text
<span className="flex items-center gap-2">
  <Icon className="size-4 text-muted-foreground" />
  {label}
</span>

// Brand/external service icons
<img src="..." className="size-5 dark:invert" />
```

**Important**: Always use `size-4` as the default icon size. Only use larger sizes for specific contexts like page headers (`size-6`) or brand icons (`size-5`).

### 1.5 Border Radii

This design system uses minimal border radii for a sharp, editorial aesthetic:

```css
--radius: 0rem /* Base radius — sharp corners */ rounded-sm /* 0.125rem — Subtle rounding for cards, badges */
    rounded-md /* 0.375rem — Buttons, inputs */ rounded-lg /* 0.5rem — Larger containers, screenshots */;
```

### 1.6 Shadows & Elevation

Shadows are subtle and increase opacity in dark mode:

```css
/* Light mode */
--shadow-xs: 0px 4px 10px 0px hsl(0, 0, 0 / 0.05);
--shadow-sm: 0px 4px 10px 0px hsl(0, 0, 0 / 0.1), 0px 1px 2px -1px hsl(0, 0, 0 / 0.1);

/* Dark mode — stronger shadows for depth */
--shadow-xs: 0px 8px 20px 0px hsl(0, 0, 0 / 0.25);
--shadow-sm: 0px 8px 20px 0px hsl(0, 0, 0 / 0.5), 0px 1px 2px -1px hsl(0, 0, 0 / 0.5);
```

---

## 2. Component Creation Guide

This section provides a systematic approach for creating any new component in the editorial minimalism style.

### 2.1 Decision Flow

Before writing code, answer these questions:

```
1. Does a shadcn/ui component already exist?
   → Yes: Use it directly from components/ui/
   → No: Continue to step 2

2. Does a custom component exist in components/common/ or components/[feature]/?
   → Yes: Compose with it
   → No: Continue to step 3

3. What type of component is it?
   → Container (section, card, list) → Use editorial section pattern
   → Interactive (button, link, form) → Use shadcn primitives + editorial tokens
   → Display (stat, badge, label) → Use inline patterns
   → Image card (thumbnail, vertical) → Use card patterns with hover states
```

### 2.2 Core Building Blocks

Every component in this system is built from these atomic pieces:

**Typography Atoms:**

```tsx
// Hero/Display heading
"text-3xl sm:text-4xl lg:text-5xl font-light";

// Section heading
"text-2xl md:text-3xl font-light";

// Subsection heading
"text-xl font-light";

// Card/Item title
"text-sm font-medium";

// Editorial label (signature element)
"text-xs tracking-widest uppercase text-muted-foreground";

// Body/Description text
"text-sm text-muted-foreground";

// Caption/Metadata
"text-xs text-muted-foreground";
```

**Spacing Atoms:**

```tsx
// Vertical rhythm
"space-y-2"; // Tight (related elements)
"space-y-4"; // Standard (within sections)
"space-y-6"; // Loose (section internals)
"space-y-8"; // Sections
"space-y-10"; // Major sections

// Horizontal gaps
"gap-2"; // Inline elements
"gap-3"; // Icon + text
"gap-4"; // Standard
"gap-8"; // Columns
```

**Border & Background Atoms:**

```tsx
// Borders
"border border-border/50"; // Subtle container
"border-b border-border/50"; // Divider line
"border-l border-border/50"; // Left accent

// Backgrounds
"bg-muted/30"; // Subtle fill
"bg-muted/50"; // Hover state
"bg-black/60 backdrop-blur-sm"; // Overlay badge

// Radius
"rounded-sm"; // Standard (2px)
```

**Interactive Atoms:**

```tsx
// Hover color change
"hover:bg-muted/50 transition-colors";
"text-muted-foreground hover:text-foreground transition-colors";

// Hover reveal
"opacity-0 group-hover:opacity-100 transition-opacity duration-300";

// Hover scale
"transition-transform duration-300 hover:scale-hover";

// Selected state
"ring-2 ring-primary ring-offset-1 ring-offset-background";
```

### 2.3 Section Templates

Use these templates as starting points for common section types:

**Template A: Editorial Section (content + action)**

```tsx
<section className="space-y-6">
    {/* Label with accent line */}
    <div className="flex items-center gap-4">
        <div className="h-px w-8 bg-primary" />
        <span className="text-xs tracking-widest uppercase text-muted-foreground">{sectionLabel}</span>
    </div>

    {/* Asymmetric content layout */}
    <div className="grid lg:grid-cols-[1fr_auto] gap-8 items-start">
        <div className="space-y-4">
            <div className="flex items-center gap-3">
                <Icon className="size-5" />
                <h2 className="text-xl font-light">{title}</h2>
            </div>
            <p className="text-sm text-muted-foreground max-w-lg">{description}</p>
            {/* Optional: feature list, metadata, etc. */}
        </div>
        <div className="flex flex-col sm:flex-row lg:flex-col gap-2">{/* Action buttons */}</div>
    </div>
</section>
```

**Template B: List Section (items with dividers)**

```tsx
<section className="space-y-4">
    <h3 className="text-xs tracking-widest uppercase text-muted-foreground">{sectionLabel}</h3>

    <div className="border border-border/50 rounded-sm overflow-hidden divide-y divide-border/50">
        {items.map((item) => (
            <div key={item.id} className="px-4 py-3 hover:bg-muted/30 transition-colors">
                <div className="text-sm">{item.title}</div>
                <div className="text-xs text-muted-foreground">
                    {item.meta1} <span className="text-border">·</span> {item.meta2}
                </div>
            </div>
        ))}
    </div>
</section>
```

**Template C: Grid Section (cards)**

```tsx
<section className="space-y-4">
    <div className="flex items-center justify-between">
        <h3 className="text-xs tracking-widest uppercase text-muted-foreground">{sectionLabel}</h3>
        {viewAllLink && (
            <Link className="text-xs text-muted-foreground hover:text-foreground transition-colors">View All</Link>
        )}
    </div>

    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
        {items.map((item) => (
            <Card key={item.id} {...item} />
        ))}
    </div>
</section>
```

**Template D: Stat/Info Section (bordered stats)**

```tsx
<section className="space-y-4">
    <h3 className="text-xs tracking-widest uppercase text-muted-foreground">{sectionLabel}</h3>

    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
        {stats.map((stat) => (
            <div key={stat.label} className="pl-3 border-l border-border/50">
                <div className="text-xs tracking-wider uppercase text-muted-foreground mb-1">{stat.label}</div>
                <div className="text-sm font-medium">{stat.value}</div>
            </div>
        ))}
    </div>
</section>
```

### 2.4 Card Templates

**Vertical Image Card**

```tsx
<div className="group cursor-pointer">
    <div className="aspect-2/3 relative overflow-hidden bg-muted/30 rounded-sm">
        <img className="object-cover w-full h-full transition-transform duration-300 group-hover:scale-hover" />

        {/* Optional: rank/label badge */}
        <span className="absolute top-2 left-2 text-xs font-medium tracking-wider text-white/90 bg-black/60 backdrop-blur-sm px-2 py-1 rounded-sm">
            {label}
        </span>

        {/* Hover overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

        {/* Content revealed on hover */}
        <div className="absolute inset-x-0 bottom-0 p-3 translate-y-2 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300">
            <h4 className="font-light text-sm text-white">{title}</h4>
            <span className="text-xs text-white/70">{subtitle}</span>
        </div>
    </div>
</div>
```

**Horizontal Card (thumbnail + content)**

```tsx
<div className="rounded-sm border border-border/50 overflow-hidden">
    <div className="flex flex-col sm:flex-row">
        {/* Thumbnail */}
        <div className="relative w-full sm:w-48 shrink-0 aspect-video bg-muted/30">
            <img className="object-cover w-full h-full" />
        </div>

        {/* Content */}
        <div className="flex-1 p-4 space-y-2">
            <h4 className="text-sm font-medium">{title}</h4>
            <span className="text-xs text-muted-foreground">
                {meta1} <span className="text-border">·</span> {meta2}
            </span>
            {description && <p className="text-xs text-muted-foreground line-clamp-2">{description}</p>}
        </div>
    </div>
</div>
```

**Simple Card (bordered container)**

```tsx
<div className="rounded-sm border border-border/50 p-4 space-y-3 hover:bg-muted/30 transition-colors">
    <div className="flex items-center gap-3">
        <Icon className="size-5 text-primary" />
        <h4 className="text-sm font-medium">{title}</h4>
    </div>
    <p className="text-xs text-muted-foreground">{description}</p>
</div>
```

### 2.5 Interactive Element Patterns

**Link with Icon:**

```tsx
// Internal navigation
<Link className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
  <Icon className="size-4" />
  {label}
</Link>

// External link
<a href={url} target="_blank" rel="noopener noreferrer"
   className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
  <Icon className="size-4" />
  {label}
  <ArrowUpRight className="size-4 opacity-50" />
</a>
```

**Button Groups:**

```tsx
// Horizontal (responsive to vertical on mobile)
<div className="flex flex-col sm:flex-row gap-2">
  <Button>{primaryAction}</Button>
  <Button variant="outline">{secondaryAction}</Button>
</div>

// Icon button group
<div className="flex items-center gap-1">
  {actions.map(action => (
    <Button key={action.id} variant="ghost" size="icon">
      <action.icon className="size-4" />
    </Button>
  ))}
</div>
```

**Form Field:**

```tsx
<div className="space-y-2">
    <label className="text-xs tracking-wider uppercase text-muted-foreground">{label}</label>
    <Input placeholder={placeholder} />
    {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
</div>
```

### 2.6 Animation Recipes

**Staggered Entrance (for lists/grids):**

```tsx
{
    items.map((item, index) => (
        <div
            key={item.id}
            className="animate-in fade-in-0 slide-in-from-bottom-4"
            style={{
                animationDuration: "600ms",
                animationDelay: `${index * 100}ms`,
                animationFillMode: "backwards",
            }}>
            <ItemComponent {...item} />
        </div>
    ));
}
```

**Hero Split Headline:**

```tsx
<div className="space-y-2">
    <h1
        className="text-4xl sm:text-5xl lg:text-6xl font-light animate-in fade-in-0 slide-in-from-bottom-4"
        style={{ animationDuration: "600ms" }}>
        {primaryText}
    </h1>
    <h1
        className="text-4xl sm:text-5xl lg:text-6xl font-light text-muted-foreground animate-in fade-in-0 slide-in-from-bottom-4"
        style={{ animationDuration: "600ms", animationDelay: "100ms", animationFillMode: "backwards" }}>
        {secondaryText}
    </h1>
</div>
```

**Hover Slide-Up Reveal:**

```tsx
<div className="group relative overflow-hidden">
    {/* Base content always visible */}
    <div>{baseContent}</div>

    {/* Content revealed on hover */}
    <div className="absolute inset-x-0 bottom-0 translate-y-2 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300">
        {revealContent}
    </div>
</div>
```

### 2.7 Responsive Patterns

**Typography Scaling:**

```tsx
// Display → Section → Card
"text-3xl sm:text-4xl lg:text-5xl"; // Display
"text-2xl md:text-3xl"; // Section
"text-xl"; // Subsection
"text-sm"; // Card/Body
```

**Layout Shifts:**

```tsx
// Stack on mobile → Grid on desktop
"flex flex-col sm:flex-row";
"grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3";

// Hide/Show based on viewport
"hidden sm:flex"; // Hide on mobile
"flex md:hidden"; // Show only on mobile
```

**Spacing Adaptation:**

```tsx
// Tighter on mobile
"gap-4 sm:gap-6";
"p-4 sm:p-6";
"py-12 md:py-20";
```

---

## 3. Core Component Patterns

These are the fundamental patterns used throughout the design system. Adapt them to your specific use case.

### 3.1 Page Header

Page headers with icon accent for visual interest.

```tsx
<div className="space-y-6">
    <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div className="space-y-2">
            <div className="flex items-center gap-3">
                <Icon className="size-6 text-primary" strokeWidth={1.5} />
                <h1 className="text-2xl sm:text-3xl font-light">{title}</h1>
            </div>
            <p className="text-sm text-muted-foreground">{description}</p>
        </div>
        {action && <div className="shrink-0">{action}</div>}
    </div>
    <div className="h-px bg-border/50" />
</div>
```

**Key Patterns:**

- Icon uses `text-primary` for visual accent
- `strokeWidth={1.5}` for refined icon appearance
- `size-6` (24px) icon balances with heading size
- Description on second line for clear hierarchy
- Optional action slot for buttons (right-aligned on desktop)

### 3.2 Section Divider

The signature layout pattern — centered label with horizontal lines.

```tsx
<div className="flex items-center gap-4">
    <div className="h-px flex-1 bg-border/50" />
    <span className="text-xs tracking-widest uppercase text-muted-foreground">Label Text</span>
    <div className="h-px flex-1 bg-border/50" />
</div>
```

**States:**

- Default: 50% opacity border lines
- No hover/active states (decorative element)

**Usage:**

- Before major content sections
- Between grouped content areas
- Page structure organization

### 3.3 Button

Based on shadcn/ui with editorial refinements.

#### Variants

| Variant       | Appearance                          | Usage               |
| ------------- | ----------------------------------- | ------------------- |
| `default`     | Solid primary background            | Primary actions     |
| `outline`     | Border with transparent background  | Secondary actions   |
| `ghost`       | No border, transparent background   | Tertiary actions    |
| `destructive` | Red background, semantic foreground | Destructive actions |
| `link`        | Underlined text                     | Inline links        |

#### Sizes

| Size      | Height | Padding | Usage             |
| --------- | ------ | ------- | ----------------- |
| `sm`      | 32px   | `px-3`  | Compact contexts  |
| `default` | 36px   | `px-4`  | Standard buttons  |
| `lg`      | 40px   | `px-6`  | Hero CTAs         |
| `icon`    | 36px   | —       | Icon-only buttons |

#### Small Button Pattern

Use standard `size="sm"` for smaller contexts:

```tsx
// Small action button - h-8 (32px)
<Button variant="outline" size="sm">
  <Icon className="size-4" />
  <span>{label}</span>
</Button>

// Icon-only button
<Button variant="ghost" size="icon">
  <Icon className="size-4" />
</Button>
```

#### States

```tsx
// Default
className = "bg-primary text-primary-foreground";

// Hover
className = "hover:bg-primary/90";

// Disabled
className = "disabled:pointer-events-none disabled:opacity-50";

// Focus
className = "focus-visible:ring-3 focus-visible:ring-ring/50";
```

#### Editorial Button Patterns

```tsx
// Hero CTA
<Button size="lg" className="h-12 px-6 text-sm tracking-wide">
  Open App
  <ArrowRightIcon className="size-4 ml-2" />
</Button>

// Ghost with external indicator
<Button variant="ghost" className="text-muted-foreground">
  Website
  <ArrowUpRightIcon className="size-4 ml-1 opacity-50" />
</Button>

// Branded button (Discord example)
<Button
  variant="outline"
  className="border-[#5865F2]/30 text-[#5865F2] hover:bg-[#5865F2]/10"
>
  Discord
</Button>
```

### 3.4 Badge & Inline Metadata

For editorial minimalism, prefer inline text with separators over badge components.

#### When to Use Badges

| Use Case                    | Approach                             |
| --------------------------- | ------------------------------------ |
| Certifications              | Badge component with outline variant |
| Status indicators           | Inline text with color               |
| Metadata (size, resolution) | Inline text with `·` separators      |
| Genre tags                  | Span with muted background           |

#### Inline Metadata Pattern (Preferred)

```tsx
// Metadata with editorial separators - cleaner than badges
<span className="text-xs text-muted-foreground">
  {resolution} <span className="text-border">·</span> {size} <span className="text-border">·</span> {addon}
</span>

// Cached indicator - inline, not badge
<span className="inline-flex items-center gap-1 text-xs tracking-wide text-green-600 dark:text-green-500">
  <Zap className="size-2.5" />
  Cached
</span>
```

#### Badge Component (When Needed)

```tsx
// Certification badge
<Badge variant="outline" className="text-xs px-1.5 py-0 h-5 border-border/50">
  PG-13
</Badge>

// Genre tag (custom span, not Badge)
<span className="text-xs text-muted-foreground px-2.5 py-1 bg-muted/30 rounded-sm">
  Action
</span>
```

### 3.5 Vertical Image Card

Displays vertical aspect ratio images with hover interactions.

```tsx
<div className="group relative overflow-hidden transition-transform duration-300 ease-out hover:scale-hover">
    <div className="aspect-2/3 relative overflow-hidden bg-muted/30 rounded-sm">
        <img src={imageUrl} className="object-cover w-full h-full" />

        {/* Optional rank/label badge */}
        {label && (
            <span className="absolute top-2 left-2 text-xs font-medium tracking-wider text-white/90 bg-black/60 backdrop-blur-sm px-2 py-1 rounded-sm">
                {label}
            </span>
        )}

        {/* Hover overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

        {/* Content on hover */}
        <div className="absolute inset-x-0 bottom-0 p-3 translate-y-2 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300">
            <h4 className="font-light text-sm text-white">{title}</h4>
            <span className="text-xs text-white/70">{subtitle}</span>
        </div>
    </div>
</div>
```

**States:**

- Default: Image only, clean appearance
- Hover: Scale up (1.03), reveal gradient overlay, slide up content
- Label visible: Zero-padded number or text in top-left ("01", "New")

**Performance Optimization:**

```css
/* Content visibility for virtualization */
[content-visibility:auto]
[contain-intrinsic-size:120px_180px]

/* Responsive image sizes */
sizes="(max-width: 640px) 120px, (max-width: 768px) 150px, 180px"
```

### 3.6 Hero Header

Hero section for detail pages with backdrop imagery.

**Structure:**

1. Full-width backdrop with gradient overlays
2. Two-column grid: Feature image + Info
3. Type label → Title → Metadata → Description → Stats → Actions

**Backdrop Treatment:**

```tsx
{
    /* Image layer */
}
<div className="absolute inset-0">
    <img src={backdropUrl} className="w-full h-full object-cover opacity-40" />
</div>;

{
    /* Vertical gradient */
}
<div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-background/20" />;

{
    /* Horizontal vignette */
}
<div className="absolute inset-0 bg-gradient-to-r from-background/80 via-transparent to-background/80" />;
```

**Typography Hierarchy:**

```tsx
// Category/Type label
<div className="text-xs tracking-widest uppercase text-muted-foreground">
  {category}
</div>

// Title
<h1 className="text-3xl sm:text-4xl lg:text-5xl font-light leading-tight">
  {title}
</h1>

// Metadata line with separators
<div className="text-sm text-muted-foreground">
  {meta1} <span className="text-border">·</span> {meta2} <span className="text-border">·</span> {meta3}
</div>
```

### 3.7 Stats with Border Accent

Left-border accent pattern for displaying statistics or key-value pairs.

```tsx
<div className="pl-3 border-l border-border/50">
    <div className="text-xs tracking-wider uppercase text-muted-foreground mb-1">{label}</div>
    <div className="text-sm font-medium">{value}</div>
</div>
```

**Grid Layout:**

```tsx
<div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
    {stats.map((stat) => (
        <div key={stat.label} className="pl-3 border-l border-border/50">
            <div className="text-xs tracking-wider uppercase text-muted-foreground mb-1">{stat.label}</div>
            <div className="text-sm font-medium">{stat.value}</div>
        </div>
    ))}
</div>
```

### 3.8 Tab Navigation

Tab-based navigation with underline indicator.

```tsx
// Tab button states
<button className={cn(
  "px-3 sm:px-4 py-2 text-xs sm:text-sm tracking-wide transition-all duration-300",
  "border-b-2 -mb-px",
  isActive
    ? "text-foreground border-foreground"
    : "text-muted-foreground border-transparent hover:text-foreground/70 hover:border-border"
)}>
  {tabLabel}
</button>

// Progress dot states (for carousels)
<button className={cn(
  "h-1 rounded-full transition-all duration-300",
  isActive
    ? "w-6 bg-foreground/70"
    : "w-1.5 bg-foreground/20 hover:bg-foreground/40"
)} />
```

### 3.9 Search Input

Faux input button that opens search dialog, or actual input field.

```tsx
// Faux input (clickable, opens dialog)
<button className="w-full max-w-xl mx-auto flex items-center gap-3 h-12 px-4 text-sm text-muted-foreground bg-muted/30 hover:bg-muted/50 border border-border/50 rounded-sm transition-colors">
  <SearchIcon className="size-4" />
  <span>{placeholder}</span>
  <kbd className="ml-auto hidden sm:inline-flex h-5 items-center gap-0.5 rounded border border-border/50 bg-muted/50 px-1.5 font-mono text-xs text-muted-foreground">
    <span className="text-xs">⌘</span>K
  </kbd>
</button>

// Real input with icon
<div className="relative">
  <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
  <Input className="pl-10" placeholder={placeholder} />
</div>
```

### 3.10 Selectable Card

Card with selection state indicator, useful for multi-select interfaces.

```tsx
<div className="group cursor-pointer w-28 sm:w-32 md:w-36 pt-1">
    <div
        className={cn(
            "aspect-2/3 relative overflow-hidden bg-muted/30 rounded-sm transition-all duration-300",
            isSelected ? "ring-2 ring-primary ring-offset-1 ring-offset-background" : "hover:ring-1 hover:ring-border"
        )}>
        <img className="object-cover w-full h-full transition-transform duration-300 group-hover:scale-hover" />

        {/* Always-visible gradient for text legibility */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

        {/* Label badge - changes style when selected */}
        <span
            className={cn(
                "absolute top-2.5 left-2.5 text-xs font-medium tracking-wider px-2 py-1 rounded-sm backdrop-blur-sm",
                isSelected ? "bg-primary text-primary-foreground" : "bg-black/60 text-white/90"
            )}>
            {label}
        </span>

        {/* Bottom info - always visible */}
        <div className="absolute bottom-0 left-0 right-0 p-3">
            <p className="text-xs text-white/90 font-medium">{primaryInfo}</p>
            <p className="text-xs text-white/60">{secondaryInfo}</p>
        </div>
    </div>
</div>
```

**Key Patterns:**

- `pt-1` on outer container prevents ring clipping
- `ring-offset-1 ring-offset-background` creates visible gap around ring
- Selected state uses `ring-primary` and label switches to `bg-primary`
- Gradient always visible for text readability over images

### 3.11 Horizontal Content Card

Collapsible horizontal card with thumbnail and metadata, useful for list items.

```tsx
<Collapsible>
    <div className="rounded-sm border border-border/50 overflow-hidden">
        <CollapsibleTrigger asChild>
            <button className="w-full text-left group">
                <div className="flex flex-col sm:flex-row">
                    {/* Thumbnail */}
                    <div className="relative w-full sm:w-48 md:w-56 shrink-0 aspect-video bg-muted/30 overflow-hidden">
                        <img className="object-cover w-full h-full transition-transform duration-300 group-hover:scale-hover" />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

                        {/* Label badge */}
                        <span className="absolute top-2.5 left-2.5 text-xs font-medium tracking-wider text-white/90 bg-black/60 backdrop-blur-sm px-2 py-1 rounded-sm">
                            {label}
                        </span>

                        {/* Hover action indicator */}
                        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                            <span className="text-xs tracking-wider uppercase text-white bg-black/60 backdrop-blur-sm px-3 py-1.5 rounded-sm">
                                {actionLabel}
                            </span>
                        </div>
                    </div>

                    {/* Content */}
                    <div className="flex-1 p-4 space-y-2">
                        <h4 className="text-sm font-medium">{title}</h4>
                        <span className="text-xs text-muted-foreground">
                            {meta1} <span className="text-border">·</span> {meta2}
                        </span>
                        {description && <p className="text-xs text-muted-foreground line-clamp-2">{description}</p>}
                    </div>
                </div>
            </button>
        </CollapsibleTrigger>

        <CollapsibleContent>{/* Expandable content */}</CollapsibleContent>
    </div>
</Collapsible>
```

### 3.12 List with Actions

Clean list pattern for items with metadata and action buttons.

```tsx
<div className="border border-border/50 rounded-sm overflow-hidden">
    {/* Loading state */}
    {isLoading && (
        <div className="flex items-center justify-center gap-2 px-4 py-3 border-b border-border/50 bg-muted/20">
            <Loader2 className="size-4 animate-spin text-muted-foreground" />
            <span className="text-xs text-muted-foreground">{loadingMessage}</span>
        </div>
    )}

    {/* List items */}
    {items.map((item) => (
        <div
            key={item.id}
            className="flex flex-col gap-2 px-4 py-3 border-b border-border/50 last:border-0 hover:bg-muted/30 transition-colors">
            <div className="text-sm">{item.title}</div>
            <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                {/* Inline metadata with separators */}
                <span className="text-xs text-muted-foreground">
                    {item.meta1} <span className="text-border">·</span> {item.meta2}
                    {item.meta3 && (
                        <>
                            {" "}
                            <span className="text-border">·</span> {item.meta3}
                        </>
                    )}
                </span>
                {/* Action buttons */}
                <div className="flex gap-2 sm:ml-auto">
                    <Button variant="outline" size="sm">
                        <Icon className="size-4" /> {actionLabel}
                    </Button>
                </div>
            </div>
        </div>
    ))}
</div>
```

**Key Patterns:**

- Inline metadata with `·` separators instead of badges
- Standard small buttons: `size="sm"` (h-8), `size-4` icons
- Subtle borders: `border-border/50`
- Hover state: `hover:bg-muted/30`

### 3.13 Skeleton Loading States

Loading placeholders with pulse animation. Match skeleton dimensions to actual content.

```tsx
// Basic shapes
<Skeleton className="h-[35vh]" />                    // Large hero area
<Skeleton className="aspect-2/3 rounded-sm" />       // Vertical image (3:4 ratio)
<Skeleton className="aspect-video rounded-sm" />     // Video/horizontal image
<Skeleton className="h-10 w-3/4" />                  // Large text (title)
<Skeleton className="h-4 w-full max-w-2xl" />        // Body text line
<Skeleton className="h-3 w-1/2" />                   // Caption text

// Horizontal card skeleton
<div className="rounded-sm border border-border/50 overflow-hidden">
  <div className="flex flex-col sm:flex-row">
    <Skeleton className="w-full sm:w-48 md:w-56 aspect-video rounded-none" />
    <div className="flex-1 p-4 space-y-3">
      <Skeleton className="h-4 w-3/4" />
      <Skeleton className="h-3 w-1/2" />
      <Skeleton className="h-3 w-full" />
    </div>
  </div>
</div>

// List item skeleton
<div className="flex flex-col gap-2 px-4 py-3 border-b border-border/50">
  <Skeleton className="h-4 w-3/4" />
  <div className="flex items-center gap-2">
    <Skeleton className="h-3 w-20" />
    <Skeleton className="h-3 w-16" />
    <Skeleton className="h-3 w-24" />
  </div>
</div>

// Grid of card skeletons
<div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
  {Array.from({ length: 8 }).map((_, i) => (
    <Skeleton key={i} className="aspect-2/3 rounded-sm" />
  ))}
</div>
```

---

## 4. Layout & Grid

### 4.1 Grid System

**Horizontal Scroll Carousel:**

```tsx
<div className="flex w-max gap-3 pb-4">
    {items.map((item) => (
        <div key={item.id} className="w-28 sm:w-32 md:w-36 shrink-0">
            <Card {...item} />
        </div>
    ))}
</div>
```

**Responsive Grid:**

```tsx
// 2-6 columns depending on viewport
<div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
  {items.map(item => <Card key={item.id} {...item} />)}
</div>

// Fixed 3-column feature grid
<div className="grid md:grid-cols-3 gap-12 md:gap-16">
  {features.map(feature => <Feature key={feature.id} {...feature} />)}
</div>
```

**Detail Page Layout:**

```tsx
// Sidebar + content
<div className="grid md:grid-cols-[180px_1fr] lg:grid-cols-[240px_1fr] gap-6 md:gap-8">
    <aside>{/* Sidebar content */}</aside>
    <main>{/* Main content */}</main>
</div>
```

**Asymmetric Layout (Content + Actions):**

```tsx
// Content fills space, actions auto-size
<div className="grid lg:grid-cols-[1fr_auto] gap-8 items-start">
    <div className="space-y-4">{/* Main content */}</div>
    <div className="flex flex-col sm:flex-row lg:flex-col gap-2">{/* Action buttons */}</div>
</div>
```

### 4.2 Section Patterns

**Editorial Section with Accent Line:**

```tsx
<section className="space-y-6">
    {/* Section label with accent */}
    <div className="flex items-center gap-4">
        <div className="h-px w-8 bg-primary" />
        <span className="text-xs tracking-widest uppercase text-muted-foreground">{label}</span>
    </div>

    {/* Section content with asymmetric layout */}
    <div className="grid lg:grid-cols-[1fr_auto] gap-8 items-start">
        <div className="space-y-4">
            <div className="flex items-center gap-3">
                <Icon className="size-5" />
                <h2 className="text-xl font-light">{title}</h2>
            </div>
            <p className="text-sm text-muted-foreground max-w-lg">{description}</p>
        </div>
        <Button>{action}</Button>
    </div>
</section>
```

**Centered Section Divider:**

```tsx
<div className="flex items-center gap-4">
    <div className="h-px flex-1 bg-border/50" />
    <span className="text-xs tracking-widest uppercase text-muted-foreground">{label}</span>
    <div className="h-px flex-1 bg-border/50" />
</div>
```

**Section Divider with Icon Pill:**

```tsx
<div className="flex items-center gap-4 py-2">
    <div className="h-px flex-1 bg-gradient-to-r from-transparent via-border/50 to-border/50" />
    <div className="flex items-center gap-2.5 px-4 py-1.5 rounded-full border border-border/50 bg-card/50 backdrop-blur-sm">
        <Icon className="size-3.5 text-primary" />
        <span className="text-xs tracking-widest uppercase text-muted-foreground">{label}</span>
    </div>
    <div className="h-px flex-1 bg-gradient-to-l from-transparent via-border/50 to-border/50" />
</div>
```

### 4.3 Breakpoints

| Breakpoint | Min Width | Usage                           |
| ---------- | --------- | ------------------------------- |
| `sm`       | 640px     | Mobile landscape, small tablets |
| `md`       | 768px     | Tablets, layout shifts          |
| `lg`       | 1024px    | Desktop, sidebar layouts        |
| `xl`       | 1280px    | Large desktops                  |
| `2xl`      | 1536px    | Ultra-wide displays             |

### 4.4 Container Strategy

**Mobile padding rule:** Never add `px-*` on mobile for private pages. The layout wrapper provides `p-4` (16px). Only add horizontal padding for desktop using `lg:px-6`.

```tsx
// Base padding (private layout wrapper - all authenticated pages inherit this)
<div className="p-4 pt-6">{children}</div>

// Page content sections - desktop padding only
<div className="lg:px-6">{children}</div>  // ✓ correct
<div className="px-4 lg:px-6">{children}</div>  // ✗ wrong - double padding on mobile

// Edge-to-edge scroll on mobile (negates layout p-4)
<ScrollCarousel className="-mx-4 lg:mx-0">
  <div className="... max-lg:px-4">{content}</div>
</ScrollCarousel>

// Page container (public pages)
<div className="px-6 md:px-12 lg:px-20">
  <div className="max-w-6xl mx-auto">
    {children}
  </div>
</div>
```

**Exceptions (no base padding):**

- File explorer - full-width interface, handles own padding
- Hero carousel - bleeds to screen edges with negative margins

### 4.5 Responsive Patterns

**Typography Scaling:**

```tsx
// Hero title
className = "text-3xl sm:text-4xl lg:text-5xl";

// Section title
className = "text-2xl md:text-3xl";

// Body text
className = "text-sm sm:text-base";
```

**Visibility:**

```tsx
// Hide on mobile
className = "hidden sm:flex";

// Show only on mobile
className = "flex md:hidden";
```

**Spacing Adaptation:**

```tsx
// Section padding
className = "py-20 md:py-32";

// Grid gaps
className = "gap-12 md:gap-16";

// Container padding
className = "px-6 md:px-12 lg:px-20";
```

---

## 5. Interaction Patterns

### 5.1 Transitions

**Duration Scale:**

| Duration | Value          | Usage                      |
| -------- | -------------- | -------------------------- |
| Fast     | `duration-200` | Micro-interactions, hovers |
| Normal   | `duration-300` | Standard transitions       |
| Slow     | `duration-500` | Crossfades, reveals        |

**Easing:**

```css
ease-out         /* Default for most interactions */
transition-all   /* Catch-all for multiple properties */
```

### 5.2 Hover States

**Scale Transforms:**

```tsx
// Media cards
hover: scale - [1.03];

// Subtle scale
hover: scale - 105;
```

**Color Transitions:**

```tsx
// Text links
className = "text-muted-foreground hover:text-foreground transition-colors";

// Backgrounds
className = "bg-muted/30 hover:bg-muted/50 transition-colors";
```

**Opacity Reveals:**

```tsx
// Overlay appear
className = "opacity-0 group-hover:opacity-100 transition-opacity duration-300";

// Slide + fade
className = "translate-y-2 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300";
```

### 5.3 Staggered Entrance Animations

Page load reveals use staggered timing for elegant content appearance.

```tsx
// Staggered fade-in with slide
<div
  className="animate-in fade-in-0 slide-in-from-bottom-4"
  style={{
    animationDuration: "600ms",
    animationDelay: "100ms",        // Increment: 0, 100, 200, 300ms
    animationFillMode: "backwards"
  }}
>
  {content}
</div>

// Hero headline split (two-tone)
<h1 className="text-4xl sm:text-5xl lg:text-6xl font-light animate-in fade-in-0 slide-in-from-bottom-4"
    style={{ animationDuration: "600ms" }}>
  Discover
</h1>
<h1 className="text-4xl sm:text-5xl lg:text-6xl font-light text-muted-foreground animate-in fade-in-0 slide-in-from-bottom-4"
    style={{ animationDuration: "600ms", animationDelay: "100ms", animationFillMode: "backwards" }}>
  & Stream
</h1>
```

**Timing Pattern:**

- Element 1: `0ms` delay
- Element 2: `100ms` delay
- Element 3: `200ms` delay
- Element 4: `300ms` delay
- Element 5: `400ms` delay

### 5.4 Ken Burns Effect

Subtle zoom animation for hero carousel images.

```tsx
<div
    className={cn(
        "absolute inset-0 transition-transform duration-[8000ms] ease-out",
        isActive ? "scale-105" : "scale-100"
    )}>
    <img src={image} className="w-full h-full object-cover" />
</div>
```

### 5.5 Focus States

```tsx
className = "outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-3";
```

### 5.6 Loading States

**Pulse Animation:**

```tsx
className = "animate-pulse bg-muted/50";
```

**Skeleton Patterns:**

```tsx
// Match content dimensions
<Skeleton className="aspect-2/3" />      // Vertical image
<Skeleton className="aspect-video" />    // Video shape
<Skeleton className="h-4 w-3/4" />       // Text line
```

---

## 6. UX Rationale

### 6.1 Editorial Minimalism Choice

**Problem:** Modern interfaces often feel cluttered, with competing elements fighting for attention.

**Solution:** Editorial minimalism uses typography hierarchy and negative space to create focus. Wide letter-spacing on labels (`tracking-widest`) creates visual distinction without adding visual weight.

**Result:** Users can scan content quickly; the interface feels premium and intentional.

### 6.2 Section Divider Pattern

**Problem:** Long scrolling pages need structure without heavy visual elements.

**Solution:** Centered text labels with extending horizontal lines create clear sections while maintaining the minimal aesthetic. The lines at 50% opacity feel present but not dominating.

**Result:** Clear page structure that guides users through content hierarchy.

### 6.3 Hover Reveal on Cards

**Problem:** Showing all metadata on cards creates visual noise; hiding it reduces discoverability.

**Solution:** Show only the image by default; reveal title and metadata on hover with a smooth gradient overlay.

**Result:** Clean browse experience with information available on demand.

### 6.4 Left-Border Accent Stats

**Problem:** Traditional stat displays (cards, boxes) can feel heavy and repetitive.

**Solution:** A simple left border creates visual grouping without enclosure, maintaining the open feel of editorial design.

**Result:** Stats are clearly delineated but feel lightweight and modern.

### 6.5 Dot Separators

**Problem:** Traditional separators (slashes, pipes) can feel dated or heavy.

**Solution:** Using the middle dot (`·`) with `text-border` color class creates subtle, elegant separation.

**Result:** Metadata lines feel refined and easy to scan.

### 6.6 Light Weight Headings

**Problem:** Bold headings can feel aggressive in content-focused interfaces.

**Solution:** Light weight (300) headings with larger sizes create hierarchy through size rather than weight.

**Result:** Headlines feel elegant and don't compete with imagery or content.

---

## 7. Accessibility Considerations

### 7.1 Color Contrast

- All text meets WCAG 2.1 AA requirements
- `text-muted-foreground` tested against both light and dark backgrounds
- Interactive elements have sufficient contrast in all states

### 7.2 Focus Visibility

```tsx
className = "focus-visible:ring-3 focus-visible:ring-ring/50";
```

- Focus rings only appear on keyboard navigation
- Ring color matches brand for visual consistency
- 3px ring width ensures visibility

### 7.3 Touch Targets

- Minimum 44x44px for interactive elements on mobile
- Buttons use `h-12` (48px) for primary CTAs
- Card hit areas span full card dimensions

### 7.4 Motion Preferences

```css
@media (prefers-reduced-motion: reduce) {
    .animate-pulse {
        animation: none;
    }
}
```

### 7.5 Screen Reader Support

- Semantic HTML structure (`<section>`, `<nav>`, `<main>`)
- Decorative images use `alt=""`
- Interactive elements have accessible names
- Progress indicators use `aria-label`

---

## 8. Implementation Notes

### 8.1 Tailwind Configuration

**Key Custom Values:**

```css
--radius: 0rem /* Sharp corners by default */ --spacing: 0.25rem /* 4px base unit */ --tracking-normal: -0.01em
    /* Slight negative tracking for body */;
```

### 8.2 Animation Timing

```css
/* Collapsible animations */
--animate-collapsible-down: collapsible-down 0.2s ease-out;
--animate-collapsible-up: collapsible-up 0.2s ease-out;

/* Standard transitions */
transition-all duration-300 ease-out
transition-opacity duration-300
transition-colors
```

### 8.3 Z-Index Layering

| Layer    | Z-Index | Usage                         |
| -------- | ------- | ----------------------------- |
| Backdrop | `z-0`   | Background images             |
| Content  | `z-10`  | Primary content, badges       |
| Overlay  | `z-20`  | Hover overlays, progress dots |
| Modal    | `z-50`  | Dialogs, drawers              |
| Toast    | `z-100` | Notifications                 |

### 8.4 Performance Optimizations

**Content Visibility:**

```tsx
className = "[content-visibility:auto] [contain-intrinsic-size:120px_180px]";
```

**Image Loading:**

```tsx
loading = "lazy"; // Off-screen images
loading = "eager"; // Above-fold images
unoptimized; // External URLs
```

**Component Memoization:**

```tsx
export const Component = memo(function Component(props) { ... });
```

**Dynamic Imports:**

```tsx
const HeavyComponent = dynamic(
    () => import("@/components/feature/heavy-component").then((m) => ({ default: m.HeavyComponent })),
    { loading: () => <Skeleton className="h-64" /> }
);
```

### 8.5 Common Class Patterns

**Section Container:**

```tsx
className = "px-6 py-20 md:px-12 md:py-32 lg:px-20";
```

**Content Wrapper:**

```tsx
className = "max-w-6xl mx-auto";
```

**Editorial Label:**

```tsx
className = "text-xs tracking-widest uppercase text-muted-foreground";
```

**Subtle Border:**

```tsx
className = "border border-border/50";
```

**Muted Background:**

```tsx
className = "bg-muted/30";
```

**Text Link:**

```tsx
className = "text-muted-foreground hover:text-foreground transition-colors";
```

---

## 9. Component Checklist

When creating new components, ensure:

- [ ] Uses semantic HTML elements
- [ ] Supports dark/light themes via CSS variables
- [ ] Has appropriate focus states for keyboard navigation
- [ ] Follows spacing scale (multiples of 4px)
- [ ] Uses `font-light` for headings, standard weight for body
- [ ] Labels use `text-xs tracking-widest uppercase text-muted-foreground`
- [ ] Borders use `border-border/50` for subtle appearance
- [ ] Uses `rounded-sm` (not `rounded-lg`) for cards and containers
- [ ] Prefers inline metadata with `·` separators over badge components
- [ ] Standard shadcn button sizes (sm=`h-8`, default=`h-9`, lg=`h-10`)
- [ ] Transitions use `duration-300` for standard animations
- [ ] Includes loading skeleton if data-dependent
- [ ] Memoized if receiving props that rarely change
- [ ] Responsive at all breakpoints (mobile-first)
- [ ] Selected states use `ring-2 ring-primary` with offset
- [ ] Primary color accents for icons/highlights (use sparingly for visual interest)

---

## 10. Recommended Project Structure

### Directory Organization

```
app/
├── globals.css                 # Theme tokens, CSS variables, base styles
├── (public)/                   # Public routes (no auth required)
│   └── ...
├── (auth)/                     # Authenticated routes (require login)
│   └── (app)/                  # Routes with main layout
│       └── ...
└── api/                        # API routes

components/
├── ui/                         # Base UI primitives (shadcn/ui)
├── common/                     # Shared utility components
└── [feature]/                  # Feature-specific components

hooks/                          # Custom React hooks

lib/
├── actions/                    # Server actions
├── stores/                     # State management
└── utils/                      # Utility functions

public/
└── fonts/                      # Custom font files

docs/                           # Documentation
```

### Component Categories

| Category      | Location             | Purpose                                                            |
| ------------- | -------------------- | ------------------------------------------------------------------ |
| UI Primitives | `components/ui/`     | Base building blocks — buttons, badges, inputs, dialogs, skeletons |
| Common        | `components/common/` | Shared utilities — carousels, loaders, wrappers                    |
| Feature       | `components/[name]/` | Domain-specific components for each feature area                   |

### Naming Conventions

| Type           | Convention                  | Example                                |
| -------------- | --------------------------- | -------------------------------------- |
| Components     | PascalCase                  | `ContentCard`, `HeroSection`           |
| Files          | kebab-case                  | `content-card.tsx`, `hero-section.tsx` |
| Hooks          | camelCase with `use` prefix | `useData`, `useFeature`                |
| CSS Variables  | kebab-case with `--` prefix | `--muted-foreground`, `--border`       |
| Server Actions | camelCase                   | `createItem`, `deleteRecord`           |
| Utilities      | camelCase                   | `formatDate`, `getImageUrl`            |

---

_Design System: Editorial Minimalism v1.0_
