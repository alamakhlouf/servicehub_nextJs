# Feature 1 — Identity & Profiles (Member 1)

## Objective
Implement account registration, login, logout, and profile management for the four app roles. Authentication is shared infrastructure: every other feature must use this module's session helpers and role checks instead of inventing its own authentication.

## User stories
- As a visitor, I can create an account with my name, email, password, and role.
- As a registered user, I can log in using email and password.
- As a logged-in user, I can log out.
- As a logged-in user, I can view my profile and edit basic details.
- As a user, I can see navigation and actions appropriate to my role.
- As a user, I can still see a cached read-only profile summary while offline.

## Roles
`CUSTOMER`, `PROVIDER`, `SUPPLIER`, `ADMIN`.
Public sign-up may offer CUSTOMER, PROVIDER, and SUPPLIER. Do not allow public users to choose ADMIN. Create one admin account through a controlled seed script or a manually documented development process.

## Screens
- `/signup`: name, email, password, role.
- `/login`: email and password.
- `/dashboard/profile`: view name, email, role, phone, city, and bio.
- `/dashboard/profile/edit`: edit name, phone, city, bio. Email and role changes are not part of the basic profile edit flow.
- Shared responsive navigation: show links based on the authenticated user's role.

## MongoDB document
`users`:
```ts
{
  _id: ObjectId,
  name: string,
  email: string,             // normalized lowercase; unique
  passwordHash: string,     // never returned to client
  role: "CUSTOMER" | "PROVIDER" | "SUPPLIER" | "ADMIN",
  phone?: string,
  city?: string,
  bio?: string,
  createdAt: Date,
  updatedAt: Date
}
```
Create a unique index on normalized `email`.

## API
- `POST /api/auth/signup` — validate input, hash password, create user, set session cookie.
- `POST /api/auth/login` — verify password and set session cookie.
- `POST /api/auth/logout` — clear session cookie.
- `GET /api/auth/me` — return safe current-user fields.
- `GET /api/profile` — current user's profile.
- `PATCH /api/profile` — update allowed profile fields only.

## Security and business rules
- Hash passwords with `bcryptjs`; never store plain-text passwords.
- Use `jose` to sign and verify a session token.
- Store session token in an `httpOnly`, `sameSite: "lax"` cookie; set `secure: true` in production.
- Never store auth tokens in localStorage, sessionStorage, or IndexedDB.
- Normalize email to lowercase and trim whitespace.
- Validate password length and all fields on the server (Zod recommended).
- Return generic login errors so the API does not reveal whether an email exists.
- Never return `passwordHash` from any endpoint.
- Derive user ID and role from the verified cookie/session, never from request JSON.
- Do not permit public registration as ADMIN.
- Protect profile updates so a user can only update their own profile.
- Other feature modules should call shared helpers such as `getCurrentUser()` and `requireRole("PROVIDER")`.

## PWA contribution — safe profile snapshot
- After a successful profile fetch, store only safe display fields (name, role, city) locally for read-only offline display.
- Show **Offline copy — may be outdated** when displaying the snapshot.
- Never cache password hashes, cookies, session tokens, or private authentication responses.
- Keep login, signup, logout, and profile mutations online-only.
- Clear the local profile snapshot on logout or account switch.

## Acceptance criteria
- Customer/provider/supplier can register and log in.
- Admin cannot be selected through public signup.
- User can log out and edit allowed profile fields.
- Password is hashed; session is stored in a secure httpOnly cookie.
- API routes can reliably identify current user and role.
- Users cannot access or edit another user's profile.
- Offline profile snapshot contains no credentials and is clearly marked stale.
