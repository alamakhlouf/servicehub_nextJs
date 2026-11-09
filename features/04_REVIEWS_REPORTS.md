# Feature 4 — Reviews & Reports (Member 4)

## Objective
Customers can review a service after a booking is completed. Any signed-in user can report inappropriate marketplace content. Admin can resolve or dismiss reports.

## User stories — reviews
- As a customer, I can rate a service from 1 to 5 stars after my booking is completed.
- As a customer, I can add a short comment.
- As a visitor, I can read reviews on a service detail page.
- As a customer, I can see the reviews I have submitted.

## User stories — reports
- As a signed-in user, I can report a service, supplier listing, review, or workshop.
- As a user, I can see the status of reports I submitted.
- As an admin, I can view open reports and resolve or dismiss them with an optional admin note.

## Screens
- Review form shown from a completed booking: rating control + short comment.
- Reviews section on service detail.
- `/dashboard/my-reviews`.
- Report action in relevant detail/review UI; report form is reason dropdown + optional note.
- `/dashboard/my-reports`.
- `/admin/reports`: simple list with Resolve/Dismiss actions (not a complex admin dashboard).

## Minimal forms
Review: rating (1–5) and comment (maximum around 500 characters).
Report: target type, reason (`SPAM`, `ABUSIVE`, `MISLEADING`, `OTHER`), optional note.
Admin resolution: status and optional short note.

## MongoDB documents
`reviews`:
```ts
{
  _id: ObjectId,
  bookingId: ObjectId,
  serviceId: ObjectId,
  providerId: ObjectId,
  customerId: ObjectId,
  rating: number,
  comment: string,
  createdAt: Date,
  updatedAt: Date
}
```
`reports`:
```ts
{
  _id: ObjectId,
  reporterId: ObjectId,
  targetType: "SERVICE" | "SUPPLIER_LISTING" | "REVIEW" | "WORKSHOP",
  targetId: ObjectId,
  reason: "SPAM" | "ABUSIVE" | "MISLEADING" | "OTHER",
  note?: string,
  status: "PENDING" | "UNDER_REVIEW" | "RESOLVED" | "DISMISSED",
  adminNote?: string,
  createdAt: Date,
  updatedAt: Date
}
```

## API
Reviews:
- `POST /api/reviews` — customer with completed booking.
- `GET /api/reviews?serviceId=...`
- `GET /api/my-reviews`
- Optional `PATCH /api/reviews/[id]` for own review.

Reports:
- `POST /api/reports` — authenticated user.
- `GET /api/my-reports` — reporter's own reports.
- `GET /api/admin/reports?status=PENDING|UNDER_REVIEW|RESOLVED|DISMISSED` — admin only.
- `PATCH /api/admin/reports/[id]` — admin only, move a pending report under review or resolve/dismiss it.

## Business rules
- Rating must be an integer from 1 to 5.
- A booking must belong to the customer and have status `COMPLETED`.
- One review per booking; enforce with a unique index on `bookingId`.
- The server derives customerId/providerId/serviceId from the booking.
- Report target must exist and be of an allowed target type.
- Only the reporter and admin may access report details; public users must not see private reporter notes.
- A new report starts as `PENDING`.
- Only admin can move a report to `UNDER_REVIEW`, `RESOLVED`, or `DISMISSED`.
- `RESOLVED` and `DISMISSED` are terminal moderation outcomes.
- Do not expose admin routes to ordinary users; enforce permissions on the server too.

## PWA contribution — save review/report drafts
- Save unfinished review/report form drafts locally in IndexedDB.
- Restore after refresh/offline and label **Draft — not submitted**.
- Do not cache private report responses in the shared HTTP cache.
- Minimum scope: user submits once online; offline draft remains until successful submission.
- Optional: retry queued submissions on reconnect, with a clientRequestId to prevent duplicates.
- Clear draft only after server success.

## Acceptance criteria
- Review is impossible before the related booking is completed.
- A customer cannot review another customer's booking.
- Duplicate reviews are rejected.
- User can submit a report and view only their own report history.
- Only admin can resolve/dismiss reports.
- Offline draft behavior is clear and private report data is not cached publicly.
