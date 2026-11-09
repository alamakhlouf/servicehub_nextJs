# Feature 5 — Service Booking (Member 5)

## Objective
Build the complete basic booking lifecycle between a customer and provider. “Complete” here means request, provider decision, status tracking, cancellation, completion, and review eligibility. Do not add payment or complicated calendar integrations.

## User stories — customer
- As a customer, I can start a booking from a published service.
- As a customer, I can choose a preferred date and time and enter a service address/area.
- As a customer, I can add a short optional note describing the request.
- As a customer, I can view my bookings and their statuses.
- As a customer, I can cancel a pending booking.
- As a customer, I can see when a provider accepts or rejects my request.

## User stories — provider
- As a provider, I can see booking requests for my services.
- As a provider, I can accept or reject a pending request.
- As a provider, I can view upcoming/accepted bookings.
- As a provider, I can mark an accepted booking completed after the work is done.
- As a provider, I can cancel an accepted booking with a reason (optional).

## Screens
- Booking form on service detail or `/bookings/new/[serviceId]`.
- `/dashboard/bookings`: role-aware list (customer's bookings or provider's incoming bookings).
- `/dashboard/bookings/[id]`: booking detail, status history, available actions.
- Simple filter tabs: All, Pending, Accepted, Completed, Cancelled. Do not build a calendar grid.

## Booking form
Required: preferred date, preferred time (simple select or time input), address/area.
Optional: short note. Show service title, provider, and indicative price above the form. No payment fields.

## MongoDB document
`bookings`:
```ts
{
  _id: ObjectId,
  serviceId: ObjectId,
  providerId: ObjectId,
  customerId: ObjectId,
  requestedDate: string,       // YYYY-MM-DD
  requestedTime: string,       // HH:mm
  addressOrArea: string,
  note?: string,
  agreedDate?: string,
  agreedTime?: string,
  cancellationReason?: string,
  status: "PENDING" | "ACCEPTED" | "IN_PROGRESS" | "REJECTED" | "CANCELLED" | "COMPLETED",
  createdAt: Date,
  updatedAt: Date
}
```
Store date/time consistently; for a student project, local date + 24-hour time strings are acceptable if the team consistently treats them as local time. Do not mix browser timezone conversions unpredictably.

## API
- `POST /api/bookings` — customer creates a booking.
- `GET /api/bookings` — current user's bookings (role-aware).
- `GET /api/bookings/[id]` — customer or provider involved.
- `PATCH /api/bookings/[id]` — provider accepts/rejects/completes; customer cancels pending booking.
- Optional `GET /api/bookings?status=PENDING`.

## Business rules and lifecycle
Allowed transitions:
- `PENDING → ACCEPTED → IN_PROGRESS → COMPLETED`
- `PENDING → REJECTED`
- `PENDING → CANCELLED` (customer)
- `ACCEPTED → CANCELLED` (provider)

Rules:
- Only customers can create bookings.
- The service must exist and be `PUBLISHED`.
- ProviderId is copied from the service by the server; never accept it as authoritative from the browser.
- Customer cannot book their own service.
- Provider can update only bookings linked to their services.
- Customer can read/cancel only their own bookings.
- `requestedDate` and `requestedTime` are the customer's preferred local date and 24-hour time.
- When a provider accepts, the server records `agreedDate` and `agreedTime`. The current UI confirms the requested values by default; the API accepts an explicit agreed pair for future provider scheduling controls.
- Date and time strings are treated as local values consistently; no implicit timezone conversion is used for bookings.
- Reject invalid status transitions.
- Rejected/cancelled/completed bookings cannot be reopened.
- Do not allow duplicate rapid submissions; optional `clientRequestId` unique index is recommended.
- Do not mark a booking completed from the customer UI.
- A completed booking becomes eligible for one review.

## PWA contribution — offline booking request queue
This is the most important offline write workflow in the app.
1. If online, submit to the API normally.
2. If offline, store the booking payload in IndexedDB with a generated `clientRequestId`.
3. Show it in the customer's booking list as **Pending sync** (local only).
4. Retry on the next app launch or `online` event. Background Sync is optional and not supported by every browser.
5. API must be idempotent for a given user + clientRequestId so retry does not create duplicates.
6. On success, replace local pending item with the MongoDB booking and show its real status.
7. On failure, preserve the item and show **Sync failed — Retry**.

Never claim an offline request is accepted or confirmed. It is only a local request until the server responds.

## Acceptance criteria
- Customer creates a booking with date/time/address and optional note.
- Provider accepts/rejects and can mark accepted work completed.
- Both sides see accurate status.
- Server enforces ownership and valid transitions.
- Completed booking can be reviewed; other statuses cannot.
- Offline booking survives refresh, is labelled pending sync, and does not duplicate on retry.
