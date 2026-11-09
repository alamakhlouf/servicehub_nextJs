# Service booking experience

## Job and audience

- **Audience:** Customers requesting a published service, and providers reviewing work requested for their own services.
- **Customer job:** Choose a realistic preferred date and time, provide the service area and context, then understand whether the provider has accepted the request.
- **Provider job:** Review incoming requests, make a clear accept/reject decision, and close accepted work when it is complete.
- **Visitor mode:** Decide. Booking is a focused continuation of service discovery, not a marketplace checkout.
- **Provider mode:** Respond. The dashboard should make pending work and the next valid action obvious.

## Outcome and product truth

- **Customer outcome:** A booking request is either confirmed by the server as `PENDING`, or clearly held locally as **Pending sync** until the server responds.
- **Provider outcome:** A provider can see only requests for their services and can perform only valid lifecycle actions.
- **Trust proof:** Every booking preserves the selected service, provider, requested local date/time, area, and current status.
- **Product truth:** A request is not accepted until the provider accepts it. Offline storage is not a booking confirmation. A completed booking is the only state eligible for a review.
- **Data truth:** The booking references the existing `services` collection. It must never create or copy a second service entity.

## Selected direction

- **Visual authority:** Extend [DESIGN.md](../../DESIGN.md): deep navy canvas, layered surfaces, blue primary actions, green success, restrained amber attention, and red only for destructive/error feedback.
- **Structural thesis:** Keep one decision per screen:
  - service detail answers “is this right for me?”
  - booking form answers “what do you need and when?”
  - booking detail answers “what is the current agreement?”
  - provider queue answers “which request needs my response?”
- **Customer rhythm:** Service context → preferred timing → service area → optional note → request status.
- **Provider rhythm:** Pending request → requested details → accept/reject → accepted work → complete or cancel.
- **Focal moment:** The confirmation after submission must distinguish **Request sent — awaiting provider** from **Pending sync — not yet sent**.
- **Tone:** Practical, calm, and explicit. Avoid urgency, promotional pricing language, payment metaphors, and calendar-heavy interfaces.

## Scope and boundaries

- **Customer surfaces:** Continue from `/services/[id]`, booking form at `/bookings/new/[serviceId]`, booking history at `/dashboard/bookings`, and booking detail at `/dashboard/bookings/[id]`.
- **Provider surfaces:** The same role-aware booking list and detail routes, showing incoming requests for owned services.
- **Included:** Preferred local date, simple local time, address/area, short note, provider decisions, cancellation, completion, history, and offline request queue.
- **Excluded:** Payments, checkout, complex calendars, recurring availability, timezone conversion, live chat, automatic time negotiation, maps, reminders, and provider analytics.
- **Availability boundary:** The base experience uses preferred date/time plus provider review. It does not pretend to offer a guaranteed slot calendar.
- **Review boundary:** Booking exposes completion truth for the Reviews module; it does not implement reviews.

## Screen structure

### Booking entry — service detail

- Replace the existing disabled continuation with a clear **Request this service** or **Continue to booking** action when the service is published.
- Keep price, unit, provider, and area visible before the user commits to the form.
- Do not show the booking action for draft or archived records.
- Unauthenticated users should be sent through the existing safe authentication return flow rather than losing the service context.
- Cached service details may remain usable offline, but the action must lead to a local pending request rather than imply server availability.

### Customer booking form

- Compact service summary at the top: title, provider, area, and indicative price.
- One single-column form on mobile:
  1. preferred date
  2. preferred time
  3. address or area
  4. optional short note
- Primary action: **Send booking request**.
- Supporting copy: “The provider will review your preferred time. No payment is collected.”
- Keep the requested date/time as local `YYYY-MM-DD` and `HH:mm`; do not display timezone conversions.
- Preserve values through validation errors and network failures.
- On submit, prevent duplicate clicks and announce progress.

### Customer booking history

- Heading: **My bookings**.
- Filter tabs: All, Pending, Accepted, Completed, Cancelled.
- Rejected bookings remain discoverable in All; do not hide an important negative decision.
- Each item prioritizes service title, requested/agreed date and time, provider, and status.
- Empty states should explain the next action, such as browsing services.
- Local queue items use a distinct **Pending sync** label and never masquerade as server `PENDING`.

### Provider booking queue

- Heading: **Booking requests** or **Incoming bookings**.
- Lead with pending requests, then accepted/upcoming work.
- Each request shows service, customer, requested date/time, area, note, and status.
- Primary action changes with state:
  - **Accept request**
  - **Reject request**
  - **Mark completed**
  - **Cancel booking**
- Rejection and provider cancellation may ask for an optional reason; use a confirmation dialog only for cancellation, not routine acceptance.

### Booking detail

- Show a concise service and participant summary, not a dense dashboard.
- Make current status the first operational fact after the heading.
- Show requested date/time, agreed date/time when present, area, note, cancellation reason, and status history.
- Keep role-specific actions beside the current state and remove actions that are no longer valid.
- Include a quiet link back to the service where it remains public; historical booking data must still work if the service is archived.

## Lifecycle language

| State | Customer meaning | Provider meaning | Tone |
|---|---|---|---|
| `PENDING` | Request sent; waiting for provider | Needs a decision | Amber |
| `ACCEPTED` | Provider accepted the request | Work is scheduled/accepted | Green |
| `REJECTED` | Provider could not accept | Request closed | Neutral/error |
| `CANCELLED` | Request/work was cancelled | No further action | Neutral/error |
| `COMPLETED` | Work marked complete; review eligible | Work finished | Green |
| Pending sync | Saved on this device; not sent yet | Not visible to provider | Amber, explicitly local |
| Sync failed | Could not send; retry available | Not visible to provider | Red/error |

Allowed base transitions:

- `PENDING → ACCEPTED` by provider
- `PENDING → REJECTED` by provider
- `PENDING → CANCELLED` by customer
- `ACCEPTED → COMPLETED` by provider
- `ACCEPTED → CANCELLED` by provider

Rejected, cancelled, and completed are terminal. Never offer a reopen action.

## Availability and timing

- Treat a date/time as a preference until the provider accepts it.
- Use native date and time controls with visible labels and server validation.
- Reject malformed, impossible, or past selections.
- Avoid client/server timezone transformations; this project treats values as local marketplace time.
- Do not build recurring schedules or a calendar grid.
- At acceptance time, detect an existing active booking for the same provider/date/time and return a clear conflict rather than silently double-booking.
- Because time negotiation is outside the base lifecycle, do not imply that the provider can propose a new time. Keep `agreedDate` and `agreedTime` available for a later explicitly designed workflow.

## Offline behavior

- Cache only public service reads through the existing service worker. Never cache booking writes or private booking responses.
- Store offline customer requests in a dedicated IndexedDB booking queue, separate from supplier listing drafts.
- Generate a `clientRequestId` per request and send it with every retry.
- On refresh or reconnection, retry the queue. On a successful response, replace the local item with the real server booking.
- Idempotency must make a lost response and repeated retry safe.
- On failure, retain the request and show **Sync failed — Retry** with a user-safe explanation.
- If authentication expired or the service is no longer bookable, surface the failure and keep enough entered data for the customer to decide whether to edit or discard it.
- Never say “accepted,” “confirmed,” or “sent” for an offline-only record.

## States and ranges

- **Loading:** service context, booking history, provider queue, and detail use stable skeletons or explicit loading text.
- **Empty:** explain what the user can do next; avoid blank panels.
- **Not found/unavailable:** do not reveal whether a private service or booking exists.
- **Validation:** field-level errors below controls plus a form-level summary for server errors.
- **Network failure:** state whether the request was saved locally, not saved, or already synchronized.
- **Stale service:** show `Offline copy — may be outdated` near cached public content.
- **Long content:** titles, provider/customer names, areas, notes, and reasons wrap without pushing actions off-screen.
- **Concurrent update:** explain that the booking changed elsewhere and refresh the current state.

## Interaction, accessibility, and responsive behavior

- Use the shared Button, Input, Select, Textarea, Card, Badge, Dialog, and Loading components.
- Keep mobile controls at least 40px high, preferably 44px for primary actions.
- Stack form fields and detail metadata on mobile; use a restrained two-column detail layout from tablet widths upward.
- Keep filters keyboard-operable and expose the selected tab with semantic state, not color alone.
- Associate every error with its input and announce form-level errors with `role="alert"`.
- Use `aria-live` for submission, sync, and status-transition feedback.
- Disable mutation controls while a request is in flight.
- Make destructive cancellation explicit and require a reason when the product decision requires one.
- Preserve visible focus and support reduced motion.
- Do not use status color as the sole indicator; pair badges with text.

## Server and ownership contract

- Only `CUSTOMER` may create a booking.
- The server derives `customerId` from the session and `providerId` from the referenced published service.
- Customers read and cancel only their own bookings.
- Providers read and update only bookings whose `providerId` matches their account.
- The server validates every transition against the stored current status.
- A service being archived must not delete or invalidate historical bookings.
- Address, notes, and booking history are private to the customer and provider; they must never enter public service caches.

## Anti-goals

- No payment fields or checkout language.
- No “instant booking” promise.
- No generic calendar dashboard or month grid.
- No automatic acceptance of offline requests.
- No optimistic success that hides whether MongoDB confirmed the request.
- No duplicate service/provider records.
- No nested card stack, gradient hero, orange-dominant surface, or invented availability data.

## Open decisions to resolve before implementation

- Whether same-day requests are allowed when the selected local time is still in the future.
- Whether a provider cancellation requires a reason or keeps it optional as specified.
- Whether accepted bookings should reserve a provider/date/time exclusively or permit multiple concurrent requests for a service.
- Whether the first implementation should store embedded status history or introduce a separate booking-events collection. Embedded history is recommended for the student scope.
