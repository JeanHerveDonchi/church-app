# Account Lifecycle: Delete & Recovery

## Goal

Soft-delete accounts with a recoverable path for self-deleted users and a permanent block for admin-deleted users. Preserve all content (posts, comments) under a "Deleted User" label. No hard delete in MVP — deferred to a future iteration.

---

## Architecture Context

This feature operates across both layers of the BFF monorepo:

- **Frontend** (`frontend/src/`) — UI, hooks, React Query mutations, auth-only Supabase client
- **Backend** (`backend/src/`) — ElysiaJS routes, Supabase RPC calls, JWT validation middleware

All data operations (delete RPC, recover RPC, profile lifecycle checks) go through the backend. The frontend never touches Supabase directly for data — only for auth (`signIn`, `signOut`, `onAuthStateChange`).

```
Frontend                           Backend                        Supabase
────────────────────────           ────────────────────────       ────────────────
AccountDeletionDialog
  → delete.service (apiFetch) ──→  POST /api/accounts/delete ──→  delete_account() RPC
  
RecoverAccount page
  → recovery.service (apiFetch) → POST /api/accounts/recover ──→  recover_account() RPC

Login/Signup (useAuthFlow)
  → lifecycle.service (apiFetch) → GET /api/lifecycle/by-email/:email → profiles table

ProtectedRoute (useAuthLifecycle)
  → lifecycle.service (apiFetch) → GET /api/lifecycle/user/:userId → profiles table
                                 → POST /api/lifecycle/ensure-profile → ensure_user_profile() RPC

authProvider
  → apiFetch ─────────────────→  GET /api/lifecycle/:userId/auth-state → profiles table
```

---

## Account States

| State | `deleted_at` | `deletion_type` | Access | Recoverable |
|-------|-------------|-----------------|--------|-------------|
| `active` | NULL | NULL | Full | — |
| `self_deleted` | SET | `self_deleted` | Read-only (same as guest) | ✅ Yes |
| `admin_deleted` | SET | `admin_deleted` | Read-only (same as guest) | ❌ No (MVP) |
| `missing_profile` | — | — | None | Auto-recreated |

**Important:** Deleted users retain the same read-only access as unauthenticated guests by design. They can browse posts and content — they just cannot post, comment, or perform any write action. This is enforced by RLS (`is_active_user()` — `deleted_at IS NULL`) on all write operations, and by the backend middleware checking profile state on authenticated write routes.

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
         │
         ▼
    ┌─────────────┐
    │   ACTIVE    │
    └─────────────┘
```

---

## Delete Flows

### Self-Delete (Profile Page) — ✅ Fully wired

```
Profile.tsx
  → "Supprimer mon compte" button
  → AccountDeletionDialog (warning modal → email confirmation modal)
  → Email validation on blur (must match user's stored email)
  → delete.service.ts → apiFetch POST /api/accounts/delete
  → backend: delete_account(requesterEmail) RPC
      - Sets deleted_at = now()
      - Sets deletion_type = 'self_deleted'
      - Anonymizes: full_name → "Deleted User", avatar_url → null
      - Preserves: email, posts, comments, created_at
  → Frontend: resetLocalSession() → signOut() → redirect /login
  → [PLANNED] Email notification: "Votre compte a été supprimé"
```

### Admin Delete (ManageUsers Page) — ✅ Fully wired

```
ManageUsers.tsx
  → Trash icon on user card
  → AccountDeletionDialog (warning modal → 2-email confirmation modal)
  → Both emails validated on blur (admin's email + target user's email)
  → delete.service.ts → apiFetch POST /api/accounts/delete
  → backend: delete_account(requesterEmail, targetUserId, targetEmail) RPC
      - Validates super_admin permission
      - Validates super_admin cannot delete another super_admin
      - Sets deletion_type = 'admin_deleted'
      - Anonymizes target profile
  → Frontend: removes user from list, shows success message
  → [PLANNED] Email notification to target: "Votre compte a été désactivé"
```

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

## Recovery Flow — ✅ Built, ❌ Not yet wired

The full recovery system is implemented but not connected to the router or login flow yet.

```
Login.tsx (not yet calling useAuthFlow)
  → useAuthFlow.checkEmailLifecycle(email)  [PENDING WIRE-UP]
  → lifecycle.service → apiFetch GET /api/lifecycle/by-email/:email
  → Profile found with deletion_type = 'self_deleted'
  → resetLocalSession() → navigate('/recover', { state: { email } })
  
RecoverAccount.tsx (route /recover not yet registered in App.tsx)
  → Email confirmation field (validated on blur)
  → recovery.service → apiFetch POST /api/accounts/recover
  → backend: recover_account(userId, email) RPC
      - Validates self_deleted state
      - Validates email confirmation
      - Nullifies deleted_at and deletion_type
      - Restores active state
  → Success message → redirect /
  → [PLANNED] Email notification: "Votre compte a été restauré"
```

**Admin-deleted accounts cannot use this flow.** If `checkEmailLifecycle` detects `admin_deleted`, it redirects to `/login` with a block message instead.

---

## Email Notifications (Planned — Not Yet Implemented)

Email service to be added to the backend. Chosen provider: **Resend** (simple REST API, TypeScript SDK, 3k emails/month free tier).

### Planned triggers

| Event | Recipient | Subject |
|-------|-----------|---------|
| Self-delete confirmed | Deleted user | "Votre compte THC Global a été supprimé" |
| Admin-delete | Target user | "Votre compte THC Global a été désactivé" |
| Recovery confirmed | Recovered user | "Votre compte THC Global a été restauré" |

### Planned backend location

```
backend/src/
├── lib/
│   └── email.ts          ← Resend client + send helper
├── templates/
│   ├── account-deleted.ts
│   ├── account-disabled.ts
│   └── account-recovered.ts
└── routes/
    └── accounts.ts       ← trigger email after RPC success
```

Email sends are fire-and-forget — they do not block the RPC response. If the email fails, the operation still succeeds.

---

## Lifecycle Enforcement

### ProtectedRoute — ✅ Built, ❌ Not yet used in App.tsx

Wraps pages that require an active account. Unauthenticated users → `/login`. Deleted users → redirect based on deletion type.

```tsx
// Pending: wrap these routes in App.tsx
<ProtectedRoute><Profile /></ProtectedRoute>
<ProtectedRoute><ManageUsers /></ProtectedRoute>
<ProtectedRoute><CreatePostFlow /></ProtectedRoute>
<ProtectedRoute><EditPost /></ProtectedRoute>
```

### useAuthLifecycle — ✅ Built

Used by `ProtectedRoute`. Calls `GET /api/lifecycle/user/:userId`, handles all states:
- `active` → allow access
- `self_deleted` → redirect `/recover`
- `admin_deleted` → redirect `/login` with block message
- `missing_profile` → call `POST /api/lifecycle/ensure-profile`, retry
- error → redirect `/login`

### useAuthFlow — ✅ Built, ❌ Not yet called in Login/Signup

Pre-auth email check. Call on email blur or before submit. Redirects before login attempt if account is deleted.

```tsx
const { checkEmailLifecycle } = useAuthFlow()
const lifecycle = await checkEmailLifecycle(email)
// auto-redirects if self_deleted or admin_deleted
// returns lifecycle result if active or missing
```

---

## Pending Wiring Tasks

| Task | File | What to do |
|------|------|------------|
| Register `/recover` route | `frontend/src/App.tsx` | Add `<Route path="/recover" element={<RecoverAccount />} />` |
| Wrap protected routes | `frontend/src/App.tsx` | Wrap `/profile`, `/manage-users`, `/posts/create`, `/posts/post/:id/edit` with `<ProtectedRoute>` |
| Wire pre-auth lifecycle check | `frontend/src/pages/Login.tsx` | Call `useAuthFlow().checkEmailLifecycle(email)` on blur / before submit |
| Wire pre-auth lifecycle check | `frontend/src/pages/Signup.tsx` | Same as Login |
| Add email service | `backend/src/lib/email.ts` | Resend client, fire after RPC success in accounts route |
| Create `recover_account()` RPC | Supabase DB | See spec below |
| Create `ensure_user_profile()` RPC | Supabase DB | See spec below |

---

## Database Requirements

### `delete_account()` — ✅ Exists and working
```sql
delete_account(
  requester_email text,
  target_user_id  uuid default null,
  target_email    text default null
) returns jsonb
```

### `recover_account()` — ⚠️ Must be created
```sql
recover_account(
  user_id    uuid,
  user_email text
) returns void
```
Behavior: validate `deletion_type = 'self_deleted'`, validate email match, set `deleted_at = null`, set `deletion_type = null`.

### `ensure_user_profile()` — ⚠️ Must be created
```sql
ensure_user_profile(
  user_id    uuid,
  user_email text
) returns void
```
Behavior: insert into `public.profiles` with `role = 'user'`, `deleted_at = null` if no profile exists for `user_id`.

---

## Service Layer

### Backend routes (`backend/src/routes/accounts.ts`)
- `POST /api/accounts/delete` — auth required, calls `delete_account()` RPC
- `POST /api/accounts/recover` — auth required, calls `recover_account()` RPC

### Backend routes (`backend/src/routes/lifecycle.ts`)
- `GET /api/lifecycle/by-email/:email` — public, used before login
- `GET /api/lifecycle/user/:userId` — auth required, full lifecycle state
- `POST /api/lifecycle/ensure-profile` — auth required, calls `ensure_user_profile()` RPC
- `GET /api/lifecycle/:userId/auth-state` — auth required, returns `{ isDeleted, role }` for authProvider

### Frontend services (`frontend/src/services/`)
- `lifecycle.service.ts` — `fetchProfileByEmail`, `fetchProfileByUserId`, `checkAccountLifecycle`, `resolveAccountLifecycle`, `recreateMissingProfile`
- `recovery.service.ts` — `recoverAccount`, `getRecoveryErrorMessage`
- `accounts/delete.service.ts` — `deleteAccount`, `getDeleteErrorMessage`

All frontend services use `apiFetch()` from `frontend/src/lib/api.ts` — no direct Supabase calls.

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

### Recovery errors
| RPC error | French message |
|-----------|---------------|
| `Account is not self-deleted` | `Ce compte ne peut pas être restauré. Il a été supprimé par un administrateur.` |
| `Not authorized to recover this account` | `Vous ne pouvez restaurer que votre propre compte.` |
| `Email confirmation failed` | `L'adresse e-mail ne correspond pas.` |

### Lifecycle errors
| Case | French message |
|------|---------------|
| Profile sync failure | `Impossible de synchroniser votre profil. Veuillez contacter le support.` |
| Admin-deleted block | `Votre compte a été désactivé par un administrateur.` |

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

---

## Key Design Decisions

**Why soft delete, not hard delete?**
Preserves content history, enables recovery, maintains moderation audit trail. Hard delete is deferred to a future iteration (GDPR right to erasure path).

**Why not touch `auth.users`?**
Deleting from `auth.users` corrupts Google OAuth re-registration. Application-layer access control via `is_active_user()` RLS is sufficient.

**Why do deleted users still have read access?**
By design. Deleted and unauthenticated users have identical read-only access — they can view posts and content but cannot write. This is consistent with the guest experience and avoids special-casing deleted users in the UI.

**Why is admin-delete permanent in MVP?**
A super admin disabling an account is an intentional moderation action, not an accident. Recovery path for admin-deleted accounts adds complexity and an appeals workflow that is out of scope for MVP.

**Why centralized lifecycle hooks?**
Single source of truth for access control. Prevents the same `if (profile.deleted_at)` check being scattered across 10+ components with inconsistent behavior.

**Why Resend for email?**
Simple REST API, first-class TypeScript SDK, generous free tier (3,000/month), no SMTP setup. Fits the backend's ElysiaJS + Node stack cleanly.

---

## Testing Checklist

- [ ] Self-delete flow end-to-end (email validation, RPC, sign out, redirect)
- [ ] Admin-delete flow end-to-end (2-email validation, RPC, list update)
- [ ] Cannot delete another super admin
- [ ] Self-deleted user redirected to `/recover` from Login
- [ ] Admin-deleted user blocked at `/login` with French message
- [ ] Recovery flow end-to-end (email validation, RPC, redirect home)
- [ ] Admin-deleted account cannot use recovery flow
- [ ] ProtectedRoute blocks unauthenticated users
- [ ] ProtectedRoute redirects deleted users correctly
- [ ] Missing profile auto-recreated via `ensure_user_profile()`
- [ ] Session cleared after self-delete
- [ ] Email sent after self-delete
- [ ] Email sent after admin-delete
- [ ] Email sent after recovery
- [ ] All error messages display in French
- [ ] Modal keyboard support (Escape, Tab navigation)
- [ ] Focus management in modals
- [ ] Mobile layout for all modals and recovery page
