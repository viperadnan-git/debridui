# Editorial Minimalism Design System — Quick Reference

> **Audience:** AI assistants & developers | **Version:** 1.0
> **Use this for:** Quick token lookups, copy-paste patterns, checklist verification
> **Use [ui.md](./ui.md) for:** Deep dives, rationale, accessibility, full component specs

## Core Principles

**Editorial Minimalism** — Refined, magazine-inspired aesthetic:

- **Restraint over excess** — Every element earns its place
- **Typography as hierarchy** — Text styling communicates structure
- **Negative space as design** — Generous breathing room
- **Subtle over loud** — Muted colors, thin borders, gentle transitions

---

## Standard Sizes (shadcn/ui)

### Button Sizes

| Size      | Height | Class    | Usage              |
| --------- | ------ | -------- | ------------------ |
| `sm`      | 32px   | `h-8`    | Compact, secondary |
| `default` | 36px   | `h-9`    | Standard actions   |
| `lg`      | 40px   | `h-10`   | Primary CTAs       |
| `icon`    | 36px   | `size-9` | Icon-only buttons  |

### Input Sizes

| Size      | Height | Class |
| --------- | ------ | ----- |
| `sm`      | 32px   | `h-8` |
| `default` | 36px   | `h-9` |

### Icon Sizes

| Size     | Pixels | Usage                              |
| -------- | ------ | ---------------------------------- |
| `size-4` | 16px   | Default (buttons, inline, list)    |
| `size-5` | 20px   | Section headers, brand icons       |
| `size-6` | 24px   | Page headers (with `text-primary`) |

### Spacing Scale (4px base)

| Token | Value | Usage                     |
| ----- | ----- | ------------------------- |
| `1`   | 4px   | Tight gaps                |
| `2`   | 8px   | Inline spacing            |
| `3`   | 12px  | Button gaps, card padding |
| `4`   | 16px  | Section padding           |
| `6`   | 24px  | Container padding         |
| `8`   | 32px  | Section margins           |

### Border Radius

| Class          | Usage                    |
| -------------- | ------------------------ |
| `rounded-sm`   | Cards, badges, inputs    |
| `rounded-md`   | Buttons (shadcn default) |
| `rounded-full` | Avatars, pills           |

---

## Design Tokens

```tsx
// Typography
"text-xs"; // 12px - captions, labels, metadata
"text-sm"; // 14px - body text, descriptions
"text-base"; // 16px - primary content
"text-lg"; // 18px - emphasized text
"text-xl"; // 20px - subsection headings
"text-2xl md:text-3xl"; // Section headings
"text-3xl sm:text-4xl lg:text-5xl"; // Hero/display headings

// Font weights
"font-light"; // Headings (300)
"font-normal"; // Body text (400)
"font-medium"; // Emphasis, titles (500)

// Editorial label (signature pattern)
"text-xs tracking-widest uppercase text-muted-foreground";

// Backgrounds
"bg-muted/30"; // Default fill
"bg-muted/50"; // Hover state
"bg-black/60 backdrop-blur-sm"; // Overlay badge

// Borders
"border-border/50"; // Subtle borders (50% opacity)
"rounded-sm"; // Standard radius

// Text colors
"text-foreground"; // Primary text
"text-muted-foreground"; // Secondary text
"text-primary"; // Accent (icons, highlights)

// Transitions
"duration-200"; // Fast (micro-interactions)
"duration-300"; // Standard (hovers)
"duration-500"; // Slow (page transitions)
"transition-colors"; // Color changes
"transition-all"; // Multiple properties
```

---

## Component Patterns

### Page Header

```tsx
<div className="space-y-2">
    <div className="flex items-center gap-3">
        <Icon className="size-6 text-primary" strokeWidth={1.5} />
        <h1 className="text-2xl sm:text-3xl font-light">{title}</h1>
    </div>
    <p className="text-sm text-muted-foreground">{description}</p>
</div>
```

### Section Label (Editorial)

```tsx
// With accent line
<div className="flex items-center gap-4">
  <div className="h-px w-8 bg-primary" />
  <span className="text-xs tracking-widest uppercase text-muted-foreground">{label}</span>
</div>

// Centered divider
<div className="flex items-center gap-4">
  <div className="h-px flex-1 bg-border/50" />
  <span className="text-xs tracking-widest uppercase text-muted-foreground">{label}</span>
  <div className="h-px flex-1 bg-border/50" />
</div>
```

### Button Patterns

```tsx
// Standard button with icon
<Button size="default">
  <Icon className="size-4" />
  {label}
</Button>

// Small action button
<Button variant="outline" size="sm">
  <Icon className="size-4" />
  {label}
</Button>

// External link button
<Button variant="ghost" className="text-muted-foreground" asChild>
  <a href={url} target="_blank" rel="noopener noreferrer">
    {label}
    <ArrowUpRight className="size-4 ml-1 opacity-50" />
  </a>
</Button>
```

### Inline Metadata

```tsx
// Prefer this over badges
<span className="text-xs text-muted-foreground">
    {item1} <span className="text-border">·</span> {item2} <span className="text-border">·</span> {item3}
</span>
```

### Stat Block

```tsx
<div className="pl-3 border-l border-border/50">
    <div className="text-xs tracking-wider uppercase text-muted-foreground mb-1">{label}</div>
    <div className="text-sm font-medium">{value}</div>
</div>
```

### Selected State

```tsx
"ring-2 ring-primary ring-offset-1 ring-offset-background";
```

---

## Layout Patterns

### Asymmetric (Content + Actions)

```tsx
<div className="grid lg:grid-cols-[1fr_auto] gap-8 items-start">
    <div className="space-y-4">{content}</div>
    <div className="flex flex-col gap-2">{actions}</div>
</div>
```

### Sidebar + Content

```tsx
<div className="grid md:grid-cols-[200px_1fr] lg:grid-cols-[240px_1fr] gap-6 md:gap-8">
    <aside>{sidebar}</aside>
    <main>{content}</main>
</div>
```

### Responsive Grid

```tsx
<div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
    {items.map((item) => (
        <Card key={item.id} {...item} />
    ))}
</div>
```

### Container

```tsx
// Page section
<section className="px-4 py-12 md:px-6 md:py-20 lg:px-8">
    <div className="max-w-6xl mx-auto">{children}</div>
</section>
```

---

## Templates

### Section with Actions

```tsx
<section className="space-y-6">
    <div className="flex items-center gap-4">
        <div className="h-px w-8 bg-primary" />
        <span className="text-xs tracking-widest uppercase text-muted-foreground">{label}</span>
    </div>
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

### Card with Hover

```tsx
<div className="group cursor-pointer">
    <div className="aspect-[3/4] relative overflow-hidden bg-muted/30 rounded-sm">
        <img className="object-cover w-full h-full transition-transform duration-300 group-hover:scale-105" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        <div className="absolute inset-x-0 bottom-0 p-3 translate-y-2 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300">
            <h4 className="font-light text-sm text-white">{title}</h4>
            <span className="text-xs text-white/70">{subtitle}</span>
        </div>
    </div>
</div>
```

### Horizontal Card

```tsx
<div className="rounded-sm border border-border/50 overflow-hidden">
    <div className="flex flex-col sm:flex-row">
        <div className="relative w-full sm:w-48 shrink-0 aspect-video bg-muted/30">
            <img className="object-cover w-full h-full" />
        </div>
        <div className="flex-1 p-4 space-y-2">
            <h4 className="text-sm font-medium">{title}</h4>
            <span className="text-xs text-muted-foreground">
                {meta1} <span className="text-border">·</span> {meta2}
            </span>
        </div>
    </div>
</div>
```

### List Item

```tsx
<div className="flex flex-col gap-2 px-4 py-3 border-b border-border/50 last:border-0 hover:bg-muted/30 transition-colors">
    <div className="text-sm">{title}</div>
    <div className="flex flex-col sm:flex-row sm:items-center gap-2">
        <span className="text-xs text-muted-foreground">
            {meta1} <span className="text-border">·</span> {meta2}
        </span>
        <div className="flex gap-2 sm:ml-auto">
            <Button variant="outline" size="sm">
                <Icon className="size-4" /> {action}
            </Button>
        </div>
    </div>
</div>
```

---

## Animations

```tsx
// Staggered entrance
<div
  className="animate-in fade-in-0 slide-in-from-bottom-4"
  style={{
    animationDuration: "600ms",
    animationDelay: `${index * 100}ms`,
    animationFillMode: "backwards"
  }}
>

// Hover reveal
"translate-y-2 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300"

// Ken Burns (slow zoom)
"transition-transform duration-[8000ms] ease-out"
isActive ? "scale-105" : "scale-100"
```

---

## Design Rules

### shadcn/ui First (IMPORTANT)

- **Always use shadcn components** for buttons, inputs, badges, cards, dialogs
- **Always use standard shadcn sizes** — never create custom sizes
- Button: `size="sm"` (h-8), `size="default"` (h-9), `size="lg"` (h-10)
- Input/Select: `size="sm"` (h-8), `size="default"` (h-9)
- Icon in buttons: `size-4` (16px)
- **You can override styles** to match editorial minimalism (colors, borders, typography) but **never change sizes or Radix primitives**

### Typography

- Headings: `font-light` (300 weight)
- Labels: `text-xs tracking-widest uppercase text-muted-foreground`
- Body: `text-sm` or `text-base`

### Spacing

- Use Tailwind's 4px scale: `gap-2`, `gap-4`, `gap-6`, `gap-8`
- Vertical rhythm: `space-y-2` → `space-y-4` → `space-y-6` → `space-y-8`

### Colors

- Borders: `border-border/50` (50% opacity)
- Backgrounds: `bg-muted/30` (default), `bg-muted/50` (hover)
- Primary: Use sparingly for icons/highlights

### Borders

- Always `rounded-sm` for cards, badges, inputs
- Never use `rounded-lg` except for specific cases

### Interactions

- Standard: `duration-300` transitions
- Hover: `hover:bg-muted/50` or `hover:text-foreground`
- Selected: `ring-2 ring-primary ring-offset-1 ring-offset-background`
- Focus: `focus-visible:ring-3 focus-visible:ring-ring/50`

### Metadata

- Prefer inline text with `·` separators over badges
- Use Badge only for status indicators

---

## Checklist

**Before Starting:**

- [ ] Check `components/ui/` for existing components
- [ ] Use standard shadcn sizes (don't override)
- [ ] Choose appropriate template

**Typography:**

- [ ] `font-light` for headings
- [ ] `text-xs tracking-widest uppercase` for labels
- [ ] Standard text sizes (`text-xs`, `text-sm`, `text-base`)

**Styling:**

- [ ] `border-border/50` borders
- [ ] `bg-muted/30` backgrounds
- [ ] `rounded-sm` radius
- [ ] No redundant overrides

**Interactions:**

- [ ] `duration-300` transitions
- [ ] Proper hover/focus/selected states

**Layout:**

- [ ] Mobile-first responsive
- [ ] Standard spacing scale
- [ ] Semantic HTML
