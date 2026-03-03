# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Salary Manager

Multi-user personal finance manager: Next.js 14 + Supabase (PostgreSQL) + JWT sessions.

## Commands

```bash
npm run dev        # http://localhost:3000 (requires .env.local)
npm run build
npm run lint
rm -rf .next       # clear stale cache — do this before dev/build if you see module errors
```

Requires `.env.local` (copy from `.env.local.example`):
```
SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=
JWT_SECRET=          # 32+ random chars
```

## Architecture

### Auth & Session Flow
- JWT signed with `JWT_SECRET` (HS256 via `jose`), stored in HTTP-only cookie `sm_session` (30 days)
- Password hashing: SHA-256 with `"slmgr:"` prefix via `crypto.subtle.digest`
- `lib/session.ts` — server-only: `signSession`, `verifySession`, `getSessionFromRequest`, `hashPassword`, cookie helpers
- `lib/db.ts` — server-only: Supabase singleton using service role key (bypasses RLS)
- `lib/auth.ts` — client-only (`"use client"`): fetch wrappers for all auth/data operations (`getSession`, `loginUser`, `logoutUser`, `createUser`, `getUsers`, `deleteUser`, `getUserData`)

### API Routes (`app/api/`)
| Route | Method | Auth | Purpose |
|-------|--------|------|---------|
| `/api/auth/register` | POST | — | First user auto-becomes admin |
| `/api/auth/login` | POST | — | Sets JWT cookie |
| `/api/auth/logout` | POST | — | Clears cookie |
| `/api/auth/me` | GET | — | Returns session or 401 |
| `/api/auth/first` | GET | — | `{ isFirst: bool }` — no users yet? |
| `/api/auth/profile` | GET/PATCH | Required | Get/update username, avatar, password |
| `/api/data/[monthKey]` | GET/PUT/DELETE | Required | User's monthly salary + categories + extras; DELETE resets the month |
| `/api/reports` | GET | Required | All months for the user (excludes `__inv__`), ordered ascending |
| `/api/admin/users` | GET | Admin | List all users |
| `/api/admin/users/[id]` | DELETE | Admin | Delete user (cascades salary_data) |
| `/api/admin/users/[id]/data` | GET | Admin | All months for a user |

### Database (schema.sql)
```sql
users(id UUID PK, username TEXT UNIQUE via LOWER() index, password_hash, role CHECK('admin','user'), avatar TEXT, created_at)
salary_data(user_id FK→users, month_key TEXT, salary NUMERIC, categories JSONB, updated_at TIMESTAMPTZ, PRIMARY KEY(user_id, month_key))
```
RLS is disabled — service role key is used server-side only.

`month_key` is `'YYYY-MM'` for normal months.

`categories` JSONB has two formats for backward compatibility:
- **Legacy** (plain array): old rows stored categories directly as `[...]`
- **Current**: `{ items: Category[], extras: Extra[] }` — both GET and PUT use this shape

The API layer handles the legacy format transparently on read; all writes use the current format.

**`schema.sql` does not include the `avatar` column** — add it manually: `ALTER TABLE users ADD COLUMN IF NOT EXISTS avatar TEXT;`

### Data Flow
1. `SalaryManager.tsx` fetches `/api/data/[monthKey]` on mount and month navigation
2. Edits to salary/categories/extras update React state
3. **600ms debounced PUT** saves to `/api/data/[monthKey]`
4. `justLoadedRef` prevents saving immediately after a fetch (race condition guard)
5. `totalIncome = salary + sum(extras)` — `SummaryCards` and `CategoryList` receive this computed value

### Component Tree
- `SalaryManager` — state owner, month navigation, fetch/save orchestration
  - `MonthNav` — prev/next month buttons + reload
  - `SalaryInput` — inline-editable salary field
  - `ExtrasSection` — add/delete extra income items (bonus, freelance…)
  - `SummaryCards` — total income / spent / remaining
  - `CategoryForm` — add expense category
  - `CategoryList` — edit/delete categories
  - `ExpenseChart` — **pure SVG** donut chart (no Recharts)
- `ReportsManager` — SVG bar charts, month table, Excel export (SheetJS/xlsx), print; fetches `/api/reports`
- `CurrencyConverter` — fiat + crypto converter; fetches live rates from `frankfurter.app` (fiat) and CoinGecko (crypto)
- `ProfileEditor` — change username/password/avatar; re-signs JWT if username changes
- `AdminPanel` — user CRUD + data inspection (admin only)
- `Navbar` — user info (avatar), nav links, logout

### Styling
- Tailwind custom color tokens: `app-bg`, `app-surface`, `app-border`, `app-text`, `app-muted`, `app-accent`, `app-danger`, `app-success`, `app-warning`
- Component layer classes in `globals.css` (`@layer components`): `.field`, `.card`, `.btn`, `.btn-ghost`
- Font: JetBrains Mono via `next/font/google` in `layout.tsx` — never use `@import url()` for fonts
- Custom Tailwind classes **must** be in `@layer components` so Tailwind utilities can override them

## First-Run Setup (Vercel + Supabase)
1. Set env vars in Vercel Project Settings
2. Run `schema.sql` in Supabase SQL Editor
3. Open site → register first user → automatically becomes admin
4. Admin can create additional users via the Users panel
