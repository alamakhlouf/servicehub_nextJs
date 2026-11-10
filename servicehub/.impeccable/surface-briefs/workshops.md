# Workshop management experience

## Job and audience

- **Audience:** Visitors and marketplace users discovering professional workshops, customers enrolling, provider-organizers managing their events, and admins moderating.
- **Visitor job:** Decide whether an upcoming workshop is relevant from a concise, trustworthy detail page.
- **Customer job:** Request enrollment, understand whether the organizer approved it, and see attendance after the workshop.
- **Provider (organizer) job:** Create a useful event, publish or cancel it deliberately, review enrollment requests, and record attendance without a complex event platform.
- **Admin job:** Moderate workshops (edit/cancel/inspect) without a separate general administration dashboard. Admins do not create workshops or enroll.

## Outcome and product truth

- **Public outcome:** A visitor can browse published upcoming workshops and understand what, where, when, and how many customers can enroll.
- **Customer outcome:** A customer sees a request as `PENDING` until the server confirms `APPROVED`; an offline draft is never treated as an enrollment.
- **Organizer outcome:** Capacity reflects approved enrollments, and every approval or attendance decision is server-authorized.
- **Trust proof:** Workshop status, date/time, location, duration, capacity, approved count, organizer name, and enrollment status are explicit.
- **Data truth:** The organizer is the authenticated creator and must have role `PROVIDER`, from the existing identity system. Enrollees are authenticated `CUSTOMER` users. Do not create separate organizer or enrollee entities.

## Selected direction

- **Visual authority:** Extend [DESIGN.md](../../DESIGN.md): deep navy canvas, layered surfaces, blue primary actions, green for approved/completed/attended outcomes, amber for pending attention, and red for cancellation/errors.
- **Structural thesis:** Keep workshops operational rather than promotional:
  - catalogue answers "what is coming up?"
  - detail answers "should I request enrollment?"
  - organizer list answers "what needs publishing or closing?"
  - enrollment queue answers "which requests need a decision?"
- **Public rhythm:** Upcoming context → workshop facts → description → capacity signal → customer enrollment action.
- **Organizer rhythm:** Status → event details → capacity → enrollment requests → attendance.
- **Focal moment:** The enrollment action must distinguish `Request enrollment`, `Pending`, `Approved`, `Rejected`, `Cancelled`, and offline `Pending sync`.
- **Tone:** Practical, local, and clear. Avoid ticketing, sales, urgency, or conference-platform language.

## Scope and boundaries

- **Public surfaces:** `/workshops` and `/workshops/[id]`.
- **Organizer (provider) surfaces:** `/dashboard/my-workshops`, `/dashboard/workshops/new`, `/dashboard/workshops/[id]/edit`, `/dashboard/workshops/[id]/participants`.
- **Customer surface:** `/dashboard/my-participation`.
- **Included:** Workshop creation, editing, publication, cancellation, completion, upcoming discovery, customer enrollment requests, organizer approval/rejection, capacity, attendance, and offline enrollment drafts.
- **Excluded:** Ticket sales, payments, waitlists, recurring events, multi-session schedules, external calendars, video conferencing, file uploads, messaging, and complex calendar grids.
- **Role boundary:** Only providers create workshops. Only customers enroll. Everyone may browse. Admins may edit/cancel/inspect any workshop. Navigation shows "My workshops" to providers (and admins' moderation entry points) and "My enrollments" to customers only.

## Screen structure

### Public catalogue — `/workshops`

- Quiet heading such as `Upcoming workshops`.
- Short supporting copy explaining that visitors can browse without signing in.
- Compact filters only when useful: category, location/search.
- Sort by soonest start date.
- Workshop item prioritizes: title, category, date/time, location, duration, capacity signal, organizer.
- Use a readable list or restrained two-column layout; avoid a generic event-card grid.
- Empty states: no upcoming workshops, no matching workshops, offline cache unavailable.

### Workshop detail — `/workshops/[id]`

- Title and category lead.
- Facts row or stack: date/time, duration, location, approved/capacity count, organizer name.
- Description follows at a comfortable reading width.
- Enrollment action sits near the capacity context and depends on viewer:
  - Customer: `Request enrollment` (or current status).
  - Visitor: invitation to sign in as a customer, shown only when attempting to enroll.
  - Provider/supplier/admin: no enroll button; short note "Only customers can enroll."
  - Owner provider: link to manage the workshop and its enrollments.
- Public users never see enrollment notes or the full enrollee list.
- Cancelled/completed workshops show a clear status state rather than a broken page when reached through history.

### Organizer workshop index — `/dashboard/my-workshops` (provider)

- Heading: `My workshops`. Primary action: `Create workshop`.
- Each item shows title, date/time, location, status, approved count/capacity, and next valid action.
- Actions: edit, publish draft, cancel, mark completed, manage enrollments.
- No metric tiles or nested dashboard cards.
- Empty state explains how a workshop brings customers together and offers one create action.

### Workshop form

- Single-column mobile-first form: title, short description, category, location, start date/time, end date/time, capacity.
- Duration is derived from start/end and displayed read-only; must be 15 minutes to 24 hours.
- Start must be in the future to create or publish.
- Keep save draft and publish actions separate. Explain that publishing makes the workshop discoverable and enrollable.
- Show current status and approved count while editing.
- Prevent invalid capacity reductions.
- Preserve values after validation or network failure.

### Enrollment management — `/dashboard/workshops/[id]/participants`

- Show workshop status and capacity first, e.g. `3 of 10 approved`.
- List customer requests with: customer name/profile summary, request note, request date, enrollment status, attendance.
- Primary actions: approve, reject, mark attended, mark absent.
- Make capacity conflicts explicit and recoverable.
- Keep pending and approved requests visually distinct without relying only on color.

### Customer enrollments — `/dashboard/my-participation`

- Show workshop, organizer, date/time, location, enrollment status, attendance, and note.
- Allow cancelling a pending/approved enrollment before the workshop starts.
- Pending local records use `Pending sync` and are visually separate from server enrollments.
- Empty state points customers toward upcoming workshops.

## Workshop lifecycle

```text
DRAFT → PUBLISHED
DRAFT → CANCELLED
PUBLISHED → CANCELLED
PUBLISHED → COMPLETED
```

Cancelled and completed workshops are terminal in the base experience.

| Status      | Meaning                     | Public treatment                                   |
| ----------- | --------------------------- | -------------------------------------------------- |
| `DRAFT`     | Private organizer work      | Not listed; 404 to non-owners                      |
| `PUBLISHED` | Discoverable and enrollable | Listed if upcoming                                 |
| `CANCELLED` | Event will not proceed      | Clearly labelled in private/history views          |
| `COMPLETED` | Event finished              | Read-only (attendance still editable by organizer) |

Do not silently remove enrollment records when a workshop is cancelled; set PENDING/APPROVED ones to `CANCELLED`.

## Enrollment lifecycle

```text
PENDING → APPROVED
PENDING → REJECTED
PENDING → CANCELLED
APPROVED → CANCELLED
```

Attendance is separate: `NOT_MARKED → ATTENDED | ABSENT`.

Rules:

- Only customers can request.
- One request per customer/workshop; no re-request after rejection or cancellation.
- Only the owner provider/admin can approve or reject.
- Only the customer can cancel their own enrollment (organizer cancellation happens via workshop cancellation).
- Only approved enrollments can receive attendance.
- Offline requests remain local until the server confirms `PENDING`.
- Approval must re-check capacity on the server.

## Capacity and availability

- Capacity is the maximum number of `APPROVED` enrollments.
- Pending requests do not consume capacity.
- Display approved count and capacity, not a misleading "guaranteed seat" claim.
- Approval uses an atomic or immediately conditional server update.
- A customer cancellation frees an approved slot.
- Reducing capacity below approved count is invalid.
- A full workshop still shows details, but the enrollment action is unavailable with a clear explanation.
- No waitlist or automatic overflow.

## Offline behavior

- Cache public workshop catalogue/detail reads with network-first behavior; label fallback `Offline copy — may be outdated`.
- Never cache private enrollment lists, customer enrollment history, or mutation responses in the service worker.
- Save customer enrollment notes in a dedicated IndexedDB store, keyed by user id, cleared on logout.
- Draft states: `DRAFT`, `PENDING_SYNC`, `FAILED` (retry available).
- Use a unique `clientRequestId` for enrollment requests.
- Retry on browser `online`, app launch, enrollment history load, and manual retry.
- On success, delete the local record and show server-confirmed `PENDING`. Never show a local request as `APPROVED`.

## States and ranges

- **Public:** loading, no upcoming workshops, no filter matches, unavailable, offline cached, full, cancelled, completed.
- **Organizer:** draft, published, cancellation confirmation, completion confirmation, empty requests, capacity full, approval conflict, attendance unavailable before start, concurrent update.
- **Customer:** enrollment available, already pending, approved, rejected, cancelled, draft restored, pending sync, sync failed with retry, not allowed (wrong role).

Long text must wrap without pushing actions off-screen.

## Responsive and accessible behavior

- Use shared Button, Input, Select, Textarea, Card, Badge, Dialog, Avatar, Loading components.
- Stack facts and form controls on mobile; two-column layouts from tablet widths only when they help scanning.
- Touch targets at least 40px, preferably 44px. Visible labels on every field.
- Announce status transitions, draft restoration, sync results, and errors with `aria-live`.
- Keyboard accessible controls; dialogs with title, close action, focus management, Escape.
- Do not rely on color alone. Respect reduced motion; preserve visible focus.

## Server and ownership contract

- Derive organizer and customer identity from the authenticated session.
- Create workshop: role `PROVIDER` only. Enroll: role `CUSTOMER` only.
- Only the owner provider/admin may edit, cancel, complete, or manage enrollments.
- Validate workshop status and start time on every enrollment mutation.
- Validate enrollment ownership through the workshop relationship.
- Enrollment notes are private to the customer and organizer/admin.
- Never trust client-provided approved counts, status, organizer IDs, customer IDs, or attendance.

## API surface

```text
GET    /api/workshops
POST   /api/workshops                         # PROVIDER
GET    /api/workshops/[id]
PATCH  /api/workshops/[id]                    # owner/admin
DELETE /api/workshops/[id]                    # soft-cancel

POST   /api/workshops/[id]/participants        # CUSTOMER
GET    /api/workshops/[id]/participants        # owner/admin
GET    /api/my-workshop-participation           # CUSTOMER
PATCH  /api/workshop-participants/[id]         # owner/admin decisions; customer cancel own
```

Public API responses are cacheable only for published workshop content. Enrollment and organizer APIs are private.

## Anti-goals

- No ticketing, payments, waitlists, recurring events, or calendar grids.
- No automatic approval of offline requests.
- No public enrollee list or private notes in cached responses.
- No separate provider/customer identity system.
- No silent capacity overbooking.
- No destructive workshop deletion that removes enrollment history.
- No generic event-dashboard metrics, gradients, or excessive card grids.
- No enroll button for providers, suppliers, or admins; no create button for customers.

## Decisions resolved (defaults for implementation)

- Published workshops can be edited after enrollments exist, except capacity cannot drop below approved count; changes to date/location should be visible to enrolled customers.
- A rejected or cancelled customer cannot submit a new request.
- A customer may cancel an approved enrollment before the workshop starts.
- Attendance is editable by the organizer after completion.
- Cancelling a workshop moves PENDING/APPROVED enrollments to `CANCELLED`.
- Cancelled/completed workshop detail pages stay reachable by historical links with a clear status banner.
- Capacity is derived from approved enrollment records using a conditional/transactional update (no separate counter unless needed).

## Enhancements

- Public workshop discovery supports shareable category, date, text, and availability filters with offline-aware results.
- Workshops include skill level, learning points, requirements, format, and private online meeting links with approved-customer access.
- Customers receive private in-app notifications for enrollment decisions, cancellations, and meaningful workshop updates.
