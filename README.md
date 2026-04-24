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

### ✅ Soft Deletion Strategy

- Posts use `is_deleted` flag
- User deletion does **not** remove posts/comments
- Author fields become `NULL`

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

## 🧪 Future Improvements

- Media upload support (Supabase Storage)
- In-app audio/video recording
- Admin dashboard enhancements
- Comment moderation tools
- Push notifications
- Mobile app (iOS / Android)

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