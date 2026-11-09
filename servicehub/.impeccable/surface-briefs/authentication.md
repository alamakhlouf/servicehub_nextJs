# Authentication experience

## Job and audience

- **Audience:** Visitors arriving from public ServiceHub marketplace pages, plus returning customers, providers, and suppliers who need to authenticate before completing a protected action.
- **Job:** Create or access one role-based ServiceHub account without losing the marketplace task that prompted authentication.
- **Visitor mode:** Operate. The experience should be calm, direct, and confidence-building rather than promotional.

## Outcome and proof

- **Primary outcome:** The user successfully signs up or logs in and understands what happens next.
- **Success:** The user reaches the role-aware dashboard by default, or returns to the originating protected action when one exists.
- **Product truth:** Public browsing remains available without authentication. Public signup offers `CUSTOMER`, `PROVIDER`, and `SUPPLIER`; `ADMIN` is never selectable and is created through a controlled process.
- **Trust proof:** Explain only the practical facts users need: their email identifies the account, their role determines available actions, and authentication is required before bookings, orders, profile changes, or other protected actions.

## Selected direction

- **Visual authority:** Extend the established ServiceHub system in [DESIGN.md](../../DESIGN.md): deep navy background, layered navy surfaces, blue primary action, green success, restrained amber warning, Plus Jakarta Sans headings, and Inter controls/body.
- **Structural thesis:** Keep one clear task per screen with a compact brand/header frame, a focused form panel, and a short contextual explanation. Avoid a marketing split-screen, decorative illustration, gradient hero, or dashboard-like card grid.
- **Sequence:** Entry context → Login or Sign up → inline validation/loading → success or recovery error → role-aware destination or return to the original action.
- **Focal moment:** The form submit state and the confirmation that the user is signed in, with no ambiguity between an accepted request and an error.
- **Implementation consequence:** Auth screens must receive and preserve a safe return path, while server-side authorization remains authoritative. Never put tokens, passwords, or private auth responses in browser storage.

## Scope and boundaries

- **Breadth:** `/login`, `/signup`, logout affordance, auth-gated return handling, and the authenticated profile entry point.
- **Fidelity:** Production-ready responsive screens and interaction states, but no backend implementation in this shape brief.
- **Interactivity:** Login, signup, role selection, password visibility, validation, loading, generic authentication errors, logout, and return-path handling.
- **Untouched:** Public marketplace discovery, feature-specific forms, role dashboard content, MongoDB schema implementation, and admin provisioning.
- **Anti-goals:** No social login, password reset flow, email verification claims, multi-role switching, admin signup, onboarding carousel, OAuth branding, or invented security promises unless separately confirmed.

## States and ranges

- First visit: unauthenticated visitor with a clear choice between Login and Sign up.
- Login: email and password; generic failure copy must not reveal whether an email exists.
- Signup: name, email, password, and one role choice among Customer, Provider, and Supplier.
- Validation: missing/invalid email, password rule failure, missing name/role, duplicate account, and server/network failure.
- Loading: submit controls become disabled and communicate progress without shifting layout.
- Success: concise confirmation, then redirect to preserved return path or role-aware dashboard.
- Session state: authenticated navigation exposes role-appropriate destinations and profile/logout controls.
- Offline: login, signup, logout, and profile mutations remain online-only; explain this when a network failure is detected rather than presenting a local success.
- Content ranges: names may be short or long; email addresses may wrap on narrow screens; errors should fit below fields without relying on color alone.

## Interaction and layout

- Use a single-column mobile-first form with a readable maximum measure; center the form on wider screens without creating an oversized empty canvas.
- Keep the brand and navigation context visible but quiet. Provide a direct link between Login and Sign up without resetting entered data unexpectedly.
- Place labels above controls, preserve browser autofill semantics, and provide keyboard-accessible password visibility controls.
- Show field-level errors adjacent to fields and a form-level summary for server errors; focus the first invalid field or summary after submit.
- Preserve `returnTo` only when it is a safe same-origin path. Fall back to the role-aware dashboard when absent or invalid.
- On mobile, controls use comfortable touch targets and avoid side-by-side fields that become cramped. On tablet/desktop, increase outer breathing room rather than adding decorative columns.
- Respect reduced motion, visible focus, readable contrast, and screen-reader status announcements for loading and errors.

## Constraints and open decisions

- **Platform:** Responsive web PWA in the existing Next.js App Router, TypeScript, Tailwind CSS, and CSS-variable design system.
- **Security constraints:** httpOnly, sameSite `lax` session cookie; secure cookie in production; bcrypt password hashing; jose session signing; server-side validation and role checks; generic login errors; no credentials in localStorage, sessionStorage, or IndexedDB.
- **Reusable components:** Use the shared Button, Input, Select, Card, Badge, Loading, Navigation, and focus/error patterns already documented in [DESIGN.md](../../DESIGN.md).
- **Confirmed decisions:** Return to the originating protected action when safe; otherwise route to the role-aware dashboard. Public signup excludes Admin.
- **Open decisions:** Password recovery, email verification, session expiration messaging, and exact dashboard landing content remain undecided and must not be invented during implementation.
