# Coding Style

Short, project-wide rules. Detailed framework guidance lives in the skills.

## Language

- TypeScript everywhere (`strict: true`).
- No `any`. Use `unknown` + narrow, or write the type.
- Prefer `type` aliases over `interface` unless declaration-merging is needed.

## Naming

- Files: `kebab-case.ts`. React components: `PascalCase.tsx`.
- Variables/functions: `camelCase`. Constants: `SCREAMING_SNAKE_CASE`.
- Booleans start with `is`/`has`/`should`.

## Imports

- Order: node builtins, third-party, monorepo packages (`@app/*`), relative.
- No default exports for components or utilities (re-export named).

## Errors

- Throw `Error` subclasses with descriptive messages. Never `throw "string"`.
- Server boundaries return typed results; never leak stack traces to clients.

## State and immutability

- Treat all objects/arrays as immutable. Spread, don't mutate.
- Reducers are pure.

## Async

- `async`/`await` only. No raw promise chains except at the worker entrypoint.
- Use `Promise.all` for independent work.

## Comments

- Explain *why*, not *what*. The code already says what.

## Tests

- Vitest. Co-located `__tests__` folder per package.
- Test public behavior, not internals.
