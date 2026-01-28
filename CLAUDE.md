# Code Quality

- **No over-engineering**: Use the simplest solution that works. Avoid premature abstractions, unnecessary helpers, or complex patterns for simple problems
- **Minimal code**: Write the fewest lines necessary. Avoid verbose patterns, redundant variables, and unnecessary intermediate steps
- **Follow linting rules**: Satisfy exhaustive-deps and other lint rules without using eslint-disable unless absolutely necessary
- **Clear comments**: Add comments only when logic isn't self-evident. Explain "why", not "what"
- **Test changes**: Run `bun run lint` to validate code quality before committing
- **Follow design system**: Read `docs/ui-minimal.md` (or `docs/ui.md` for full reference) before implementing or modifying any UI. Use pre-styled shadcn components, editorial tokens, and layout patterns defined there
