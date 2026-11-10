# Feature 6 — Workshop Management (Member 6)

## Objective
Service **providers** create and manage workshops related to services and professional skills. **Customers** enroll in published workshops. The provider (organizer) approves or rejects enrollment requests and records attendance.

The workshop creator is the organizer, and the organizer is always a user with role `PROVIDER`. An `ADMIN` may moderate (edit/cancel any workshop, see any enrollment list) but does not create workshops. Do not build ticket sales, payment, video conferencing, or complex event scheduling.

## Role matrix (authoritative)
| Action | VISITOR | CUSTOMER | PROVIDER | SUPPLIER | ADMIN |
|---|---|---|---|---|---|
| Browse published workshops | yes | yes | yes | yes | yes |
| Create workshop | no | no | **yes** | no | no |
| Edit/publish/cancel/complete own workshop | no | no | **yes (own only)** | no | yes (any, moderation) |
| Request enrollment | no | **yes** | no | no | no |
| Cancel own enrollment | no | **yes** | no | no | no |
| Approve/reject enrollment, mark attendance | no | no | **yes (own workshops only)** | no | yes (any) |
| See enrollment list of a workshop | no | own record only | own workshops only | no | yes |

Providers, suppliers and admins can never enroll. Server returns 403 (with a clear message) for any other role.

## User stories
- As a provider, I can create a workshop with a title, description, category, location, start and end date/time, and capacity.
- As a provider, I can view, edit, publish, cancel, or mark my workshop completed.
- As a visitor/customer/provider/supplier, I can browse published upcoming workshops and see details.
- As a customer, I can request to enroll in a workshop and see my enrollment status.
- As a customer, I can cancel my enrollment (pending or approved) before the workshop starts.
- As a provider, I can see customer enrollment requests for my workshop and approve/reject them.
- As a provider, I can mark approved customers attended or absent after the workshop.

## Screens
- `/workshops`: published upcoming workshops.
- `/workshops/[id]`: workshop detail. Enrollment action is shown to customers only. Visitors see "Sign in as a customer to enroll". Providers/suppliers/admins see no enroll button and a short note ("Only customers can enroll").
- `/dashboard/my-workshops`: provider's own workshops (provider/admin nav only).
- `/dashboard/workshops/new` and `/dashboard/workshops/[id]/edit` (provider only; admin edit only).
- `/dashboard/workshops/[id]/participants`: enrollment list with Approve/Reject and attendance controls (owner provider / admin).
- `/dashboard/my-participation`: customer's own enrollment requests (customer nav only).

## Simple forms
Workshop: title, short description, category, location, start (datetime-local), end (datetime-local). Capacity.
Enrollment: optional short note.
No file uploads, ticketing, payments, waitlist automation, recurring events, or external calendar integration.

## MongoDB documents
`workshops`:
```ts
{
  _id: ObjectId,
  organizerId: ObjectId,      // users._id, role PROVIDER, taken from the session
  title: string,
  description: string,
  category: string,
  location: string,
  startAt: Date,
  durationMinutes: number,    // derived on the server from end - start
  capacity: number,
  status: "DRAFT" | "PUBLISHED" | "CANCELLED" | "COMPLETED",
  createdAt: Date,
  updatedAt: Date
}
```
`workshopParticipants`:
```ts
{
  _id: ObjectId,
  workshopId: ObjectId,
  customerId: ObjectId,       // users._id, role CUSTOMER, taken from the session
  note?: string,
  status: "PENDING" | "APPROVED" | "REJECTED" | "CANCELLED",
  attendance: "NOT_MARKED" | "ATTENDED" | "ABSENT",
  createdAt: Date,
  updatedAt: Date
}
```
Indexes: unique `{ workshopId, customerId }`; `{ customerId, createdAt }`; `{ workshopId, status }`; `{ status, startAt }` on workshops.

Date/time behavior:
- The form has two `datetime-local` fields: start and end.
- The browser converts both to ISO timestamps before submission.
- The server stores `startAt` as a MongoDB `Date` and computes `durationMinutes = end - start`; it must be between 15 minutes and 24 hours.
- `startAt` must be in the future when creating or publishing.
- Displays format the stored instant in the viewer's local timezone.

## API
Workshops:
- `GET /api/workshops` — public published upcoming workshops.
- `POST /api/workshops` — **PROVIDER only**.
- `GET /api/workshops/[id]` — published: public. Draft: owner/admin only (404 for others).
- `PATCH /api/workshops/[id]` — owner provider / admin.
- `DELETE /api/workshops/[id]` — owner provider / admin; soft-cancel (status `CANCELLED`).

Enrollments:
- `POST /api/workshops/[id]/participants` — **CUSTOMER only**.
- `GET /api/workshops/[id]/participants` — owner provider / admin only.
- `GET /api/my-workshop-participation` — customer's own enrollments.
- `PATCH /api/workshop-participants/[id]` — owner provider / admin: approve, reject, attendance. Customer: cancel own enrollment only.

## Business rules
- Only `PROVIDER` can create workshops; the organizer id comes from the session, never from the request body.
- Only `CUSTOMER` can request enrollment. Provider, supplier and admin get 403.
- One enrollment per customer per workshop (unique `{ workshopId, customerId }`). A rejected or cancelled customer cannot re-request (409); keeps the base experience simple.
- Enrollment only while the workshop is `PUBLISHED` and `startAt` is in the future.
- Only published upcoming workshops appear publicly. Public responses expose organizer display name only (no email/phone).
- Only the owner provider (or admin) can edit/cancel/complete the workshop and manage its enrollments.
- Capacity is a positive integer and cannot be lowered below the approved count.
- Approval re-checks capacity atomically (conditional update/transaction). Pending requests do not consume capacity.
- Customer cancelling an approved enrollment frees the slot.
- Only approved enrollments can be marked attended/absent, and only once the workshop has started or is `COMPLETED`.
- Attendance remains editable by the organizer after completion (default decision).
- Cancelling a workshop keeps all enrollment records, sets PENDING and APPROVED enrollments to `CANCELLED`, and shows the cancellation to affected customers.
- Participation status and attendance are separate concepts.

## PWA contribution — offline workshop browsing and enrollment draft
- Cache public published workshop list/details with a network-first strategy and offline fallback.
- Label cached workshop content **Offline copy — may be outdated**.
- If a customer starts an enrollment request offline, preserve the note as a local draft in IndexedDB; submit once online. Use a `clientRequestId` to prevent duplicates.
- Scope local drafts by the signed-in user id and clear them on logout (shared devices).
- Do not show a customer as approved until the server confirms it. Local states: `DRAFT`, `PENDING_SYNC`, `FAILED` (retry available).
- Never cache private enrollment API responses (`/api/workshops/[id]/participants`, `/api/my-workshop-participation`, `/api/workshop-participants/*`).

## Acceptance criteria
- A provider can CRUD/publish/cancel/complete their own workshops; customers and others cannot create them (server returns 403).
- Customers can request enrollment and see status; providers/suppliers/admins cannot enroll (server returns 403).
- The provider can approve/reject and record attendance only on their own workshops.
- Capacity and ownership are validated by the server.
- Public workshop information is available offline after being loaded online.
- An offline enrollment draft is never presented as an approved registration.

## Enhancements

- Public workshop discovery supports shareable category, date, text, and availability filters with offline-aware results.
- Workshops include skill level, learning points, requirements, format, and private online meeting links with approved-customer access.
- Customers receive private in-app notifications for enrollment decisions, cancellations, and meaningful workshop updates.
