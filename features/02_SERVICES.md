# Feature 2 — Services (Member 2)

## Objective
Providers can create, read, update, publish, archive, and delete their own service listings. Customers can browse published services and view details before booking.

## User stories
- As a provider, I can create a service using a short form.
- As a provider, I can view all my services and their status.
- As a provider, I can edit or archive a service I own.
- As a customer/visitor, I can browse published services and open a detail page.
- As a customer, I can report a service that appears inappropriate or misleading.

## Screens
- `/services`: public catalogue with simple category filter and text search (optional if time).
- `/services/[id]`: service detail and provider summary.
- `/dashboard/my-services`: provider's listings.
- `/dashboard/my-services/new`: create form.
- `/dashboard/my-services/[id]/edit`: edit form.

## Keep the form simple
Required: title, category, short description, price, price unit (fixed/hour/from), city/area. No image upload required; use a category icon or placeholder. Optional image URL can be a stretch goal.

## MongoDB document
`services`:
```ts
{
  _id: ObjectId,
  providerId: ObjectId,
  title: string,
  description: string,
  category: string,
  price: number,
  priceUnit: "FIXED" | "PER_HOUR" | "FROM",
  city: string,
  status: "DRAFT" | "PUBLISHED" | "ARCHIVED",
  createdAt: Date,
  updatedAt: Date
}
```

## API
- `GET /api/services?category=&q=` — public published services.
- `POST /api/services` — provider only.
- `GET /api/services/[id]` — public published detail; owner may also view own draft.
- `PATCH /api/services/[id]` — owner only.
- `DELETE /api/services/[id]` — owner only; archive is preferred to preserve booking references.

## Business rules
- Price must be a finite number greater than or equal to zero.
- Title and category are required; description has a reasonable maximum length.
- Only `PROVIDER` can create services.
- Provider identity comes from the session, not the submitted body.
- A provider can only edit/archive their own service.
- A service with existing bookings should be archived, not hard-deleted.
- Only `PUBLISHED` services appear in the public catalogue.
- Do not allow booking a `DRAFT` or `ARCHIVED` service.

## UI states
Show loading skeletons, empty catalogue, no-results message, validation errors, save confirmation, and a clear Published/Draft/Archived badge.

## PWA contribution — cache public catalogue/detail
- Cache only public GET service data, never private drafts or provider management responses.
- Use network-first for catalogue data so prices/status stay fresh; fall back to a previously cached public response when offline.
- Cache a service detail after successful retrieval.
- Label cached content **Offline copy — may be outdated**.
- Do not cache POST/PATCH/DELETE responses as proof of a successful write.
- Coordinate cache naming/versioning with the shared worker owner.

## Acceptance criteria
- Provider can complete service CRUD and publish/archive.
- Customer can browse and view only published services.
- Server validates data and enforces provider ownership.
- Existing booking references are not broken by deletion.
- Previously visited public service data can be read offline with a stale-data label.
