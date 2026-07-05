# Church Library Web App — THC Global

A church community content platform with guest-accessible public content, role-gated publishing and commenting, and a soft-delete account lifecycle with self-service recovery. French-language UI (single-audience deployment). Built with a Backend-for-Frontend architecture on Supabase.

## Architecture

```
                  ┌──────────────────────────┐
                  │      Supabase (SaaS)      │
                  │  ┌──────────────────────┐ │
                  │  │  PostgreSQL + RLS     │ │
                  │  │  auth.users (identity)│ │
                  │  │  public.profiles      │ │
                  │  │  public.posts         │ │
                  │  │  public.comments      │ │
                  │  └──────────────────────┘ │
                  └──────▲──────────▲─────────┘
                   JWT   │          │  JWT
          ┌──────────────┴──┐   ┌──┴──────────────┐
          │  Backend (3000) │   │  Frontend (5173) │
          │  ElysiaJS 1.x   │   │  React 19        │
          │  TypeScript 5    │   │  TypeScript 5    │
          │                 │   │                  │
          │  · JWT validate │   │  · Auth only     │
          │  · RPC calls    │◄──┤    (signIn,      │
          │  · Email (Resend)│  │     signOut,     │
          │  · Data queries │   │     OAuth,       │
          │                 │   │     onStateChange)│
          └──────────────────┘   └──────────────────┘
```

All data operations route through the backend. The frontend Supabase client handles authentication exclusively — it never executes queries, RPCs, or any database operations against Supabase. This keeps database credentials server-side while preserving Row-Level Security (the backend forwards the user's JWT to Supabase, so RLS sees the real caller).

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 19, TypeScript 5, Vite 6, Tailwind CSS 4 |
| State & caching | TanStack React Query 5 |
| Routing | React Router 7 |
| Rich text | TipTap 3 |
| Icons | Lucide React |
| Backend | ElysiaJS 1.x, TypeScript 5, tsx (dev + runtime) |
| Email | Resend (fire-and-forget, gracefully degraded) |
| Database | PostgreSQL via Supabase, Row-Level Security |
| Auth | Supabase Auth (Google OAuth + email/password) |
| Package manager | pnpm 8+ workspaces |

---

## Prerequisites

- **Node.js** ≥ 20
- **pnpm** ≥ 8 (`npm install -g pnpm`)
- A **Supabase** project with auth enabled (Google OAuth optional)

---

## Getting Started

```bash
git clone <repo-url> church-app
cd church-app
pnpm install
```

### Environment

**`backend/.env`**
```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
PORT=3000
# Email is optional — sendEmail() silently returns if these are missing
RESEND_API_KEY=re_xxxxxxxx
RESEND_FROM_EMAIL=noreply@yourdomain.com
```

**`frontend/.env`**
```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
VITE_API_BASE_URL=http://localhost:3000
```

### Database setup

Run the SQL schema setup in the Supabase SQL Editor (the project has no migration runner in MVP). The database requires:

- **Schema:** `roles`, `profiles`, `posts`, `comments`, `content_types`, `post_statuses` tables with constraints and partial unique indexes
- **Triggers:** `handle_new_user()` for auto-creating profile rows on signup
- **Functions:** `is_active_user()`, `get_user_role()` helpers
- **RLS policies:** ~20 policies covering reads for guests, writes for active authenticated users, admin/super-admin management
- **RPCs:** `delete_account()`, `recover_account()`, `ensure_user_profile()`

The full setup SQL is maintained privately. Contact the project maintainer for access.

> The live database runs `recover_account(user_id uuid, user_email text)` with server-side email confirmation. An earlier reference version (no params, relies on `auth.uid()` only) also exists — both restore the same profile fields.

After your first sign-up, promote yourself to super admin:

```sql
UPDATE profiles
SET role_id = (SELECT id FROM roles WHERE name = 'super_admin')
WHERE email = 'your-email@example.com';
```

---

## Development

```bash
# Start both services (from workspace root)
pnpm dev

# Or individually
pnpm dev:frontend   # Vite → http://localhost:5173
pnpm dev:backend    # tsx watch → http://localhost:3000
```

### Production build
```bash
cd frontend && pnpm build   # TypeScript check + Vite production bundle
cd backend  && pnpm build   # TypeScript check (no emit, tsx runs the source)
```

### Linting
```bash
cd frontend && pnpm lint    # ESLint (flat config with TypeScript + React plugins)
```

---

## Features

### Content types
- **Blog posts** — Rich text via TipTap 3
- **Videos** — YouTube embeds (no direct upload)
- **Audio** — SoundCloud embeds (no direct upload)

External media hosting (YouTube/SoundCloud) was chosen deliberately to avoid storage and bandwidth costs, ensure cross-device playback compatibility, and simplify the backend. In-app recording is explicitly excluded from MVP.

### Roles & permissions

| Role | Capabilities |
|------|-------------|
| Guest | View published content and comments (no account) |
| User | Comment on posts, manage profile |
| Admin | Create, edit, delete posts |
| Super admin | Manage users via email/name search, delete user/admin accounts |

The login page includes an "Entrer en tant qu'invité" link for browsing without authentication.

### Account lifecycle — delete & recover

| State | `deleted_at` | `deletion_type` | Access | Recoverable |
|-------|-------------|-----------------|--------|-------------|
| Active | NULL | NULL | Full | — |
| Self-deleted | SET | `self_deleted` | Redirected to `/recover` | Yes |
| Admin-deleted | SET | `admin_deleted` | Signed out + blocked | No (MVP) |

**Self-delete:** Profile page → warning modal → email confirmation modal (validated in-app, no email link required) → soft delete via `delete_account()` RPC → session cleared → redirected to `/login`.

**Recovery:**
1. User logs in with correct credentials (email/password or Google OAuth)
2. `authProvider` detects `deleted_at != null, deletion_type = 'self_deleted'` → sets `deletionType` in context, keeps session alive
3. `AccountGate` (global route wrapper) sees authenticated + self-deleted → redirects to `/recover`
4. Recovery page shows "Compte désactivé. Souhaitez-vous le restaurer ?" with a "Restaurer" button
5. `recover_account()` RPC restores the profile (clears `deleted_at`, `deletion_type`, nullifies `full_name` to remove the "Deleted User" placeholder)
6. Signs out to clear stale `deletionType` from auth state → navigates to `/login` with a green "Compte restauré avec succès" banner
7. User logs in fresh as an active account

**Gating:** `AccountGate` wraps all routes at the `App` level. Self-deleted authenticated users cannot reach any page except `/recover`, `/login`, and `/signup`. Admin-deleted users are signed out immediately by `authProvider` — if they managed to authenticate, `AccountGate` redirects them to `/login` with a block message.

**Notable design decisions:**
- `auth.users` is never deleted — prevents OAuth identity corruption and auth provider desynchronization
- Email preserved on deleted profiles for recovery lookups (partial unique index: one active profile per email, deleted profiles retain their email)
- `full_name` nullified on recovery to clear the "Deleted User" placeholder set during delete
- Self-deleted users keep their Supabase session (needed for the authenticated `POST /api/accounts/recover` call); admin-deleted users are signed out immediately
- Unauthenticated users who visit `/recover` directly see a login prompt instead of an access-denied screen

### Email notifications

Three transactional templates (Resend): account deleted (self), account disabled (admin), account recovered.

Email is fire-and-forget with graceful degradation:
```typescript
const getClient = (): Resend | null => {
  if (!process.env.RESEND_API_KEY) return null   // ← no crash, no log
  // ...
}

export const sendEmail = (params: SendEmailParams): void => {
  const resend = getClient()
  if (!resend) return   // ← silently skip when key is missing
  // ...
}
```
Email failures never block account operations. Adding a `RESEND_API_KEY` is all that's needed to enable sending — no code changes required.

---

## Security

### Backend-for-Frontend
Supabase credentials (`SUPABASE_URL`, `SUPABASE_ANON_KEY`) are stored exclusively in `backend/.env`. The frontend never sees them. The frontend's Supabase client is scoped to auth-only operations (sign-in, sign-up, sign-out, OAuth, `onAuthStateChange`) — it never queries the database.

### JWT forwarding
The backend extracts the JWT from `Authorization: Bearer <token>`, validates it with Supabase, then creates a per-request Supabase client with that token:
```typescript
export const createUserClient = (token: string) =>
  createClient(supabaseUrl, supabaseAnonKey, {
    global: { headers: { Authorization: `Bearer ${token}` } },
    auth: { persistSession: false },
  })
```
Row-Level Security evaluates against the real user — RLS policies are fully enforced even though queries go through the backend.

### Auth middleware
```typescript
const extractAuth = derive({ as: 'global' }, async ({ headers }) => {
  // Extracts JWT, validates, returns { userId, userEmail, userClient }
  // Returns null values for unauthenticated requests — never throws
})

export const authMiddleware = onBeforeHandle({ as: 'scoped' }, ({ userId, status }) => {
  if (!userId) return status(401, { message: 'Authentification requise.' })
})
```

### Duplicate account prevention
```sql
CREATE UNIQUE INDEX profiles_email_active_unique
  ON profiles (email) WHERE deleted_at IS NULL;
```
One active profile per email. Deleted profiles retain their email for recovery and moderation lookups.

### Database-level lifecycle consistency
```sql
CONSTRAINT deletion_state_consistency CHECK (
  (deleted_at IS NULL AND deletion_type IS NULL)
  OR
  (deleted_at IS NOT NULL AND deletion_type IS NOT NULL)
)
```
Partial lifecycle states are impossible at the database level.

### RLS write enforcement
All write policies check `is_active_user()` — a `SECURITY DEFINER` function that returns true only when the caller's profile has `deleted_at IS NULL`. Even if a deleted user's JWT is still valid, RLS blocks writes. This is defense-in-depth: `AccountGate` handles it at the frontend, RLS catches any edge case at the database.

---

## Database Design Highlights

### Identity decoupling
`auth.users` (authentication) and `public.profiles` (application access) are intentionally decoupled. Their IDs match by convention — enforced by the `handle_new_user()` trigger, not by a foreign key. This enables soft deletion without touching `auth.users` and allows the application to independently determine access based on `profiles.deleted_at`.

### Profile creation flow
```sql
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();
```
New signups (email/password or OAuth) automatically create a profile row with a random approved avatar and `role = 'user'`. Google OAuth avatar URLs are intentionally discarded — they violate the approved-avatars-only constraint and would leak external CDN dependency.

### Partial unique index on email
Allows soft-deleted profiles to retain their email (needed for recovery email lookup and moderation) while preventing duplicate active signups with the same email.

---

## Project Structure

```
church-app/
├── pnpm-workspace.yaml
├── package.json                    # Workspace root with dev scripts
├── .gitignore
├── backend/
│   ├── src/
│   │   ├── index.ts                # ElysiaJS app entry point
│   │   ├── lib/
│   │   │   ├── supabase.ts         # Anon client + createUserClient(token)
│   │   │   └── email.ts            # Lazy-init Resend client + sendEmail()
│   │   ├── middleware/
│   │   │   └── auth.ts             # JWT extraction (global) + enforcement (scoped)
│   │   ├── routes/
│   │   │   ├── accounts.ts         # POST /api/accounts/delete, /recover
│   │   │   ├── lifecycle.ts        # GET auth-state, by-email, user/:userId, ensure-profile
│   │   │   ├── profiles.ts         # GET/PUT /me, /search, /post-count
│   │   │   ├── posts.ts            # CRUD posts + published feed
│   │   │   └── comments.ts         # GET by post, POST, DELETE
│   │   ├── services/               # Per-route business logic
│   │   └── templates/              # 3 HTML email templates (Resend)
│   └── tsconfig.json
├── frontend/
│   ├── src/
│   │   ├── App.tsx                 # AccountGate + route definitions
│   │   ├── providers/
│   │   │   ├── authProvider.tsx    # Auth state, deletionType, role, session caching
│   │   │   └── supabaseClient.ts   # Auth-only Supabase client
│   │   ├── hooks/                  # 15 React Query + custom hooks
│   │   ├── services/               # apiFetch wrappers — no direct Supabase calls
│   │   ├── components/
│   │   │   ├── ProtectedRoute.tsx  # Active-account route guard
│   │   │   ├── AccountDeletionDialog.tsx  # Multi-step: warning → email confirmation
│   │   │   ├── Navbar.tsx          # Role-aware: guests + deleted → "Se connecter"
│   │   │   └── posts/              # PostCard, PostDetail, PostFeed, composer
│   │   ├── pages/                  # Home, Login, Signup, Profile, ManageUsers, Recover
│   │   ├── features/               # Auth helpers, post utilities, profile formatters
│   │   └── lib/api.ts              # Generic fetch with auto-JWT attachment
│   ├── vite.config.ts
│   ├── eslint.config.js            # Flat config: TS + React Hooks + Refresh
│   └── tsconfig.json
```

---

## Testing

The project is in active MVP development. No test suite exists yet. When tests are added, the recommended approach:

- **Backend:** Vitest for unit/integration tests on route handlers and services, with a Supabase local development instance for database-level testing
- **Frontend:** Vitest + React Testing Library for component tests, MSW for API mocking
- **E2E:** Playwright for critical user flows (signup, login, self-delete, recovery)

---

## Browser Support

Mobile-first, responsive design (Tailwind CSS 4). Targeted at modern browsers (Chrome, Firefox, Safari, Edge — last 2 versions). The target audience primarily accesses content on mobile devices.
