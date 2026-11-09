# Reviews & reports experience

## Job and audience

- **Audience:** Customers who completed a service booking, visitors reading service feedback, signed-in users reporting marketplace content, and admins reviewing reports.
- **Customer job:** Share a concise, useful account of a completed service without confusing a review with a complaint or support request.
- **Visitor job:** Assess service quality from readable, attributable feedback without seeing private booking or moderation data.
- **Reporter job:** Flag potentially inappropriate content and understand that submission enters moderation rather than immediately removing content.
- **Moderator job:** Triage open reports, inspect enough context to act, and resolve or dismiss them with an auditable decision.

## Outcome and product truth

- **Review outcome:** A customer submits one review for a booking only after the server confirms that booking is `COMPLETED`.
- **Report outcome:** A signed-in user submits a private report that starts `OPEN`; only an admin can resolve or dismiss it.
- **Trust proof:** Public reviews show rating, short comment, service context, and safe reviewer identity. Reports show the reporter only their own status history.
- **Product truth:** A review is not a report, a report is not an instant takedown, and an offline draft is not submitted content.
- **Data truth:** Review service/provider/customer relationships are derived from the completed booking. Report targets are validated against their declared collection type.

## Selected direction

- **Visual authority:** Extend [DESIGN.md](../../DESIGN.md): deep navy surfaces, blue primary actions, green for completed/resolved outcomes, amber for open or draft attention, and red only for failed/destructive actions.
- **Structural thesis:** Keep public feedback useful and moderation quiet:
  - service detail answers “what do customers say?”
  - completed booking answers “what can I review?”
  - report dialog answers “what are you flagging and why?”
  - moderator queue answers “what needs action next?”
- **Review rhythm:** Completed booking → rating and short comment → clear submission result → public service review.
- **Report rhythm:** Target context → reason → optional evidence note → private submission confirmation → status history.
- **Focal moment:** The interface must distinguish `Review submitted` from `Report submitted for moderation`, and both from `Draft — not submitted`.
- **Tone:** Specific, neutral, and non-accusatory. Do not promise anonymity, removal, investigation outcomes, or response times that the product does not implement.

## Scope and boundaries

- **Public surfaces:** Reviews summary and list on `/services/[id]`; report actions on service, supplier listing, review, and workshop surfaces.
- **Customer surfaces:** Review form from a completed booking, `/dashboard/my-reviews`, and review edit/delete actions.
- **User surfaces:** Report form and `/dashboard/my-reports`.
- **Admin surface:** `/admin/reports`, limited to a simple open-report queue with resolve/dismiss actions.
- **Included:** One review per completed booking, rating 1–5, short comment, own review management, target-validated reports, private report history, and admin moderation.
- **Excluded:** Public report counts, review replies, likes, photos, multi-category ratings, anonymous-review claims, automated moderation, appeals, public takedown explanations, and a large admin dashboard.

## Screen structure

### Reviews on service detail

- Place the section after the service description and primary booking action.
- Start with a compact summary:
  - average rating
  - review count
  - optional simple distribution
- Follow with a readable list of reviews.
- Each review prioritizes:
  1. rating expressed in text
  2. short comment
  3. safe reviewer name
  4. date
  5. quiet report action
- Empty state: `No reviews yet` with no negative implication.
- Keep review content at a comfortable reading width; do not make a dense rating dashboard.

### Review form from completed booking

- Show service title, provider, and completed booking context above the form.
- Required rating control: keyboard-accessible 1–5 choice with an explicit text alternative such as `4 out of 5`.
- Short comment field with a visible character limit.
- Primary action: `Submit review`.
- Supporting copy: “Your review will appear on this service after it is submitted.”
- If a review already exists, show the existing review and `Edit review` rather than a second form.
- If the booking is not completed, do not render a review form; show why it is not eligible.

### My reviews

- Route: `/dashboard/my-reviews`.
- Heading: `My reviews`.
- Each item shows service, provider, rating, comment, date, and edit/delete actions.
- Link back to the service where it remains available.
- Empty state points to completed bookings rather than generic discovery.
- Archived or unavailable services should retain readable review history with a neutral unavailable label.

### Report dialog

- Launch from the relevant target context and keep the target label visible.
- Fields:
  1. reason select: `SPAM`, `ABUSIVE`, `MISLEADING`, `OTHER`
  2. optional note
- Primary action: `Submit report`.
- Supporting copy: “Reports are reviewed by ServiceHub moderators. Submitting a report does not immediately remove content.”
- Restore an unfinished draft with **Draft — not submitted**.
- Close without destructive confirmation when no draft content exists; warn before discarding meaningful draft content if the shared dialog pattern supports it.

### My reports

- Route: `/dashboard/my-reports`.
- Show only reports authored by the current user.
- Each item shows target type/context, reason, submitted date, and status.
- Status labels:
  - `Open`
  - `Resolved`
  - `Dismissed`
- Do not expose admin notes or other reporters.
- If a target is unavailable, preserve the report row with `Reported content unavailable`.

### Admin reports

- Route: `/admin/reports`.
- Default to open reports.
- Keep it a focused list, not a metrics dashboard.
- Each row shows target, reason, reporter identity, note, submitted date, and status.
- Actions:
  - `Resolve`
  - `Dismiss`
- Use a focused confirmation/action dialog with an optional admin note.
- Resolved and dismissed reports are read-only in the base experience.

## Review lifecycle and eligibility

- A review can be created only when:
  - the current user is the booking’s `customerId`
  - the booking status is `COMPLETED`
  - no review already exists for that booking
- The server derives `serviceId`, `providerId`, and `customerId` from the booking.
- The client must never choose the service or provider relationship independently.
- `bookingId` has a unique review index to protect against rapid duplicate submissions.
- Editing changes only rating/comment and re-checks completed-booking ownership.
- Deleting removes the review from public results but never deletes the booking.
- A deleted review may be recreated for the same completed booking only if the product keeps active-review uniqueness rather than soft deletion.

## Report lifecycle and privacy

- Every report starts as `OPEN`.
- Only an admin may transition:
  - `OPEN → RESOLVED`
  - `OPEN → DISMISSED`
- Terminal report states are read-only in the base experience.
- The server derives `reporterId` from the session.
- The server validates that `targetId` exists in the collection matching `targetType`.
- Report notes are private moderation input; never expose them through public service, supplier, review, or workshop responses.
- User report history exposes only that user’s reports and safe status information.

## Offline drafts

- Use separate IndexedDB stores for `review-drafts` and `report-drafts` inside the existing `servicehub-pwa` database.
- Save unfinished fields locally and restore them after refresh.
- Label every restored or saved draft **Draft — not submitted**.
- Clear a draft only after the server confirms success.
- If submission fails, preserve the draft and show **Submission failed — Retry**.
- Manual online submission is the default; do not silently publish a review or file a report after reconnection.
- Scope draft keys by authenticated user when available to reduce shared-browser collisions.
- Never place review/report drafts or private API responses in the public Cache API.
- Public service review reads may be cached only as public content and must be marked stale when served offline.

## States and ranges

### Review states

- Loading reviews.
- No reviews yet.
- Completed booking eligible for review.
- Booking not eligible because it is not completed.
- Review already submitted.
- Draft restored.
- Invalid rating/comment.
- Duplicate review.
- Submission success.
- Submission failure.
- Service or booking unavailable.

### Report states

- Report dialog closed/open.
- Target unavailable.
- Draft restored.
- Invalid reason/note.
- Submission success.
- Submission failure.
- No submitted reports.
- Open report.
- Resolved report.
- Dismissed report.
- Empty admin queue.
- Concurrent moderator update.

Long names, comments, notes, and target labels must wrap without overlapping status badges or actions. Character limits must be visible before submission.

## Responsive and accessible behavior

- Use the shared Button, Input, Select, Textarea, Card, Badge, Dialog, and Loading components.
- Keep public review content readable on mobile; do not compress comments into horizontal tables.
- Stack review summary and review list on narrow screens; place them side by side only when there is enough measure.
- Use a full-width form on mobile and a restrained max-width form on larger screens.
- Rating controls must be keyboard operable and announce the selected value.
- Do not rely on stars or color alone; pair rating visuals with text.
- Every form field has a visible label and associated error message.
- Announce draft restoration, submission, and moderation results with `aria-live`.
- Dialogs need an accessible title, close action, focus management, and Escape support.
- Keep destructive delete actions visually distinct and require confirmation where deletion is irreversible.
- Preserve visible focus, readable contrast, and reduced-motion behavior.

## API and server contract

Reviews:

```text
POST  /api/reviews
GET   /api/reviews?serviceId=...
GET   /api/my-reviews
PATCH /api/reviews/[id]
DELETE /api/reviews/[id]
```

Reports:

```text
POST  /api/reports
GET   /api/my-reports
GET   /api/admin/reports?status=OPEN
PATCH /api/admin/reports/[id]
```

Server requirements:

- Validate all IDs, enums, rating ranges, and text lengths.
- Use authenticated session identity for customer, reporter, and admin permissions.
- Re-check booking completion and ownership in the review mutation.
- Use a unique `bookingId` index for review idempotency.
- Use conditional status updates for moderator race protection.
- Keep private report data out of public serializers and service-worker routes.

## Anti-goals

- No review replies, votes, likes, photos, anonymous claims, or multi-dimensional rating forms.
- No automatic deletion or hiding based solely on a report.
- No public report counters or moderation dashboard metrics.
- No optimistic review/report success when offline.
- No private reporter notes in public caches.
- No ability to review pending, accepted, in-progress, rejected, or cancelled bookings.
- No duplicate service/provider records.
- No gradient, orange-dominant, or card-grid-heavy moderation interface.

## Open decisions to resolve before implementation

- Whether review deletion should permit a replacement review for the same completed booking.
- Whether a provider or admin may edit or hide a review after moderation; the base feature only grants author edit/delete.
- Whether same-target duplicate reports should be allowed or softly deduplicated.
- Whether public reviews remain visible on archived service pages or only while the service is published.
- Whether report target snapshots should be stored for stable history when a target is later archived or removed.
