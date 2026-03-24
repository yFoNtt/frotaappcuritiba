

## Problem

The Google OAuth login works (user `efontana51@gmail.com` authenticates successfully), but:
1. The user has **no entry** in `user_roles` and **no entry** in `profiles` — confirmed via database query.
2. After Google OAuth redirect, the user lands on `/` (homepage), NOT on `/login` (Auth page).
3. The `OAuthRoleSelection` component only renders inside `Auth.tsx` at `/login`, so the user never sees it.

The user is stuck: authenticated but without a role, unable to access any dashboard.

## Solution

Two changes needed:

### 1. Global redirect for authenticated users without a role

Add logic to the **Index page** (`src/pages/Index.tsx`) that detects `user && !role && !authLoading` and redirects to `/login`. This ensures that after Google OAuth returns the user to `/`, they get sent to the Auth page where `OAuthRoleSelection` will render.

This same check should also be added to other public pages that a user might land on (or better yet, handled once in a shared component like `PublicLayout` or `Header`).

**Preferred approach**: Add the redirect in `src/components/layout/Header.tsx` or `PublicLayout.tsx` since it wraps all public pages — single point of change.

### 2. Immediate fix for the existing user

Run a database migration/query to manually assign the role for user `bf3e2785-0f1b-4a97-ac0e-987ce38bd2a1` so they can access the system right away. This will be done via an INSERT into `user_roles` and `profiles`.

## Technical Details

**File: `src/components/layout/PublicLayout.tsx`**
- Import `useAuth` and `useNavigate`
- Add effect: if `user` exists, `role` is null, and not loading → `navigate('/login', { replace: true })`
- This catches ALL public pages (Index, Vehicles, HowItWorks, etc.) so no matter where OAuth lands, the user gets routed to role selection

**Database**: Insert role and profile for the existing stuck user:
```sql
INSERT INTO user_roles (user_id, role) VALUES ('bf3e2785-0f1b-4a97-ac0e-987ce38bd2a1', 'locador');
INSERT INTO profiles (user_id) VALUES ('bf3e2785-0f1b-4a97-ac0e-987ce38bd2a1');
```

## Flow After Fix

```text
Google OAuth → redirect to / → PublicLayout detects user+no role
  → redirect to /login → Auth.tsx shows OAuthRoleSelection
  → User picks role → insert into user_roles + profiles
  → refreshRole() → redirect to dashboard
```

