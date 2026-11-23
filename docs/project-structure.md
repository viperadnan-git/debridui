# Project Structure

Where code lives and why. This page states the rules; the folders themselves are the source of truth for what exists — browse `src/` rather than relying on a copied tree.

Based on:

- [Next.js — Project structure and organization](https://nextjs.org/docs/app/getting-started/project-structure) (the `src` folder, route groups, private `_folders`, colocation)
- [Next.js — Route groups](https://nextjs.org/docs/app/api-reference/file-conventions/route-groups)
- [bulletproof-react — Project structure](https://github.com/alan2207/bulletproof-react/blob/master/docs/project-structure.md) (feature folders, unidirectional imports, no barrel files)
- [shadcn/ui — components.json](https://ui.shadcn.com/docs/components-json) (aliases the CLI installs into)

## Top level

Application code lives in `src/` ([Next.js `src` folder](https://nextjs.org/docs/app/api-reference/file-conventions/src-folder)). Config files, `public/`, `docs/` and `drizzle/` (migrations) stay at the repo root. The `@/*` alias maps to `src/*`.

| Folder           | Holds                                                                                |
| ---------------- | ------------------------------------------------------------------------------------ |
| `src/app`        | Routes, layouts and route-only code. Pages stay thin and compose features.           |
| `src/features`   | One folder per domain (e.g. files, links, media). Most code belongs here.            |
| `src/components` | Shared UI used by more than one feature. `ui/` is shadcn, `layout/` is page chrome.  |
| `src/hooks`      | Shared hooks with no domain knowledge.                                               |
| `src/lib`        | Preconfigured libraries and clients: debrid providers, db, auth, API clients, utils. |
| `src/stores`     | App-wide state used by many features.                                                |
| `src/types`      | App-wide types. Domain types live with their domain (feature or `lib/<library>`).    |

## Features

A feature folder only contains the subfolders it needs ([bulletproof-react](https://github.com/alan2207/bulletproof-react/blob/master/docs/project-structure.md)):

```
src/features/<name>/
  actions/      server actions ("use server")
  components/
  hooks/
  stores/
  utils/
```

Name features after what users see (route and UI label), not internal jargon — `links`, not `web-downloads`. Component names follow the feature (`LinkRow`, `LinksProvider`).

## Routes

- Group routes without changing URLs using [route groups](https://nextjs.org/docs/app/api-reference/file-conventions/route-groups): `(public)`, `(auth)/(app)`.
- Code used by a single route goes in a [private folder](https://nextjs.org/docs/app/getting-started/project-structure#private-folders) next to it: `<route>/_components/`. Code shared by every route in a layout goes in that layout's `_components/`.
- Keep `page.tsx` short: data wiring plus a list of sections. When a page grows past a few hundred lines, split its sections into `_components/`.
- Import route-local files relatively (`./_components/...`); everything else through `@/`.

## Where does this go?

1. Used by one route only → `src/app/<route>/_components/`.
2. Belongs to one domain → `src/features/<name>/<kind>/`.
3. Used by several features and has no domain knowledge → `src/components`, `src/hooks`, `src/lib` or `src/stores`.
4. A shadcn primitive → `src/components/ui/` via the shadcn CLI ([installation](https://ui.shadcn.com/docs/cli)).

Start specific and move code outward only when a second consumer appears.

## Import rules

Code flows one way: shared (`components`, `hooks`, `lib`, `stores`, `types`) → `features` → `app` ([unidirectional architecture](https://github.com/alan2207/bulletproof-react/blob/master/docs/project-structure.md)).

- Shared folders never import from `features` or `app`.
- Features may import shared code. Importing another feature is allowed only where composition at the app level isn't practical (e.g. `auth` for `useAuthGuaranteed`); prefer composing in `app`.
- No barrel files. Import the file that defines the symbol; an `index.ts` may define code but must not only re-export.

## Naming

| Type            | Convention              | Example                               |
| --------------- | ----------------------- | ------------------------------------- |
| Files, folders  | kebab-case              | `link-row.tsx`, `use-link-actions.ts` |
| Components      | PascalCase              | `LinkRow`                             |
| Hooks           | camelCase, `use` prefix | `useLinkActions`                      |
| Server actions  | camelCase verbs         | `addUserAccount`                      |
| Private folders | `_` prefix              | `_components`                         |

One component per file when it is exported; small private helpers can share the file with their only consumer. Merge thin wrappers that are only used together.

## Config that depends on paths

Update these when moving folders: `tsconfig.json` (`paths`), `components.json` (shadcn aliases and CSS path), `drizzle.config.ts` (schema paths), `biome.json` (ignored files).
