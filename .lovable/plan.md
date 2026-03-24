

## Problem

When a user signs in via Google OAuth, authentication succeeds (confirmed in auth logs: user `efontana51@gmail.com` logged in via Google), but **no role is assigned** in the `user_roles` table. The redirect logic in `Auth.tsx` requires both `user` and `role` to be non-null, so the user gets stuck on the login page.

## Root Cause

The `signUp` function manually inserts into `user_roles` after email signup, but Google OAuth bypasses this entirely — it goes through `lovable.auth.signInWithOAuth` which creates/signs in the user but never assigns a role.

## Solution

Two-part fix:

### 1. Role selection page for new OAuth users

When `useAuth` detects a user with no role (user exists, role is null, loading is false), instead of showing the login form, show a **role selection screen** so the user can choose "locador" or "motorista". This handles first-time Google signups.

**File: `src/pages/Auth.tsx`**
- Add logic: if `user` exists but `role` is null and not loading, render a role selection component instead of redirecting or showing login form.

**New component: `src/components/auth/OAuthRoleSelection.tsx`**
- Shows role selector (locador/motorista) and a confirm button.
- On confirm, inserts the role into `user_roles` and creates a basic `profiles` entry.
- Updates the auth context role state.

### 2. Update `useAuth` to support role refresh

**File: `src/hooks/useAuth.tsx`**
- Add a `refreshRole` function that re-fetches the user's role and updates state.
- Expose it in the context so `OAuthRoleSelection` can call it after inserting the role.

### Flow

```text
Google OAuth → user created (no role)
  → Auth.tsx detects user + no role
  → Shows OAuthRoleSelection
  → User picks locador/motorista
  → Insert into user_roles + profiles
  → refreshRole() → role set → redirect to dashboard
```

### Technical Details

- `OAuthRoleSelection` will use `supabase.from('user_roles').insert(...)` directly.
- Profile creation will insert minimal data (user_id only) since Google OAuth doesn't collect documents.
- The "admin" role remains blocked (same as email signup).
- Existing Google OAuth users who already have a role will redirect normally.

