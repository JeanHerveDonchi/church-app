# Project Analysis: Church Library Web App (THC Global)

**Last updated:** 2026-07-03

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
├── ARCHITECTURE_DELETE_RECOVER.md  ← Account lifecycle architecture doc
├── PROJECT_ANALYSIS.md        ← This file
├── README.md
├── .gitignore
├── frontend/                 ← React SPA
│   ├── src/
│   │   ├── App.tsx            ← AccountGate + all route definitions
│   │   ├── lib/api.ts         ← apiFetch() helper (auto-attaches JWT)
│   │   ├── lib/supabase.ts    ← auth-only Supabase client
│   │   ├── providers/
│   │   │   ├── authProvider.tsx    ← Auth state + deletionType + role
│   │   │   └── supabaseClient.ts   ← Supabase JS client singleton
│   │   ├── hooks/
│   │   │   ├── useAuthFlow.ts      ← Pre-auth email lifecycle check (Login/Signup)
│   │   │   ├── useAuthLifecycle.ts ← Post-auth lifecycle resolution (ProtectedRoute)
│   │   │   ├── useDeleteAccount.ts ← React Query mutation for account deletion
│   │   │   └── useRequireFullName.ts
│   │   ├── services/
│   │   │   ├── accounts/delete.service.ts
│   │   │   ├── lifecycle.service.ts
│   │   │   ├── recovery.service.ts
│   │   │   ├── posts/post.service.ts
│   │   │   └── comments/comments.service.ts
│   │   ├── components/
│   │   │   ├── ProtectedRoute.tsx       ← Route guard (lifecycle check)
│   │   │   ├── AccountDeletionDialog.tsx ← Multi-step delete modal
│   │   │   ├── ConfirmDialog.tsx
│   │   │   └── Navbar.tsx
│   │   └── pages/
│   │       ├── Home.tsx
│   │       ├── Login.tsx            ← Google + email/password, guest entry
│   │       ├── Signup.tsx           ← Email lifecycle check on blur
│   │       ├── Profile.tsx          ← Self-delete trigger
│   │       ├── ManageUsers.tsx      ← Admin-delete trigger
│   │       ├── RecoverAccount.tsx   ← Recovery page for self-deleted users
│   │       └── ...
│   └── .env                  ← VITE_SUPABASE_* (auth only) + VITE_API_BASE_URL
└── backend/
    ├── src/
    │   ├── index.ts          ← Elysia app, port 3000
    │   ├── lib/
    │   │   ├── supabase.ts   ← anon client + createUserClient(token)
    │   │   └── email.ts      ← Resend client + sendEmail() (fire-and-forget)
    │   ├── middleware/auth.ts ← JWT validation guard
    │   ├── templates/
    │   │   ├── account-deleted.ts
    │   │   ├── account-disabled.ts
    │   │   └── account-recovered.ts
    │   ├── routes/
    │   │   ├── accounts.ts   ← /api/accounts/delete + /api/accounts/recover
    │   │   ├── lifecycle.ts  ← /api/lifecycle/* (auth-state, by-email, user, ensure-profile)
    │   │   ├── profiles.ts
    │   │   ├── posts.ts
    │   │   └── comments.ts
    │   └── services/
    │       ├── accounts/delete.service.ts
    │       ├── lifecycle.service.ts
    │       ├── recovery.service.ts
    │       ├── posts/post.service.ts
    │       └── comments/comments.service.ts
    └── .env                  ← SUPABASE_URL, SUPABASE_ANON_KEY, (optional) RESEND_*
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
| POST | `/api/accounts/delete` | ✅ | Soft-delete account (RPC) + send email |
| POST | `/api/accounts/recover` | ✅ | Recover self-deleted account (RPC) + send email |
| GET | `/api/lifecycle/by-email/:email` | — | Pre-auth email lifecycle check |
| GET | `/api/lifecycle/user/:userId` | ✅ | Full lifecycle state for user |
| POST | `/api/lifecycle/ensure-profile` | ✅ | Auto-recreate missing profile |
| GET | `/api/lifecycle/:userId/auth-state` | ✅ | `{ isDeleted, role, deletionType }` for authProvider |
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
| SELF_DELETED | SET | `self_deleted` | Redirected to `/recover` by AccountGate; can restore account |
| ADMIN_DELETED | SET | `admin_deleted` | Signed out immediately by authProvider; blocked from login |
| MISSING_PROFILE | n/a | n/a | Auto-recreated via `ensure_user_profile()` RPC |

### Delete Flows — ✅ Working end-to-end

| Flow | Entry | Status |
|------|-------|--------|
| Self-delete | `Profile.tsx` → `AccountDeletionDialog` → `/api/accounts/delete` → sign out → `/login` | ✅ |
| Admin delete | `ManageUsers.tsx` → `AccountDeletionDialog` → `/api/accounts/delete` → remove from list | ✅ |

### Recovery Flow — ✅ Fully wired

| Component | Role | Status |
|-----------|------|--------|
| `RecoverAccount.tsx` | Recovery UI — prompt, restore button, cancel | ✅ Built + wired |
| `AccountGate` (App.tsx) | Catches all authenticated self-deleted users → redirects to `/recover` | ✅ Built + wired |
| `authProvider.tsx` | Detects self-deleted, keeps session alive for recovery API | ✅ Built + wired |
| `useAuthFlow.ts` | Pre-auth email check on Login/Signup blur (admin_deleted blocks, self_deleted on signup → /recover) | ✅ Built + wired |
| `ProtectedRoute.tsx` | Post-auth lifecycle check for protected pages (profile, manage-users, etc.) | ✅ Built + wired |
| `Navbar.tsx` | Shows "Se connecter" for self-deleted users (prevents navigation loops) | ✅ Built + wired |

### Email Notifications — ✅ Built, gracefully degraded

| Template | Trigger | Status |
|----------|---------|--------|
| `accountDeletedTemplate()` | Self-delete confirmed | ✅ Fire-and-forget, skips silently when key missing |
| `accountDisabledTemplate()` | Admin-delete | ✅ Fire-and-forget, skips silently when key missing |
| `accountRecoveredTemplate()` | Recovery confirmed | ✅ Fire-and-forget, skips silently when key missing |

### Login/Signup — ✅ Fully wired

| Feature | Status |
|---------|--------|
| Google OAuth (`signInWithOAuth`) | ✅ |
| Email/password (`signInWithPassword`) | ✅ |
| Admin-deleted email blocked on blur (Login + Signup) | ✅ |
| Self-deleted email → /recover on Signup blur | ✅ |
| Self-deleted email → login proceeds (AccountGate catches after auth) | ✅ |
| "Entrer en tant qu'invité" link on login → home without auth | ✅ |
| Recovery success → green banner on login page | ✅ |

---

## Routing Architecture

```
App.tsx
├── <AccountGate>                          ← Global lifecycle gate
│   └── <Routes>
│       ├── / (Home)                       ← Public
│       ├── /login                         ← Public (always allowed for AccountGate)
│       ├── /signup                        ← Public (always allowed for AccountGate)
│       ├── /recover                       ← Public (always allowed for AccountGate)
│       ├── /posts                         ← Public
│       ├── /posts/:userId                 ← Public
│       ├── /posts/post/:postId            ← Public
│       ├── /profile (ProtectedRoute)      ← Auth + active account required
│       ├── /manage-users (ProtectedRoute) ← Auth + super_admin required
│       ├── /posts/create (ProtectedRoute) ← Auth + active account required
│       └── /posts/post/:postId/edit (ProtectedRoute) ← Auth + active account required
```

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
| Email | Resend (optional, fire-and-forget, gracefully degrades) |
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
- **AccountGate at App level** — single global gating prevents any deleted authenticated user from accessing unauthorized pages. Eliminates the "Google OAuth bypass" where a deleted user's session survives OAuth redirect and lands on an unguarded page.
- **Self-deleted users keep their session** — `authProvider` sets `deletionType = 'self_deleted'` but does NOT sign out. The session is needed for the recovery API call.
- **Admin-deleted users are signed out immediately** — `authProvider` calls `supabase.auth.signOut()` on detection. No recovery path exists, so no session is needed.
- **Recovery success signs out + redirects to login** — avoids stale `deletionType` in authProvider. User logs in fresh with active state.
- **Role is cached per user ID** (`cachedRoleRef`) to avoid redundant backend queries on auth state changes.
- **RLS uses `is_active_user()`** — `deleted_at IS NULL` — to block writes for deleted accounts even if a JWT is still valid.
- **anon key stays public by design** — the Supabase anon key is designed to be safe in the browser for auth-only operations. The security goal is preventing direct DB queries from the browser, not hiding the key itself.
- **Email is fire-and-forget with graceful degradation** — `sendEmail()` silently returns when no `RESEND_API_KEY` is set. Email failures never block account operations.
- **`full_name` is nullified on recovery** — the delete flow sets it to `"Deleted User"`. On recovery, nullifying it lets the user set a fresh name.
- **Navbar treats deleted users as guests** — shows "Se connecter" instead of "Mon compte" when `deletionType` is set, preventing navigation loops to `/profile`.
