# DebridUI Quick Reference

> Minimal context for AI sessions. Full docs: [ui.md](./ui.md)

**Rule:** Always use the `frontend-design` skill when creating or modifying UI components.

**⚠️ Maintainer Note:** This is a condensed version of [ui.md](./ui.md). Always update the main `ui.md` first, then sync changes here. Never modify this file without updating the source doc.

## Aesthetic

**Editorial Minimalism** — `font-light` headings, `tracking-widest` labels, `border-border/50` subtle borders, generous whitespace.

## shadcn/ui Components (Pre-Styled)

**IMPORTANT:** All `components/ui/` primitives are pre-styled for editorial minimalism. Read components before implementing new UI.

| Component    | Pre-baked Defaults                                                                                                                     |
| ------------ | -------------------------------------------------------------------------------------------------------------------------------------- |
| Button       | `rounded-sm`, `duration-300`, sizes: sm=`h-8`, default=`h-9`, lg=`h-10`, icon=`size-9`, destructive uses `text-destructive-foreground` |
| Input        | `rounded-sm`, `border-border/50`, `h-9`, `duration-300`                                                                                |
| Badge        | `rounded-sm`, `text-xs`, `px-2.5 py-0.5`, default=`outline`, destructive uses `text-destructive-foreground`                            |
| Card         | `rounded-sm`, `border-border/50`, title=`font-light`                                                                                   |
| Dialog       | `rounded-sm`, `border-border/50`, title=`font-light text-xl`                                                                           |
| Select       | `rounded-sm`, `border-border/50`, `duration-300`, sizes: sm=`h-8`, default=`h-9`                                                       |
| DropdownMenu | `rounded-sm`, `border-border/50`, items=`hover:bg-muted/50`                                                                            |
| Skeleton     | `rounded-sm`, `bg-muted/50`                                                                                                            |
| Separator    | `bg-border/50`                                                                                                                         |

```tsx
// ✓ Use directly - styles are baked in
<Button variant="outline" size="sm">Add</Button>
<Badge>PG-13</Badge>
<Input placeholder="Search..." />

// ✗ Don't add redundant overrides
<Button className="rounded-sm">        // Already in base
<Badge className="h-5 text-xs">   // Already in base
```

## Tokens

```tsx
// Editorial label (signature) - ONLY with tracking + uppercase
"text-xs tracking-widest uppercase text-muted-foreground"

// Content text (descriptions, metadata, helper text) - use text-xs minimum
"text-xs text-muted-foreground"

// Section divider
<div className="flex items-center gap-4">
  <div className="h-px flex-1 bg-border/50" />
  <span className="text-xs tracking-widest uppercase text-muted-foreground">{label}</span>
  <div className="h-px flex-1 bg-border/50" />
</div>

// Headings
"text-3xl sm:text-4xl lg:text-5xl font-light"   // Hero
"text-2xl md:text-3xl font-light"               // Section

// Backgrounds & borders
"bg-muted/30"        // Fill
"bg-muted/50"        // Hover
"border-border/50"   // Subtle

// Text
"text-muted-foreground"                                       // Secondary
"text-muted-foreground hover:text-foreground transition-colors" // Link

// Primary accents (use sparingly for visual interest)
"text-primary"           // Icons, highlights, interactive elements
"bg-primary/10"          // Subtle primary background
"border-primary/50"      // Accent borders

// Separator
{a} <span className="text-border">·</span> {b}
```

## Components

```tsx
// Page header with icon accent
<div className="flex items-center gap-3">
  <Icon className="size-6 text-primary" strokeWidth={1.5} />
  <h1 className="text-2xl sm:text-3xl font-light">{title}</h1>
</div>
<p className="text-sm text-muted-foreground">{description}</p>

// Button + icon (standard shadcn sizes)
<Button size="lg" className="tracking-wide">
  {label} <ArrowRightIcon className="size-4 ml-2" />
</Button>

// External link
<Button variant="ghost" className="text-muted-foreground">
  {label} <ArrowUpRightIcon className="size-3 ml-1 opacity-50" />
</Button>

// Badge (default=outline, pre-styled)
<Badge>{label}</Badge>

// Tag (no component)
<span className="text-xs text-muted-foreground px-2.5 py-1 bg-muted/30 rounded-sm">

// Stat
<div className="pl-3 border-l border-border/50">
  <div className="text-xs tracking-wider uppercase text-muted-foreground mb-1">{label}</div>
  <div className="text-sm font-medium">{value}</div>
</div>

// Rank badge
<span className="text-xs font-medium tracking-wider text-white/90 bg-black/60 backdrop-blur-sm px-2 py-1 rounded-sm">
  {String(rank).padStart(2, '0')}
</span>

// Card hover
"transition-transform duration-300 ease-out hover:scale-hover"
"opacity-0 group-hover:opacity-100 transition-opacity duration-300"

// Skeleton
<Skeleton className="aspect-2/3 rounded-sm" />   // Poster
<Skeleton className="h-10 w-3/4" />              // Title

// External link + icon
<Link className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
  <img src="https://cdn.jsdelivr.net/npm/simple-icons@v14/icons/{icon}.svg" className="size-4 opacity-60 dark:invert" />
  {label}
</Link>

// Inline metadata (prefer over badges)
<span className="text-xs text-muted-foreground">
  {resolution} <span className="text-border">·</span> {size} <span className="text-border">·</span> {addon}
</span>

// Cached indicator (inline, not badge)
<span className="inline-flex items-center gap-1 text-xs tracking-wide text-green-600">
  <Zap className="size-3" /> Cached
</span>

// Small action button (standard sm size: h-8, text-xs)
<Button variant="outline" size="sm">
  <Icon className="size-4" /> {label}
</Button>

// Season/Episode label badge
<span className="text-xs font-medium tracking-wider px-2 py-1 rounded-sm bg-black/60 backdrop-blur-sm text-white/90">
  {String(number).padStart(2, '0')}
</span>

// Selected state ring
"ring-2 ring-primary ring-offset-1 ring-offset-background"
```

## Layout

**Mobile padding rule:** Never add `px-*` on mobile for private pages. Layout provides `p-4` (16px). Only add horizontal padding for desktop: `lg:px-6`.

```tsx
// Base padding (private layout wrapper)
<div className="p-4 pt-6">{children}</div>

// Page content sections - desktop padding only
<div className="lg:px-6">{children}</div>  // ✓ correct
<div className="px-4 lg:px-6">{children}</div>  // ✗ wrong - double padding on mobile

// Edge-to-edge scroll on mobile (negates layout p-4)
<ScrollCarousel className="-mx-4 lg:mx-0">
  <div className="... max-lg:px-4">{content}</div>
</ScrollCarousel>

// Exceptions - no padding:
// - File explorer (full-width interface)
// - Hero carousel (bleeds to edges)

// Page section (public pages)
<section className="px-6 py-20 md:px-12 md:py-32 lg:px-20">
  <div className="max-w-6xl mx-auto">{children}</div>
</section>

// Detail grid
<div className="grid md:grid-cols-[180px_1fr] lg:grid-cols-[240px_1fr] gap-6 md:gap-8">

// Backdrop
<div className="absolute inset-0 w-screen">
  <img className="w-full h-full object-cover opacity-40" />
</div>
<div className="absolute inset-0 w-screen bg-gradient-to-t from-background via-background/60 to-background/20" />
<div className="absolute inset-0 w-screen bg-gradient-to-r from-background/80 via-transparent to-background/80" />
```

## Transitions

```tsx
duration - 200; // Fast
duration - 300; // Standard
duration - 500; // Slow

("translate-y-2 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300");
```

## Rules

1. **Read First** — Before implementing, read `components/ui/` files to understand pre-baked styles
2. **Reuse** — Always use shadcn components from `components/ui/`, then `components/common/`, `components/mdb/`
3. **Compose** — Combine components, don't duplicate
4. **Extract** — 3+ repeats → new component
5. **Extend** — Use `className`/`variant` for customization, don't add redundant base styles
6. **Place** — Generic → `ui/`/`common/`, Domain → `[feature]/`, Page → colocate

## Structure

```
components/
├── ui/          # Primitives
├── common/      # Utilities
├── mdb/         # Media
├── explorer/    # Files
├── preview/     # Previews
├── accounts/    # Accounts
├── auth/        # Auth
└── sidebar/     # Nav

app/(public)/           # No auth
app/(auth)/             # Authenticated (require login)
app/(auth)/(app)/       # With sidebar layout
```

## Cards

```tsx
// Season card - poster with overlay info
<div className="group cursor-pointer w-28 sm:w-32 md:w-36 pt-1">
  <div className={cn(
    "aspect-2/3 relative overflow-hidden bg-muted/30 rounded-sm transition-all duration-300",
    isSelected ? "ring-2 ring-primary ring-offset-1 ring-offset-background" : "hover:ring-1 hover:ring-border"
  )}>
    <img className="object-cover w-full h-full transition-transform duration-300 group-hover:scale-hover" />
    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
    {/* Label top-left, info bottom */}
  </div>
</div>

// Episode card - horizontal with collapsible
<div className="rounded-sm border border-border/50 overflow-hidden">
  <div className="flex flex-col sm:flex-row">
    <div className="relative w-full sm:w-48 md:w-56 shrink-0 aspect-video bg-muted/30" />
    <div className="flex-1 p-4 space-y-2">
      <h4 className="text-sm font-medium">{title}</h4>
      <span className="text-xs text-muted-foreground">{date} · {runtime}m</span>
    </div>
  </div>
</div>

// Sources list item
<div className="flex flex-col gap-2 px-4 py-3 border-b border-border/50 last:border-0 hover:bg-muted/30">
  <div className="text-sm">{title}</div>
  <div className="text-xs text-muted-foreground">{meta} · {meta} · {addon}</div>
</div>
```

## Performance

```tsx
export const X = memo(function X() { ... });
const X = dynamic(() => import("..."), { loading: () => <Skeleton /> });
"[content-visibility:auto] [contain-intrinsic-size:120px_180px]"
loading="lazy" | loading="eager"
```

## Checklist

- [ ] **Read `components/ui/` first** — check what's already styled
- [ ] Use shadcn components — don't rebuild primitives
- [ ] No redundant overrides — styles are pre-baked
- [ ] Semantic HTML
- [ ] Dark/light support
- [ ] Focus: `focus-visible:ring-3 focus-visible:ring-ring/50`
- [ ] 4px spacing scale
- [ ] `font-light` headings
- [ ] `border-border/50` borders
- [ ] `rounded-sm` (not `rounded-lg`)
- [ ] Inline metadata with `·` separators (not badges)
- [ ] Standard shadcn button sizes (sm=`h-8`, default=`h-9`, lg=`h-10`)
- [ ] `duration-300` transitions
- [ ] Skeleton if async
- [ ] Memoize if stable props
- [ ] Mobile-first responsive
- [ ] Selected: `ring-2 ring-primary ring-offset-1`
- [ ] Primary accents for icons/highlights (sparingly)
