# Services & catalog experience

## Job and audience

- **Audience:** Visitors and customers looking for a local service, plus providers who need to create and maintain their own listings.
- **Job:** Help people find a relevant, trustworthy service quickly, while giving providers a simple way to publish accurate availability and pricing.
- **Visitor mode:** Operate. The catalogue should feel useful and calm rather than promotional or dashboard-like.
- **Provider mode:** Maintain. Provider screens should make listing status and next actions obvious without turning service management into an administrative maze.

## Outcome and proof

- **Customer outcome:** A visitor can compare published services and open a detail page with enough information to decide whether to continue toward booking.
- **Provider outcome:** A provider can create a draft, publish it, see its current status, edit it, and archive it without losing control of their other listings.
- **Proof of trust:** Every listing shows a clear title, category, description, price unit, city or area, provider identity, and publication status where appropriate.
- **Product truth:** Public browsing does not require authentication. Draft and archived services are not public. A listing is not bookable unless the server confirms it is published.

## Selected direction

- **Visual authority:** Extend the ServiceHub system in [DESIGN.md](../../DESIGN.md): deep navy canvas, layered navy surfaces, blue primary actions, green success, restrained amber attention, Plus Jakarta Sans headings, and Inter controls/body.
- **Structural thesis:** Make discovery the primary surface, not a marketing hero. Lead with a compact search/filter row, then a readable service list with clear price and location metadata. Keep provider management task-oriented and status-led.
- **Catalogue rhythm:** Context → category/search controls → result count or state → service results → detail continuation.
- **Provider rhythm:** Current status → listing summary → one primary next action → secondary edit/archive actions.
- **Focal moment:** The service card/detail combination should answer “What is offered, where, by whom, and from what price?” without requiring a noisy card grid or decorative imagery.
- **Implementation consequence:** Public responses and cached content must be visibly distinguishable from private provider management data. Booking is a downstream action and must never be implied for a draft or archived service.

## Scope and boundaries

- **Public surfaces:** `/services` and `/services/[id]`.
- **Provider surfaces:** `/dashboard/my-services`, `/dashboard/my-services/new`, and `/dashboard/my-services/[id]/edit`.
- **Public interactions:** Category filter, bounded text search, service detail navigation, and report-service entry point.
- **Provider interactions:** Create draft, edit owned service, publish, archive, and inspect listing status.
- **Required listing fields:** Title, category, short description, price, price unit (`FIXED`, `PER_HOUR`, `FROM`), and city/area.
- **Not in this surface:** Image upload, advanced availability calendars, payments, maps, ratings, reviews, booking creation, chat, recommendations, or admin moderation workflows.
- **Booking boundary:** The detail page may expose a clear “Continue to booking” entry point when booking is available, but the Booking module owns request creation and availability rules.
- **Report boundary:** The service surface provides the target context; the Reports module owns persistence, moderation, and resolution.

## Screen structure

### Public catalogue — `/services`

- Quiet page heading such as “Find a local service”.
- Short supporting copy explaining that visitors can browse without signing in.
- One compact control region containing:
  - text search
  - category select
  - clear filters action when filters are active
- Results communicate the active filter context and count where available.
- Service results use a responsive list:
  - one column on mobile
  - two columns only when the content measure supports comfortable scanning
- Each service item prioritizes:
  1. title
  2. category
  3. city/area
  4. price and unit
  5. provider name
  6. concise description
- Use a category icon or neutral placeholder only. Do not create an image-heavy marketplace grid.
- Each item has one clear destination: view details.

### Service detail — `/services/[id]`

- Title and category form the first information block.
- Price and unit are visually prominent but not styled as a promotional badge.
- City/area and provider summary appear near the primary facts.
- Description is readable at a comfortable line length.
- The main action is a future booking continuation when the service is published and booking is available.
- Reporting is secondary and visually quiet, using a dialog or dedicated lightweight form only when needed.
- Public users never see edit, archive, or private status controls.
- An owner may inspect their own draft or archived service through the provider management context, but those records must not appear as public catalogue content.

### Provider listing index — `/dashboard/my-services`

- Page heading states ownership clearly: “My services”.
- Primary action: create service.
- Each row or item shows:
  - title
  - category
  - city
  - price/unit
  - updated date
  - status badge
- Keep actions local and explicit:
  - edit
  - publish for drafts
  - archive for active listings
- Avoid nested cards and dashboard metric tiles. The listing itself is the work surface.
- Empty state should explain the value of publishing a first service and provide one create action.

### Create/edit form

- Use a single-column mobile-first form with visible labels.
- Group only related fields:
  - service basics: title, category, description
  - pricing: price, price unit
  - service area: city/area
- Keep draft saving and publishing distinct in language.
- Do not imply that saving a draft makes it public.
- On edit, show current status and explain irreversible or visibility-changing actions before confirmation.
- Preserve entered values on validation or network failure.

## States and ranges

- **Initial loading:** skeleton controls and service rows without layout shift.
- **Catalogue empty:** explain that no published services are available yet; do not show a dead-end blank canvas.
- **No results:** state which filters produced no matches and offer a clear reset.
- **Service unavailable:** use a neutral not-found/unavailable state without revealing whether a private record exists.
- **Provider empty:** explain how to create a first listing.
- **Draft:** clearly marked as private and not bookable.
- **Published:** clearly marked as visible to customers.
- **Archived:** clearly marked as no longer public or bookable.
- **Saving:** disable the relevant submit action and announce progress.
- **Saved:** confirm the operation and explain visibility, especially for publish/archive.
- **Validation:** field-level errors below controls plus a form-level summary when appropriate.
- **Network failure:** explain that the service was not saved; never present a failed write as successful.
- **Offline public content:** show `Offline copy — may be outdated` near cached catalogue/detail content.
- **Offline provider changes:** remain local drafts only if a later shared draft mechanism is introduced; never claim MongoDB persistence offline.
- **Long content:** titles, provider names, descriptions, and city names must wrap without overlapping actions.

## Interaction and layout

- Mobile-first with 16px page gutters, 24px tablet gutters, and 32px desktop gutters.
- Use a centered container capped near the design system’s 1280px maximum.
- Keep filters stacked on narrow screens and place them in one row only when controls remain comfortably tappable.
- Use 40px minimum controls and 44px preferred touch targets on mobile.
- Use visible focus styles and keyboard-operable filter, card-link, form, and status actions.
- Do not rely on color alone for service status; pair badges with text.
- Use URL query parameters for catalogue filters so filtered views are shareable and navigable.
- Preserve filter state when returning from a service detail page.
- Keep the public catalogue usable without sign-in. Authentication should be requested only when a downstream protected action requires it.
- If a service is not published, the server—not only the UI—must prevent public display and booking.

## Content and tone

- Use direct labels: “Price”, “Per hour”, “From”, “Service area”, “Published”, “Draft”, “Archived”.
- Avoid promotional claims, invented ratings, fake review counts, or urgency language.
- Provider summaries should be factual and brief.
- Use “Not added yet” or equivalent for missing optional provider details rather than fabricated content.
- Explain state changes in operational language:
  - “Publish service” means customers can find it.
  - “Archive service” means it is removed from public discovery.
  - “Save draft” means it is private until published.

## Accessibility and trust

- Use semantic headings and landmarks for catalogue, detail, and provider management pages.
- Every form control has a visible label and stable error association.
- Search and filter changes announce result updates without stealing focus unnecessarily.
- Status changes use an accessible live region or confirmation message.
- Provider-only pages redirect unauthenticated users through the existing auth flow and return them safely after login.
- API authorization remains authoritative; hidden controls are not a security boundary.
- Cached public content is clearly stale; private drafts and mutation responses are never exposed through the public cache.

## Cross-module contracts

- **Identity & Profiles:** reuse the existing session and role helpers. Only `PROVIDER` can create or manage services.
- **Service Booking:** only `PUBLISHED` services may receive bookings. Archived records remain referenceable.
- **Reviews & Reports:** report targets use `targetType: "SERVICE"` and the stable service ID. Review data belongs to completed bookings, not service listings.
- **Shared PWA:** use the one shared `/sw.js`; do not register a feature-specific worker.
- **Shared database:** use the existing MongoDB client/database helpers and ObjectId serialization conventions.

## Anti-goals

- No gradient hero or promotional split-screen.
- No orange-dominant service marketplace.
- No image-first listing grid when images are not required.
- No excessive dashboard cards or metric tiles.
- No public draft/archived leakage.
- No client-only ownership or role checks.
- No fake booking success, offline mutation success, ratings, reviews, or provider claims.
