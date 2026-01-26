# DebridUI Quick Reference

> Minimal context for AI sessions. Full docs: [ui.md](./ui.md)

## Aesthetic

**Editorial Minimalism** — `font-light` headings, `tracking-[0.3em]` labels, `border-border/50` subtle borders, generous whitespace.

## Tokens

```tsx
// Label (signature)
"text-[10px] tracking-[0.3em] uppercase text-muted-foreground"

// Section divider
<div className="flex items-center gap-4">
  <div className="h-px flex-1 bg-border/50" />
  <span className="text-[10px] tracking-[0.3em] uppercase text-muted-foreground">{label}</span>
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

// Separator
{a} <span className="text-border">·</span> {b}
```

## Components

```tsx
// Button + icon
<Button size="lg" className="h-12 px-6 text-sm tracking-wide">
  {label} <ArrowRightIcon className="size-4 ml-2" />
</Button>

// External link
<Button variant="ghost" className="text-muted-foreground">
  {label} <ArrowUpRightIcon className="size-3 ml-1 opacity-50" />
</Button>

// Badge
<Badge variant="outline" className="text-[10px] px-1.5 py-0 h-5 border-border/50">

// Tag (no component)
<span className="text-xs text-muted-foreground px-2.5 py-1 bg-muted/30 rounded-sm">

// Stat
<div className="pl-3 border-l border-border/50">
  <div className="text-[10px] tracking-[0.2em] uppercase text-muted-foreground mb-1">{label}</div>
  <div className="text-sm font-medium">{value}</div>
</div>

// Rank badge
<span className="text-[10px] font-medium tracking-[0.2em] text-white/90 bg-black/60 backdrop-blur-sm px-2 py-1 rounded-sm">
  {String(rank).padStart(2, '0')}
</span>

// Card hover
"transition-transform duration-300 ease-out hover:scale-[1.03]"
"opacity-0 group-hover:opacity-100 transition-opacity duration-300"

// Skeleton
<Skeleton className="aspect-2/3 rounded-sm" />   // Poster
<Skeleton className="h-10 w-3/4" />              // Title

// External link + icon
<Link className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
  <img src="https://cdn.jsdelivr.net/npm/simple-icons@v14/icons/{icon}.svg" className="size-4 opacity-60 dark:invert" />
  {label}
</Link>
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

1. **Reuse** — `components/ui/`, `components/common/`, `components/mdb/`
2. **Compose** — Combine components, don't duplicate
3. **Extract** — 3+ repeats → new component
4. **Extend** — Use `className`/`variant`, don't modify source
5. **Place** — Generic → `ui/`/`common/`, Domain → `[feature]/`, Page → colocate

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
app/(auth)/(private)/   # Auth required
```

## Performance

```tsx
export const X = memo(function X() { ... });
const X = dynamic(() => import("..."), { loading: () => <Skeleton /> });
"[content-visibility:auto] [contain-intrinsic-size:120px_180px]"
loading="lazy" | loading="eager"
```

## Checklist

- [ ] Semantic HTML
- [ ] Dark/light support
- [ ] Focus: `focus-visible:ring-[3px] focus-visible:ring-ring/50`
- [ ] 4px spacing scale
- [ ] `font-light` headings
- [ ] `border-border/50` borders
- [ ] `duration-300` transitions
- [ ] Skeleton if async
- [ ] Memoize if stable props
- [ ] Mobile-first responsive
