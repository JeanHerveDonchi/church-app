# Project Analysis: Church Library Web App (THC Global)

**Last updated:** 2026-06-29

---

## Project Overview

Mobile-first church community library app. French UI. Roles: Guest / User / Admin / Super Admin.
Auth via Google OAuth + email/password (Supabase). Admins publish content (text, YouTube, SoundCloud embeds). Users comment; guests read-only.

---

## Architecture

### Monorepo Structure (pnpm workspace)

```
church-app/
├── pnpm-workspace.yaml
├── package.json              ← workspace root (pnpm dev runs both)
├── .gitignore
├── frontend/                 ← React SPA
│   ├── src/
│   │   ├── lib/api.ts        ← apiFetch() helper (auto-attaches JWT)
│   │   ├── lib/supabase.ts   ← auth-only Supabase client
│   │   ├── providers/
│   │   │   ├── authProvider.tsx
│   │   │   └── supabaseClient.ts
│   │   ├── hooks/
│   │   │   ├── useAuthFlow.ts
│   │   │   ├── useAuthLifecycle.ts
│   │   │   └── useMyProfile.ts
│   │   ├── services/
│   │   │   ├── accounts/delete.service.ts
│   │   │   ├── lifecycle.service.ts
│   │   │   ├── recovery.service.ts
│   │   │   ├── posts/post.service.ts
│   │   │   └── comments/comments.service.ts
│   │   ├── components/
│   │   │   ├── ProtectedRoute.tsx
│   │   │   ├── AccountDeletionDialog.tsx
│   │   │   ├── ConfirmDialog.tsx
│   │   │   └── Navbar.tsx
│   │   └── pages/
│   │       ├── Login.tsx
│   │       ├── Signup.tsx
│   │       ├── Profile.tsx
│   │       ├── ManageUsers.tsx
│   │       ├── RecoverAccount.tsx
│   │       └── ...
│   └── .env                  ← VITE_SUPABASE_* (auth only) + VITE_API_BASE_URL
└── backend/
    ├── src/
    │   ├── index.ts          ← Elysia app, port 3000
    │   ├── lib/supabase.ts   ← anon client + createUserClient(token)
    │   ├── middleware/auth.ts ← JWT validation guard
    │   ├── routes/
    │   │   ├── accounts.ts
    │   │   ├── lifecycle.ts
    │   │   ├── profiles.ts
    │   │   ├── posts.ts
    │   │   └── comments.ts
    │   └── services/
    │       ├── accounts/delete.service.ts
    │       ├── lifecycle.service.ts
    │       ├── recovery.service.ts
    │       ├── posts/post.service.ts
    │       └── comments/comments.service.ts
    └── .env                  ← SUPABASE_URL + SUPABASE_ANON_KEY (gitignored)
```

### Security Model

- Supabase credentials live **only** in `backend/.env` — never exposed to the browser
- Frontend keeps the Supabase client for **auth operations only** (signIn, signUp, signOut, OAuth, onAuthStateChange) — these must run in the browser
- All data queries (profiles, posts, comments, RPCs) go through the backend at `http://localhost:3000`
- Backend validates the JWT from `Authorization: Bearer <token>`, then forwards it to Supabase via `createUserClient(token)` so Row Level Security is fully preserved
- Public routes (published posts, comments by post, lifecycle-by-email) use the anon client

### Backend Routes

| Method | Route | Auth | Description |
|--------|-------|------|-------------|
| GET | `/health` | — | Health check |
| POST | `/api/accounts/delete` | ✅ | Soft-delete account (RPC) |
| POST | `/api/accounts/recover` | ✅ | Recover self-deleted account (RPC) |
| GET | `/api/lifecycle/by-email/:email` | — | Pre-auth email lifecycle check |
| GET | `/api/lifecycle/user/:userId` | ✅ | Full lifecycle state for user |
| POST | `/api/lifecycle/ensure-profile` | ✅ | Auto-recreate missing profile |
| GET | `/api/lifecycle/:userId/auth-state` | ✅ | `{ isDeleted, role }` for authProvider |
| GET | `/api/profiles/me` | ✅ | Current user's profile |
| PUT | `/api/profiles/me` | ✅ | Update name / avatar |
| GET | `/api/profiles/me/post-count` | ✅ | Post count (RPC) |
| GET | `/api/profiles/search` | ✅ (super_admin) | Search by email or name |
| GET | `/api/posts/published` | — | All published posts |
| GET | `/api/posts/:id` | — | Single post |
| GET | `/api/posts/all` | ✅ | All posts (admin) |
| GET | `/api/posts/author/:authorId` | ✅ | Posts by author |
| POST | `/api/posts` | ✅ | Create post |
| PUT | `/api/posts/:id` | ✅ | Update post |
| DELETE | `/api/posts/:id` | ✅ | Delete post |
| GET | `/api/comments/post/:postId` | — | Comments for a post |
| POST | `/api/comments` | ✅ | Create comment |
| DELETE | `/api/comments/:id` | ✅ | Delete comment |

---

## Feature Status: Account Lifecycle

### Account States

| State | `deleted_at` | `deletion_type` | User experience |
|-------|-------------|-----------------|-----------------|
| ACTIVE | NULL | NULL | Full access |
| SELF_DELETED | SET | `self_deleted` | Redirected to `/recover`; can restore |
| ADMIN_DELETED | SET | `admin_deleted` | Redirected to `/login` with block message; no recovery |
| MISSING_PROFILE | n/a | n/a | Auto-recreated via `ensure_user_profile()` RPC |

### Delete Flows — ✅ Working end-to-end

| Flow | Entry | Status |
|------|-------|--------|
| Self-delete | `Profile.tsx` → `AccountDeletionDialog` → `/api/accounts/delete` → sign out → `/login` | ✅ |
| Admin delete | `ManageUsers.tsx` → `AccountDeletionDialog` → `/api/accounts/delete` → remove from list | ✅ |

### Recovery Flow — ✅ Built, ❌ Not wired

| File | What it does | Status |
|------|-------------|--------|
| `backend/src/routes/accounts.ts` | `POST /api/accounts/recover` route | ✅ Built |
| `backend/src/services/recovery.service.ts` | Calls `recover_account()` RPC | ✅ Built |
| `frontend/src/services/recovery.service.ts` | Calls `/api/accounts/recover` | ✅ Built |
| `frontend/src/pages/RecoverAccount.tsx` | Recovery UI, email field, redirect home | ✅ Built, ❌ Unreachable |
| `frontend/src/hooks/useAuthFlow.ts` | Pre-auth email check → redirects to `/recover` | ✅ Built, ❌ Not used |
| `frontend/src/hooks/useAuthLifecycle.ts` | Post-auth check, canAccess, shouldShowRecovery | ✅ Built, ❌ Not used |
| `frontend/src/components/ProtectedRoute.tsx` | Wraps protected pages, enforces lifecycle | ✅ Built, ❌ Not used |

---

## Pending Tasks (Wiring Gap)

Everything is built. These are the remaining wire-up tasks before the feature is fully live:

### 1. Register `/recover` route in `App.tsx`
`RecoverAccount.tsx` is unreachable. The `*` catch-all redirects to `/` first.
- **File:** `frontend/src/App.tsx`
- **Fix:** Add `<Route path="/recover" element={<RecoverAccount />} />`

### 2. Wrap protected routes with `<ProtectedRoute>`
Deleted users with a still-valid JWT can reach protected pages.
- **File:** `frontend/src/App.tsx`
- **Fix:** Wrap `/profile`, `/manage-users`, `/posts/create`, `/posts/post/:id/edit` with `<ProtectedRoute>`

### 3. Wire `useAuthFlow` into Login and Signup
Pre-auth lifecycle check is built but never called. A self-deleted user who tries to log in won't be redirected to `/recover`.
- **Files:** `frontend/src/pages/Login.tsx`, `frontend/src/pages/Signup.tsx`
- **Fix:** Call `useAuthFlow().checkEmailLifecycle(email)` on blur / before submit

### 4. Verify database RPCs exist in Supabase
| RPC | Status |
|-----|--------|
| `delete_account(requester_email, target_user_id?, target_email?)` | ✅ Confirmed working |
| `recover_account()` | ⚠️ Must be verified / created |
| `ensure_user_profile()` | ⚠️ Must be verified / created |
| `get_my_post_count()` | ⚠️ Must be verified / created |

### 5. Update `README.md`
README still says "Account Recovery = v2 feature." Recovery ships in this sprint — update to reflect reality.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend framework | React 19 + TypeScript + Vite |
| Styling | Tailwind CSS 4 |
| State / data fetching | React Query 5 |
| Routing | React Router 7 |
| Icons | Lucide React |
| Auth | Supabase (browser-only) |
| Backend framework | ElysiaJS 1.x + @elysiajs/node |
| Backend runtime | Node.js + tsx |
| Package manager | pnpm (workspace monorepo) |
| Database | Supabase (PostgreSQL + RLS) |

---

## Dev Commands

```bash
# From workspace root — runs both in parallel
pnpm dev

# Individual
cd backend && pnpm dev    # tsx watch src/index.ts → port 3000
cd frontend && pnpm dev   # vite dev server → port 5173
```

---

## Key Design Decisions

- **`auth.users` is never touched on delete** — only `public.profiles` is soft-deleted. Prevents OAuth corruption.
- **`authProvider.tsx` does NOT redirect deleted users** — it detects `isDeleted` but defers all redirects to `useAuthLifecycle`. This is by design.
- **Role is cached per user ID** (`cachedRoleRef`) to avoid redundant backend queries on auth state changes.
- **RLS uses `is_active_user()`** — `deleted_at IS NULL` — to block writes for deleted accounts even if a JWT is still valid.
- **anon key stays public by design** — the Supabase anon key is designed to be safe in the browser for auth-only operations. The security goal is preventing direct DB queries from the browser, not hiding the key itself.
