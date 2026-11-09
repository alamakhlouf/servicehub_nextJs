# Feature 6 — Workshop Management (Member 6)

## Objective
Add workshops related to services and professional skills. An organizer creates and manages workshops. Service providers can request to participate; the organizer approves or rejects their requests and records attendance.

For the simplest implementation, treat the workshop creator as the organizer. An admin can create workshops too. Do not build ticket sales, payment, video conferencing, or complex event scheduling.

## User stories — workshop management
- As an organizer, I can create a workshop with a title, description, category, location, date/time, duration, and capacity.
- As an organizer, I can view, edit, publish, cancel, or mark my workshop completed.
- As a visitor/customer/provider, I can browse published upcoming workshops and see details.
- As an organizer, I can see provider participation requests and approve/reject them.
- As a provider, I can request to participate and see my participation status.
- As an organizer, I can mark approved providers attended or absent after the workshop.

## Screens
- `/workshops`: published upcoming workshops.
- `/workshops/[id]`: workshop detail and participation action for providers.
- `/dashboard/my-workshops`: organizer's workshops.
- `/dashboard/workshops/new` and `/dashboard/workshops/[id]/edit`.
- `/dashboard/workshops/[id]/participants`: simple participant list with Approve/Reject and attendance controls.
- `/dashboard/my-participation`: provider's own participation requests.

## Simple forms
Workshop: title, short description, category, location, date/time, duration, capacity.
Participation: optional short note.
No file uploads, ticketing, payments, waitlist automation, recurring events, or external calendar integration.

## MongoDB documents
`workshops`:
```ts
{
  _id: ObjectId,
  organizerId: ObjectId,
  title: string,
  description: string,
  category: string,
  location: string,
  startAt: Date,
  durationMinutes: number,
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
  providerId: ObjectId,
  note?: string,
  status: "PENDING" | "APPROVED" | "REJECTED" | "CANCELLED",
  attendance: "NOT_MARKED" | "ATTENDED" | "ABSENT",
  createdAt: Date,
  updatedAt: Date
}
```

Workshop date/time behavior:

- The form uses `datetime-local`.
- The browser converts the selected local value to an ISO timestamp before submission.
- The server stores it as a MongoDB `Date`.
- Public displays format the stored instant in the viewer's local timezone.
- `durationMinutes` is calculated from end minus start and must be between 15 minutes and 24 hours.

## API
Workshops:
- `GET /api/workshops` — public published workshops.
- `POST /api/workshops` — organizer/admin only.
- `GET /api/workshops/[id]`
- `PATCH /api/workshops/[id]` — owner/admin only.
- `DELETE /api/workshops/[id]` — owner/admin only; prefer status `CANCELLED`.

Participation:
- `POST /api/workshops/[id]/participants` — provider requests participation.
- `GET /api/workshops/[id]/participants` — organizer/admin only.
- `GET /api/my-workshop-participation` — provider's own requests.
- `PATCH /api/workshop-participants/[id]` — organizer approves/rejects and later records attendance.

## Business rules
- Only `PROVIDER` can request participation.
- A provider can request participation only once per workshop; enforce a unique compound index `{ workshopId, providerId }`.
- Provider cannot participate in a cancelled/completed workshop.
- Only published workshops appear publicly.
- Organizer identity comes from the session; only organizer/admin can edit the workshop.
- Capacity must be a positive integer. Do not approve more participants than capacity.
- Approval must check capacity atomically or re-check immediately before update to reduce overbooking risk.
- Only approved participants can be marked attended/absent.
- Workshop cancellation should preserve participant records and make the cancellation visible.
- Participation status and attendance are separate concepts.

## PWA contribution — offline workshop browsing and participation draft
- Cache public published workshop list/details with a network-first strategy and offline fallback.
- Label cached workshop content **Offline copy — may be outdated**.
- If a provider starts a participation request offline, preserve the note/form as a local draft; submit once online.
- Do not show a provider as approved until the server confirms it.
- Never cache private participant-management API responses for public access.

## Acceptance criteria
- Organizer can CRUD/publish/cancel workshops.
- Providers can request participation and see request status.
- Organizer can approve/reject and record attendance.
- Capacity and ownership are validated by the server.
- Public workshop information is available offline after being loaded online.
- Offline participation draft is not presented as an approved registration.
