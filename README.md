# 📱 Church Library Web App (MVP)

A mobile-first web application that allows a church community to share and access spiritual content including text posts, videos, and audio messages.

---

## 🚀 Overview

This platform enables:
- Admins to publish content (text, video, audio)
- Users to engage via comments
- Guests to freely access content without an account

The goal is to provide a **simple, accessible, and low-friction experience** for non-technical users.

---

## 🧠 Core Features

### 👥 Roles & Permissions

| Role        | Capabilities |
|-------------|-------------|
| Guest       | View content, view comments |
| User        | Comment on posts |
| Admin       | Create, update, delete posts |
| Super Admin | Manage users, assign roles, delete users |

---

### 📌 Content Types

- 📝 Text (rich text)
- 📺 Video (via YouTube links)
- 🎧 Audio (via SoundCloud links)

---

### 💬 Comments

- Authenticated users can add comments
- All users (including guests) can view comments
- Users can delete their own comments

---

### 🔗 Sharing

Each post has a unique shareable link:

```
/post/:id
```

---

### 🔐 Authentication

- Google Authentication via Supabase
- Optional login (guest access supported)

---

## 🧱 Tech Stack

### Backend
- Supabase
- PostgreSQL Database
- Authentication (Google OAuth)
- Row Level Security (RLS)

### Media Platforms
- YouTube (video hosting)
- SoundCloud (audio hosting)

### Frontend
- Angular / React (TBD)
- Mobile-first UI design

---

## 🗄️ Database Structure

### Tables

| Table      | Description |
|------------|-------------|
| `roles`    | User roles (`user`, `admin`, `super_admin`) |
| `profiles` | User profiles (linked to auth.users) |
| `posts`    | Content (text, video, audio) |
| `comments` | User comments |

### Key Relationships

```
auth.users
↓
profiles ─── roles
↓
posts
↓
comments
```

---

## 🔒 Security (RLS)

Row Level Security (RLS) is used to enforce:

- Public read access to posts and comments
- Authenticated users can create comments
- Admins can manage posts
- Super admins can manage users and roles
- Users can delete their own accounts

---

## ⚙️ Key Design Decisions

### ✅ External Media Handling

- Videos → YouTube embeds
- Audio → SoundCloud embeds

**Why?**
- Avoid storage and bandwidth costs
- Ensure cross-device compatibility
- Simplify backend complexity

### ✅ No In-App Recording (MVP)

Recording audio/video inside the browser is intentionally excluded to:
- Reduce complexity
- Improve reliability on low-end devices
- Speed up development

### ✅ Soft Deletion Strategy (Account & Content)

**Account Deletion:**
- User profiles use soft delete (`deleted_at` timestamp)
- Auth identity remains intact (no email issues with OAuth)
- Content ownership preserved (for moderation & audit)
- Users cannot recover deleted accounts in MVP
- Super-admins can delete users/admins (but not other super-admins)

**How It Works:**
1. User clicks "Supprimer mon compte" in profile settings
2. Warning modal: "Cette action est irréversible"
3. Confirmation modal: Enter your email to verify (in-app only, no email link needed)
4. If email matches, delete button enables
5. On confirm: Account soft-deleted, user signed out, redirected to login

**For Super-Admin Delete:**
1. Super-admin finds user in "Gérer les utilisateurs"
2. Clicks trash icon on user
3. Warning modal
4. Confirmation modal: Enter both emails (admin + target user)
5. Both must match for delete button to enable
6. On confirm: Target account soft-deleted, removed from list

**Content Preservation:**
- Posts use `is_deleted` flag
- User deletion does **not** remove posts/comments
- Deleted users display as "Utilisateur supprimé" in comments/posts

---

## 🎨 UI / UX Principles

- Mobile-first design
- Black & white minimalist interface
- Simple navigation
- Clear French labels (no localization yet)
- No clutter, no unnecessary features

---

## ❌ Out of Scope (MVP)

- Notifications
- Likes / reactions
- Advanced search
- File uploads (direct)
- In-app recording
- Offline mode
- Analytics

---

## ⚠️ Known Limitations

- Deleted users leave content without author reference
- Media downloads depend on external platforms
- No moderation system (beyond admin delete)

---

## 👤 Account Management

### Authentication & Identity Separation

The app intentionally separates:
- **`auth.users`** = Authentication identity (can this user log in?)
- **`public.profiles`** = Application identity (is this user allowed to use the app?)

This separation prevents OAuth corruption and enables safe account recovery in future versions.

### Account Deletion Flow

#### Self-Delete (User Profile Page)

```
1. User clicks "Supprimer mon compte"
2. Warning modal: "Cette action est irréversible"
   ↓
3. Confirmation modal: Enter your email
   - Email validation happens in-app (AJAX on blur)
   - No email link required
   - Delete button disabled until email matches
   ↓
4. User confirms deletion
   ↓
5. Backend action:
   - Profile soft-deleted (deleted_at = now())
   - Profile anonymized (full_name → "Deleted User", avatar → null)
   - Email preserved (for recovery in v2)
   ↓
6. Frontend action:
   - User signed out
   - Session cleared
   - Redirected to /login
```

#### Super-Admin Delete (Manage Users Page)

```
1. Super-admin finds user via search
2. Clicks trash icon on user card
3. Warning modal: "Supprimer ce compte ?"
   ↓
4. Confirmation modal: Enter TWO emails
   - Admin's email (requester)
   - Target user's email (who to delete)
   - Both validated in-app (AJAX on blur)
   - Delete button disabled until both match
   ↓
5. Super-admin confirms deletion
   ↓
6. Backend action:
   - Target profile soft-deleted
   - Profile anonymized
   - Email preserved
   ↓
7. Frontend action:
   - User removed from search results
   - Success message shown
```

### Account States

| State | deleted_at | Access | Recovery |
|-------|-----------|--------|----------|
| Active | NULL | Full app access | N/A |
| Self-Deleted | SET | Blocked (RLS) | v2 feature |
| Admin-Deleted | SET | Blocked (RLS) | Not recoverable |

### Security & RLS

- RLS policies enforce `is_active_user()` check
- Deleted users cannot create/update content
- Deleted users cannot comment
- Email confirmation prevents accidental deletion
- Super-admin cannot delete other super-admins

### Email Confirmation Details

**Important:** Email confirmation is **100% in-app, no email verification link required.**

- User enters their email in the confirmation modal
- System compares it to their stored email (real-time validation)
- Visual feedback: green checkmark when email matches
- Delete button only enables when email is verified
- No external email communication

This keeps the flow simple while preventing accidents.

---

## 🧪 Future Improvements (v2)

- **Account Recovery** - Allow users to restore self-deleted accounts
- Media upload support (Supabase Storage)
- In-app audio/video recording
- Admin dashboard enhancements
- Comment moderation tools
- Push notifications
- Mobile app (iOS / Android)
- Deletion audit log & analytics

---

## 🛠️ Setup (Backend)

1. Create a project in Supabase
2. Run the SQL schema script
3. Enable Google Auth
4. Assign first `super_admin` manually

---

## 🔑 First Super Admin Setup

```sql
UPDATE profiles
SET role_id = (SELECT id FROM roles WHERE name = 'super_admin')
WHERE email = 'your-email@example.com';
```

---

## 📌 Project Status

🚧 MVP in development  
🎯 Goal: Deliver a functional, simple, and reliable content platform

---

## 🤝 Contribution

This project is currently in early development. Contributions and suggestions are welcome after MVP stabilization.

---

## 📄 License

TBD