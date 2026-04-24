-- =========================================================
-- EXTENSIONS
-- =========================================================

create extension if not exists "pgcrypto";


-- =========================================================
-- ROLES TABLE
-- =========================================================

create table if not exists roles (
  id serial primary key,
  name text unique not null
);

-- Seed roles
insert into roles (name)
values ('user'), ('admin'), ('super_admin')
on conflict (name) do nothing;


-- =========================================================
-- PROFILES TABLE (extends auth.users)
-- =========================================================

create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  full_name text,
  avatar_url text,

  role_id int references roles(id),

  created_at timestamp default now()
);


-- =========================================================
-- POSTS TABLE
-- =========================================================

create table if not exists posts (
  id uuid primary key default gen_random_uuid(),

  title text not null,

  content_type text not null
    check (content_type in ('text', 'video', 'audio')),

  text_content text,
  media_url text,

  post_author_id uuid references profiles(id) on delete set null,

  is_deleted boolean default false,

  created_at timestamp default now(),
  updated_at timestamp default now()
);


-- =========================================================
-- COMMENTS TABLE
-- =========================================================

create table if not exists comments (
  id uuid primary key default gen_random_uuid(),

  post_id uuid references posts(id) on delete cascade,
  comment_author_id uuid references profiles(id) on delete set null,

  content text not null,

  created_at timestamp default now()
);


-- =========================================================
-- FUNCTION: AUTO UPDATE updated_at
-- =========================================================

create or replace function update_updated_at_column()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists update_posts_updated_at on posts;

create trigger update_posts_updated_at
before update on posts
for each row
execute function update_updated_at_column();


-- =========================================================
-- FUNCTION: AUTO CREATE PROFILE ON SIGNUP
-- =========================================================

create or replace function handle_new_user()
returns trigger as $$
begin
  insert into profiles (id, email, role_id)
  values (
    new.id,
    new.email,
    (select id from roles where name = 'user')
  );
  return new;
end;
$$ language plpgsql;

drop trigger if exists on_auth_user_created on auth.users;

create trigger on_auth_user_created
after insert on auth.users
for each row
execute function handle_new_user();


-- =========================================================
-- HELPER FUNCTION: GET USER ROLE
-- =========================================================

create or replace function get_user_role()
returns text as $$
  select r.name
  from profiles p
  join roles r on p.role_id = r.id
  where p.id = auth.uid();
$$ language sql stable;


-- =========================================================
-- ENABLE ROW LEVEL SECURITY
-- =========================================================

alter table profiles enable row level security;
alter table posts enable row level security;
alter table comments enable row level security;


-- =========================================================
-- RLS POLICIES
-- =========================================================

-- ---------------------------------------------------------
-- PROFILES
-- ---------------------------------------------------------

-- Users can read their own profile
create policy "Users can read own profile"
on profiles
for select
using (auth.uid() = id);

-- Users can update their own profile
create policy "Users can update own profile"
on profiles
for update
using (auth.uid() = id);

-- Users can delete their own account
create policy "Users can delete own profile"
on profiles
for delete
using (auth.uid() = id);

-- Super admin can update any profile (promote/demote)
create policy "SuperAdmin can update all profiles"
on profiles
for update
using (
  get_user_role() = 'super_admin'
);

-- Super admin can delete any profile
create policy "SuperAdmin can delete profiles"
on profiles
for delete
using (
  get_user_role() = 'super_admin'
);

-- Allow insert via trigger
create policy "Allow profile insert"
on profiles
for insert
with check (auth.uid() = id);


-- ---------------------------------------------------------
-- POSTS
-- ---------------------------------------------------------

-- Public read (guests included)
create policy "Public read posts"
on posts
for select
using (is_deleted = false);

-- Admin & SuperAdmin can insert
create policy "Admins can insert posts"
on posts
for insert
with check (
  get_user_role() in ('admin', 'super_admin')
);

-- Admin & SuperAdmin can update
create policy "Admins can update posts"
on posts
for update
using (
  get_user_role() in ('admin', 'super_admin')
);

-- Admin & SuperAdmin can delete
create policy "Admins can delete posts"
on posts
for delete
using (
  get_user_role() in ('admin', 'super_admin')
);


-- ---------------------------------------------------------
-- COMMENTS
-- ---------------------------------------------------------

-- Public read comments
create policy "Public read comments"
on comments
for select
using (true);

-- Authenticated users can insert comments
create policy "Users can insert comments"
on comments
for insert
with check (auth.uid() = comment_author_id);

-- Users can delete their own comments
create policy "Users can delete own comments"
on comments
for delete
using (auth.uid() = comment_author_id);