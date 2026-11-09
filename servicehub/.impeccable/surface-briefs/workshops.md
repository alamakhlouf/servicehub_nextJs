# Workshop management experience

## Job and audience

- **Audience:** Visitors and marketplace users discovering professional workshops, providers requesting participation, workshop organizers managing their event, and admins supporting moderation or operations.
- **Visitor job:** Decide whether an upcoming workshop is relevant from a concise, trustworthy detail page.
- **Provider job:** Request participation, understand whether the organizer approved it, and see attendance after the workshop.
- **Organizer job:** Create a useful event, publish or cancel it deliberately, review participation requests, and record attendance without a complex event platform.
- **Admin job:** Create or manage workshops when needed without a separate general administration dashboard.

## Outcome and product truth

- **Public outcome:** A visitor can browse published upcoming workshops and understand what, where, when, and how many providers can participate.
- **Provider outcome:** A provider sees a request as `PENDING` until the server confirms `APPROVED`; an offline draft is never treated as a registration.
- **Organizer outcome:** Capacity reflects approved participation, and every approval or attendance decision is server-authorized.
- **Trust proof:** Workshop status, date/time, location, duration, capacity, approved count, organizer identity, and participation status are explicit.
- **Data truth:** The organizer is the authenticated creator from the existing provider/admin identity system. Do not create a separate organizer or provider entity.

## Selected direction

- **Visual authority:** Extend [DESIGN.md](../../DESIGN.md): deep navy canvas, layered surfaces, blue primary actions, green for approved/completed/attended outcomes, amber for pending attention, and red for cancellation/errors.
- **Structural thesis:** Keep workshops operational rather than promotional:
  - catalogue answers “what is coming up?”
  - detail answers “should I request participation?”
  - organizer list answers “what needs publishing or closing?”
  - participant queue answers “which requests need a decision?”
- **Public rhythm:** Upcoming context → workshop facts → description → capacity signal → provider participation action.
- **Organizer rhythm:** Status → event details → capacity → participant requests → attendance.
- **Focal moment:** The participation action must distinguish `Request participation`, `Pending`, `Approved`, `Rejected`, `Cancelled`, and offline `Pending sync`.
- **Tone:** Practical, local, and clear. Avoid ticketing, sales, urgency, or conference-platform language.

## Scope and boundaries

- **Public surfaces:** `/workshops` and `/workshops/[id]`.
- **Organizer surfaces:** `/dashboard/my-workshops`, `/dashboard/workshops/new`, `/dashboard/workshops/[id]/edit`, and `/dashboard/workshops/[id]/participants`.
- **Provider surface:** `/dashboard/my-participation`.
- **Included:** Workshop creation, editing, publication, cancellation, completion, upcoming discovery, provider participation requests, organizer approval/rejection, capacity, attendance, and offline participation drafts.
- **Excluded:** Ticket sales, payments, waitlists, recurring events, multi-session schedules, external calendars, video conferencing, file uploads, messaging, and complex calendar grids.
- **Role boundary:** Only providers may request participation. Customers and visitors may browse but cannot register. Admins may create/manage workshops and moderate operational records where specified.

## Screen structure

### Public catalogue — `/workshops`

- Quiet heading such as `Upcoming workshops`.
- Short supporting copy explaining that visitors can browse without signing in.
- Compact filters only when useful:
  - category
  - location/search
- Sort by soonest start date.
- Workshop item prioritizes:
  1. title
  2. category
  3. date/time
  4. location
  5. duration
  6. capacity signal
  7. organizer
- Use a readable list or restrained two-column layout; avoid a generic event-card grid.
- Empty states:
  - no upcoming workshops
  - no matching workshops
  - offline cache unavailable

### Workshop detail — `/workshops/[id]`

- Title and category lead.
- Facts row or stack:
  - date/time
  - duration
  - location
  - approved/capacity count
  - organizer
- Description follows at a comfortable reading width.
- Provider action is near the capacity context.
- Visitors and customers see an invitation to sign in only when attempting a provider-only action; browsing remains public.
- Public users never see participant notes or the full participant list.
- Cancelled/completed workshops should have a clear status state rather than a broken page when reached through history.

### Organizer workshop index — `/dashboard/my-workshops`

- Heading: `My workshops`.
- Primary action: `Create workshop`.
- Each item shows title, date/time, location, status, approved count/capacity, and next valid action.
- Actions:
  - edit draft/published record where permitted
  - publish draft
  - cancel
  - mark completed
  - manage participants
- Do not use metric tiles or nested dashboard cards.
- Empty state explains how a workshop brings providers together and offers one create action.

### Workshop form

- Single-column mobile-first form:
  1. title
  2. short description
  3. category
  4. location
  5. date/time
  6. duration
  7. capacity
- Keep save draft and publish actions separate.
- Explain that publishing makes the workshop discoverable and requestable.
- Show current status and approved count while editing.
- Prevent invalid capacity reductions.
- Preserve values after validation or network failure.

### Participant management — `/dashboard/workshops/[id]/participants`

- Show workshop status and capacity first:

```text
3 of 10 approved
```

- List provider requests with:
  - provider name/profile summary
  - request note
  - request date
  - participation status
  - attendance
- Primary actions:
  - approve
  - reject
  - mark attended
  - mark absent
- Make capacity conflicts explicit and recoverable.
- Keep pending and approved requests visually distinct without relying only on color.

### Provider participation — `/dashboard/my-participation`

- Show workshop, organizer, date/time, location, participation status, attendance, and note.
- Pending local records use `Pending sync` and are visually separate from server participation.
- Empty state points providers toward upcoming workshops.

## Workshop lifecycle

Recommended workshop transitions:

```text
DRAFT → PUBLISHED
DRAFT → CANCELLED
PUBLISHED → CANCELLED
PUBLISHED → COMPLETED
```

Cancelled and completed workshops are terminal in the base experience.

Meaning:

| Status | Meaning | Public treatment |
|---|---|---|
| `DRAFT` | Private organizer work | Not listed |
| `PUBLISHED` | Discoverable and requestable | Listed if upcoming |
| `CANCELLED` | Event will not proceed | Clearly labelled in private/history views |
| `COMPLETED` | Event finished | Read-only and retained for history |

Do not silently remove participant records when a workshop is cancelled.

## Participation lifecycle

```text
PENDING → APPROVED
PENDING → REJECTED
PENDING → CANCELLED
APPROVED → CANCELLED
```

Attendance is separate:

```text
NOT_MARKED → ATTENDED
NOT_MARKED → ABSENT
```

Rules:

- Only providers can request.
- Organizer cannot request their own workshop.
- One request per provider/workshop.
- Only organizer/admin can approve or reject.
- Only approved participants can receive attendance.
- Offline requests remain local until the server confirms `PENDING`.
- Approval must re-check capacity on the server.

## Capacity and availability

- Capacity is the maximum number of `APPROVED` participants.
- Pending requests do not consume capacity in the base experience.
- Display approved count and capacity, not a misleading “guaranteed seat” claim.
- Approval must use an atomic or immediately conditional server update.
- A provider cancellation frees an approved slot.
- Reducing capacity below approved count is invalid.
- A full workshop may still show details, but the participation action becomes unavailable with a clear explanation.
- Do not build a waitlist or automatic overflow behavior.

## Offline behavior

- Cache public workshop catalogue/detail reads with network-first behavior.
- Label fallback content `Offline copy — may be outdated`.
- Never cache private participant lists, provider participation history, or mutation responses in the public service worker.
- Save provider participation notes in a dedicated IndexedDB store.
- Draft states:
  - `DRAFT`: local fields saved, not submitted.
  - `PENDING_SYNC`: provider submitted offline; not yet sent to organizer.
  - `FAILED`: synchronization failed; retry available.
- Use a unique `clientRequestId` for participation requests.
- Retry on:
  - browser `online`
  - application launch
  - provider participation history load
  - manual retry
- On success, delete the local record and show server-confirmed `PENDING`.
- Never show a local request as `APPROVED`.

## States and ranges

### Public

- Loading workshop list/detail.
- No upcoming workshops.
- No filter matches.
- Workshop unavailable.
- Offline cached workshop.
- Full capacity.
- Cancelled workshop.
- Completed workshop.

### Organizer

- Draft.
- Published.
- Cancellation confirmation.
- Completion confirmation.
- Empty participant requests.
- Capacity full.
- Approval conflict.
- Attendance unavailable before completion.
- Concurrent update.

### Provider

- Participation available.
- Request already pending.
- Approved.
- Rejected.
- Cancelled.
- Draft restored.
- Pending sync.
- Sync failed with retry.

Long descriptions, notes, locations, and organizer/provider names must wrap without pushing actions off-screen.

## Responsive and accessible behavior

- Use the shared Button, Input, Select, Textarea, Card, Badge, Dialog, Avatar, and Loading components.
- Stack workshop facts and form controls on mobile.
- Use two-column detail or management layouts only from tablet widths when they improve scanning.
- Keep primary touch targets at least 40px, preferably 44px.
- Use visible labels for every form field.
- Announce status transitions, draft restoration, sync results, and errors with `aria-live`.
- Participant status and attendance controls must be keyboard accessible.
- Dialogs need an accessible title, close action, focus management, and Escape support.
- Do not rely on color alone for status, capacity, or attendance.
- Respect reduced motion and preserve visible focus.

## Server and ownership contract

- Derive organizer identity from the authenticated session.
- Only the organizer/admin may edit or cancel a workshop.
- Only providers may create participation requests.
- Derive provider identity from the session.
- Validate workshop status and start time on every participation mutation.
- Validate participant ownership through the workshop relationship.
- Keep participant notes private to the provider and organizer/admin.
- Preserve participant records when a workshop is cancelled.
- Never trust client-provided approved counts, status, organizer IDs, or attendance.

## Suggested API surface

```text
GET    /api/workshops
POST   /api/workshops
GET    /api/workshops/[id]
PATCH  /api/workshops/[id]
DELETE /api/workshops/[id]        # soft-cancel

POST   /api/workshops/[id]/participants
GET    /api/workshops/[id]/participants
GET    /api/my-workshop-participation
PATCH  /api/workshop-participants/[id]
```

Public API responses must be safe and cacheable only for published workshop content. Participant and organizer APIs are private.

## Anti-goals

- No ticketing, payments, waitlists, recurring events, or calendar grids.
- No automatic approval of offline requests.
- No public participant list or private participant notes in cached responses.
- No separate provider or organizer identity system.
- No silent capacity overbooking.
- No destructive workshop deletion that removes participation history.
- No generic event-dashboard metrics, gradients, or excessive card grids.

## Open decisions to resolve before implementation

- Whether published workshop descriptions/schedules can be edited after requests exist.
- Whether a rejected provider may submit a new request.
- Whether provider cancellation is allowed after approval.
- Whether attendance is editable after a workshop is completed.
- Whether cancelled pending participation records should transition automatically to `CANCELLED`.
- Whether public detail pages remain accessible for cancelled/completed workshops through historical links.
- Whether capacity should be maintained as an atomic counter or derived from approved participant records.
