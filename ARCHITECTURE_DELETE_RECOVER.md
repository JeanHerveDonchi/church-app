# Account Lifecycle: Delete & Recovery

## Goal

Soft-delete accounts with a recoverable path for self-deleted users and a permanent block for admin-deleted users. Preserve all content (posts, comments) under a "Deleted User" label. No hard delete in MVP — deferred to a future iteration.

---

## Architecture Context

This feature operates across all three layers: frontend, backend, and database.

```
Frontend                           Backend                        Supabase
────────────────────────           ────────────────────────       ────────────────
AccountDeletionDialog
  → delete.service (apiFetch) ──→  POST /api/accounts/delete ──→  delete_account() RPC

RecoverAccount page
  → recovery.service (apiFetch) → POST /api/accounts/recover ──→  recover_account() RPC

Login (useAuthFlow on blur)
  → lifecycle.service (apiFetch) → GET /api/lifecycle/by-email/:email → profiles table

Signup (useAuthFlow on blur)
  → lifecycle.service (apiFetch) → GET /api/lifecycle/by-email/:email → profiles table

AccountGate (App.tsx, always active)
  ← reads deletionType from authProvider (no network call)

ProtectedRoute (useAuthLifecycle)
  → lifecycle.service (apiFetch) → GET /api/lifecycle/user/:userId → profiles table
                                  → POST /api/lifecycle/ensure-profile → ensure_user_profile() RPC

authProvider (syncAuthState)
  → apiFetch ─────────────────→  GET /api/lifecycle/:userId/auth-state → profiles table
                                  (now returns isDeleted, role, deletionType)
```

---

## Account States

| State | `deleted_at` | `deletion_type` | Access | Recoverable |
|-------|-------------|-----------------|--------|-------------|
| `active` | NULL | NULL | Full | — |
| `self_deleted` | SET | `self_deleted` | Read-only via `/recover` only | ✅ Yes |
| `admin_deleted` | SET | `admin_deleted` | Immediately signed out + blocked | ❌ No (MVP) |
| `missing_profile` | — | — | None | Auto-recreated |

**Important:** Deleted users and unauthenticated guests have identical read-only access to public routes (home, posts, post detail). They cannot post, comment, or perform any write action. This is enforced by:

1. **AccountGate** (frontend) — all routes wrapped; self-deleted → redirects to `/recover`, admin-deleted → redirects to `/login` with block message
2. **RLS** (`is_active_user()` — `deleted_at IS NULL`) on all write operations in the database
3. **Backend middleware** checking profile state on authenticated write routes

---

## State Transition Diagram

```
              ┌─────────────┐
              │   ACTIVE    │
              └──────┬──────┘
                     │
         ┌───────────┴────────────┐
         │                        │
  User self-deletes         Admin deletes
         │                        │
         ▼                        ▼
┌─────────────────┐     ┌──────────────────┐
│  SELF_DELETED   │     │  ADMIN_DELETED   │
│  (Recoverable)  │     │  (Permanent MVP) │
└────────┬────────┘     └──────────────────┘
         │
  User confirms recovery
  (via /recover page)
         │
         ▼
    ┌─────────────┐
    │   ACTIVE    │
    │  (signs out │
    │   after     │
    │  recovery)  │
    └─────────────┘
```

---

## Delete Flows

### Self-Delete — ✅ Fully wired

1. User clicks "Supprimer mon compte" on `Profile.tsx`
2. `AccountDeletionDialog` opens — warning modal → email confirmation modal
3. Email validated on blur (must match user's stored email)
4. `delete.service.ts` → `apiFetch POST /api/accounts/delete` with `{ requesterEmail }`
5. Backend calls `delete_account(requesterEmail)` RPC:
   - Sets `deleted_at = now()`
   - Sets `deletion_type = 'self_deleted'`
   - Anonymizes: `full_name → "Deleted User"`, `avatar_url → null`
   - Preserves: `email`, `posts`, `comments`, `created_at`
6. `sendEmail()` fires `accountDeletedTemplate()` (fire-and-forget — silently skips if no API key)
7. Frontend: `resetLocalSession()` → `supabase.auth.signOut()` → redirect to `/login`

### Admin Delete — ✅ Fully wired

1. Super admin clicks trash icon on user card in `ManageUsers.tsx`
2. `AccountDeletionDialog` opens — warning modal → 2-email confirmation modal (admin's email + target's email)
3. Both emails validated on blur
4. `delete.service.ts` → `apiFetch POST /api/accounts/delete` with `{ requesterEmail, targetUserId, targetEmail }`
5. Backend calls `delete_account(requesterEmail, targetUserId, targetEmail)` RPC:
   - Validates super_admin permission
   - Validates super_admin cannot delete another super_admin
   - Sets `deletion_type = 'admin_deleted'`
   - Anonymizes target profile
6. `sendEmail()` fires `accountDisabledTemplate()` (fire-and-forget)
7. Frontend: removes user from list, shows success message

### Authorization Rules

| Requester | Target | Allowed |
|-----------|--------|---------|
| User | Self | ✅ |
| Admin | Self | ✅ |
| Super Admin | Self | ✅ |
| Super Admin | User | ✅ |
| Super Admin | Admin | ✅ |
| Super Admin | Super Admin | ❌ Blocked by RPC |
| User | Anyone else | ❌ Blocked by RPC |
| Admin | Anyone else | ❌ Blocked by RPC |

---

## Recovery Flow — ✅ Fully wired

### How a self-deleted user reaches `/recover`

**Email/password login:**
1. User enters email + password → submits form
2. `supabase.auth.signInWithPassword()` — credentials validated by Supabase
3. If wrong password → error message, no redirect
4. If correct password → session created
5. `authProvider.syncAuthState()` fires → calls `GET /api/lifecycle/:userId/auth-state` → detects `isDeleted = true, deletionType = 'self_deleted'`
6. `setDeletionType('self_deleted')` — keeps `user` + `session` intact (needed for recovery API)
7. `AccountGate` catches `user + self_deleted + path !== '/recover'` → redirects to `/recover`

**Google login:**
1. User clicks "Connexion avec Google" → OAuth flow → session created
2. `authProvider.syncAuthState()` fires → same detection as email/password path
3. `AccountGate` redirects to `/recover`

**Signup (self-deleted email):**
1. User enters email in signup form → blur triggers `checkEmailLifecycle()`
2. Profile found with `deletion_type = 'self_deleted'` → immediately navigates to `/recover`

### Recovery page (`/recover`)

**Authenticated user (normal path):**
1. Shows "Compte désactivé. Il semble que votre compte a été désactivé. Souhaitez-vous le restaurer ?"
2. "Restaurer mon compte" button → calls `POST /api/accounts/recover`
3. Backend calls `recover_account(userId, email)` RPC:
   - Validates `deletion_type = 'self_deleted'`
   - Validates email match
   - Sets `deleted_at = null`, `deletion_type = null`, `full_name = null`
   - Restores `role_id` to default (`user`) if null
4. On success: `supabase.auth.signOut()` → `navigate('/login', { state: { recovered: true } })`
5. Login page shows green banner: "Compte restauré avec succès. Vous pouvez vous connecter."
6. User logs in normally as an active account

**Unauthenticated user (edge case):**
1. Shows "Connectez-vous pour restaurer votre compte" with a "Se connecter" button → `/login`

**"Annuler" button:** signs out and navigates to `/login`

### Gating — AccountGate

All routes in `App.tsx` are wrapped in `<AccountGate>`. This is the single global enforcement point:

| Condition | Redirect |
|-----------|----------|
| `user + deletionType === 'self_deleted' + path !== '/recover'` | → `/recover` |
| `user + deletionType === 'self_deleted' + path === '/recover'` | ✅ Allowed |
| `deletionType === 'admin_deleted' + path !== '/login'` | → `/login` with block message |
| No user | ✅ Allowed (guest) |
| Active user | ✅ Allowed |
| `/login` or `/signup` | ✅ Always allowed (prevents redirect loops) |

### Navbar behavior for deleted users

Self-deleted users on `/recover` see "Se connecter" in the navbar (same as guests) instead of "Mon compte". This prevents navigation loops where "Mon compte" → `/profile` → ProtectedRoute → `/recover`.

---

## AccountGate Architecture

```
App.tsx
├── <AccountGate>                          ← Watches deletionType from authProvider
│   └── <Routes>
│       ├── / (Home)                       ← Public — guests & active users
│       ├── /login                         ← Always allowed
│       ├── /signup                        ← Always allowed
│       ├── /recover                       ← Always allowed (self-deleted target)
│       ├── /posts                         ← Public
│       ├── /posts/:userId                 ← Public
│       ├── /posts/post/:postId            ← Public
│       ├── /profile (ProtectedRoute)      ← Active users only
│       ├── /manage-users (ProtectedRoute) ← Active super admins only
│       ├── /posts/create (ProtectedRoute) ← Active users only
│       └── /posts/post/:postId/edit (ProtectedRoute) ← Active users only
```

---

## Email Notifications (Resend)

Email service uses **Resend** with fire-and-forget semantics — email failures never block account operations.

### Architecture

```
backend/src/
├── lib/
│   └── email.ts          ← Lazy-init Resend client + sendEmail() helper
├── templates/
│   ├── account-deleted.ts     ← Sent on self-delete
│   ├── account-disabled.ts    ← Sent on admin-delete
│   └── account-recovered.ts   ← Sent on recovery
└── routes/
    └── accounts.ts       ← Triggers email after RPC success
```

### Graceful degradation

When `RESEND_API_KEY` is not set in `.env`, `getClient()` returns `null` and `sendEmail()` silently returns — no crashes, no logs. Email is fully optional. Add the key whenever ready and emails start sending immediately.

### Templates

| Template | Trigger | Recipient | Subject |
|----------|---------|-----------|---------|
| `accountDeletedTemplate()` | Self-delete confirmed | Deleted user | "Votre compte THC Global a été supprimé" |
| `accountDisabledTemplate()` | Admin-delete | Target user | "Votre compte THC Global a été désactivé" |
| `accountRecoveredTemplate()` | Recovery confirmed | Recovered user | "Votre compte THC Global a été restauré" |

---

## Lifecycle Enforcement

### AccountGate (App.tsx)
Top-level wrapper. Reads `deletionType` from `authProvider`. Catches all deleted authenticated users before any route renders. Self-deleted → `/recover`. Admin-deleted → `/login` with block message.

### ProtectedRoute (wraps `/profile`, `/manage-users`, `/posts/create`, `/posts/post/:id/edit`)
Uses `useAuthLifecycle.checkAndResolve()` for defense-in-depth:
- Unauthenticated → `/login`
- `active` → allow access
- `self_deleted` → redirect `/recover`
- `admin_deleted` → redirect `/login` with block message
- `missing_profile` → auto-recreate via `ensure_user_profile()`, retry
- Error → redirect `/login`

### Navbar
Self-deleted users (via `deletionType` from `authProvider`) see "Se connecter" instead of "Mon compte". Prevents navigation loops to `/profile`.

---

## Service Layer

### Backend routes (`backend/src/routes/accounts.ts`)
- `POST /api/accounts/delete` — auth required, calls `delete_account()` RPC, sends email
- `POST /api/accounts/recover` — auth required, calls `recover_account()` RPC, sends email

### Backend routes (`backend/src/routes/lifecycle.ts`)
- `GET /api/lifecycle/by-email/:email` — public, used before login/signup
- `GET /api/lifecycle/user/:userId` — auth required, full lifecycle state
- `POST /api/lifecycle/ensure-profile` — auth required, calls `ensure_user_profile()` RPC
- `GET /api/lifecycle/:userId/auth-state` — auth required, returns `{ isDeleted, role, deletionType }` for authProvider

### Frontend services (`frontend/src/services/`)
- `lifecycle.service.ts` — `fetchProfileByEmail`, `fetchProfileByUserId`, `checkAccountLifecycle`, `resolveAccountLifecycle`, `recreateMissingProfile`
- `recovery.service.ts` — `recoverAccount`, `getRecoveryErrorMessage`
- `accounts/delete.service.ts` — `deleteAccount`, `getDeleteErrorMessage`

All frontend services use `apiFetch()` from `frontend/src/lib/api.ts` — no direct Supabase calls.

### Frontend hooks
- `useAuthLifecycle.ts` — Post-auth lifecycle resolution (used by ProtectedRoute)
- `useAuthFlow.ts` — Pre-auth email check on blur (used by Login/Signup)
- `useDeleteAccount.ts` — React Query mutation for account deletion

### Frontend providers
- `authProvider.tsx` — Supabase auth state + deletionType + role. Self-deleted users keep `user` intact (needed for recovery API calls). Admin-deleted users are immediately signed out.

---

## Error Messages (French)

### Delete errors
| RPC error | French message |
|-----------|---------------|
| `Authentication required` | `Vous devez être connecté pour supprimer votre compte.` |
| `Requester profile not found` | `Votre profil n'existe pas.` |
| `Requester email confirmation failed` | `L'adresse e-mail ne correspond pas.` |
| `Target profile not found` | `Le profil cible n'existe pas.` |
| `Target account is already deleted` | `Ce compte est déjà supprimé.` |
| `Not authorized to delete this account` | `Vous n'êtes pas autorisé à supprimer ce compte.` |
| `Target email confirmation failed` | `L'adresse e-mail du compte cible ne correspond pas.` |
| `Cannot delete another super admin` | `Vous ne pouvez pas supprimer un autre super-administrateur.` |
| `Deleted accounts cannot perform this action` | `Vous ne pouvez pas effectuer cette action avec un compte supprimé.` |

### Recovery errors
| RPC error | French message |
|-----------|---------------|
| `Account is not self-deleted` | `Ce compte ne peut pas être restauré. Il a été supprimé par un administrateur.` |
| `Not authorized to recover this account` | `Vous ne pouvez restaurer que votre propre compte.` |
| `Email confirmation failed` | `L'adresse e-mail ne correspond pas.` |
| `Account is already active` | `Ce compte est déjà actif.` |
| `Profile not found` | `Le profil n'existe pas.` |
| `Authentication required` | `Vous devez être connecté pour restaurer votre compte.` |

### Lifecycle / UI messages
| Case | French message |
|------|---------------|
| Profile sync failure | `Impossible de synchroniser votre profil. Veuillez contacter le support.` |
| Admin-deleted block | `Votre compte a été désactivé par un administrateur.` |
| Recovery success (login page) | `Compte restauré avec succès. Vous pouvez vous connecter.` |
| Unauthenticated on `/recover` | `Connectez-vous pour restaurer votre compte.` |
| Recovery prompt | `Il semble que votre compte a été désactivé. Souhaitez-vous le restaurer ?` |

---

## Data Preservation Policy

When an account is deleted:

| Field | Action |
|-------|--------|
| `full_name` | → `"Deleted User"` |
| `avatar_url` | → `null` |
| `deleted_at` | → `now()` |
| `deletion_type` | → `'self_deleted'` or `'admin_deleted'` |
| `email` | ✅ Preserved (recovery + audit) |
| `created_at` | ✅ Preserved |
| Posts | ✅ Preserved (author_id intact) |
| Comments | ✅ Preserved (author_id intact) |
| `auth.users` row | ✅ Never touched |

When an account is recovered:

| Field | Action |
|-------|--------|
| `deleted_at` | → `null` |
| `deletion_type` | → `null` |
| `full_name` | → `null` (clears "Deleted User" placeholder — user sets a fresh name) |
| `deleted_auth_id` | → `null` |
| `role_id` | → Restored to default `user` if null |

---

## Database RPCs

### `delete_account()` — ✅ Active
```sql
delete_account(
  requester_email text,
  target_user_id  uuid default null,
  target_email    text default null
) returns jsonb
```

### `recover_account()` — ✅ Active
```sql
recover_account(
  user_id    uuid,
  user_email text
) returns void
```
Validates `deletion_type = 'self_deleted'`, validates email match, restores account, nullifies `full_name`.

### `ensure_user_profile()` — ✅ Active
```sql
ensure_user_profile(
  user_id    uuid,
  user_email text
) returns void
```
Inserts into `public.profiles` with `role = 'user'`, `deleted_at = null` if no profile exists for `user_id`.

---

## Key Design Decisions

**Why soft delete, not hard delete?**
Preserves content history, enables recovery, maintains moderation audit trail. Hard delete is deferred to a future iteration (GDPR right to erasure path).

**Why not touch `auth.users`?**
Deleting from `auth.users` corrupts Google OAuth re-registration. Application-layer access control via `is_active_user()` RLS is sufficient.

**Why AccountGate at the App level?**
Single source of truth for deleted-user gating. Prevents the "Google OAuth bypass" where a deleted user's session survives OAuth redirect and lands on an unguarded public page. AccountGate catches all paths.

**Why keep `user` intact for self-deleted users?**
The recovery API (`POST /api/accounts/recover`) requires authentication. Self-deleted users must have a valid session to call it. Admin-deleted users are signed out immediately (no recovery path exists).

**Why sign out after recovery?**
Recovery changes the profile state in the database, but the frontend's `authProvider` still has `deletionType = 'self_deleted'` cached. Signing out resets auth state cleanly; logging back in fetches the fresh active state naturally.

**Why `full_name = null` on recovery?**
The delete flow sets `full_name` to `"Deleted User"`. On recovery, we nullify it so the user sets a fresh name via their profile. Preserving "Deleted User" would be confusing.

**Why is admin-delete permanent in MVP?**
A super admin disabling an account is an intentional moderation action, not an accident. Recovery path for admin-deleted accounts adds complexity and an appeals workflow that is out of scope for MVP.

**Why Resend for email?**
Simple REST API, first-class TypeScript SDK, generous free tier (3,000/month), no SMTP setup. Fits the backend's ElysiaJS + Node stack cleanly. Gracefully degrades when API key is missing.

**Why fire-and-forget emails?**
Email failures must never block account operations (delete, recover). If Resend is down or the API key is missing, the user's account operation still succeeds.

---

## Testing Checklist

- [ ] Self-delete flow end-to-end (email validation, RPC, sign out, redirect to /login)
- [ ] Admin-delete flow end-to-end (2-email validation, RPC, list update)
- [ ] Cannot delete another super admin
- [ ] Self-deleted email/password user: wrong password → error, correct password → /recover
- [ ] Self-deleted Google user: OAuth success → /recover
- [ ] Self-deleted user sees recovery prompt, not "Accès refusé"
- [ ] Self-deleted user with valid session cannot access home (AccountGate → /recover)
- [ ] Self-deleted user Navbar shows "Se connecter", not "Mon compte"
- [ ] Admin-deleted user signed out immediately → blocked at login on blur
- [ ] Recovery flow end-to-end → sign out → green success banner on login
- [ ] Recovery page shows login prompt when unauthenticated
- [ ] Admin-deleted account cannot use recovery flow
- [ ] Recovered account: full_name is null (not "Deleted User")
- [ ] Recovered account: can log in normally as active user
- [ ] "Annuler" on recovery page → sign out → /login
- [ ] ProtectedRoute blocks unauthenticated users
- [ ] ProtectedRoute redirects deleted users correctly
- [ ] Missing profile auto-recreated via `ensure_user_profile()`
- [ ] Guest can browse home, posts, post detail
- [ ] Guest navbar shows "Se connecter"
- [ ] "Entrer en tant qu'invité" on login page → home without auth
- [ ] Session cleared after self-delete
- [ ] Session cleared after admin-delete detection
- [ ] Email silently skipped when RESEND_API_KEY not set
- [ ] All error messages display in French
- [ ] Modal keyboard support (Escape, Tab navigation)
- [ ] Mobile layout for all modals and recovery page
