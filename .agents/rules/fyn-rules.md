# Fyn Finance OS — Agent Rules

## Project Context
Fintech personal finance app for Mexico market. React 18 + TypeScript strict frontend
(complete, 13 screens), connecting to Supabase backend. Development is local-first.

## Non-Negotiable Rules

### Code Style
- TypeScript strict mode. No `any` unless explicitly noted in skill.
- snake_case for database columns, camelCase for TypeScript variables.
- All DB rows must go through explicit mapper functions before use in UI.
- Never use `as any` to bypass type errors — fix the root cause.

### File Safety
- NEVER modify: `src/types/index.ts`, `tailwind.config.ts`, `src/hooks/useFinance.ts`
- NEVER restructure existing screen components — only add data fetching.
- NEVER remove existing UI components — the frontend is complete and working.

### Database
- Every new table MUST have RLS enabled and a policy restricting to `auth.uid() = user_id`.
- `spent` in budgets is NEVER stored — always computed via `get_budget_spent()`.
- Always use `uuid_generate_v4()` for IDs.

### Error Handling
- All Supabase queries must handle `{ data, error }` — log error, show toast on failure.
- PDF parsing errors must be caught and surfaced to user via Toast, never crash the server.
- Optimistic updates must rollback with `error` toast on failure.

### Development Workflow
- Run `supabase db reset` after any migration changes.
- Run `supabase gen types typescript --local > src/types/supabase.ts` after schema changes.
- Server runs on port 3001, frontend on 5173 — never change these ports.

## Commit Convention
`type(scope): description` — e.g., `feat(auth): add Supabase login`, `fix(pdf): BBVA parser date format`
