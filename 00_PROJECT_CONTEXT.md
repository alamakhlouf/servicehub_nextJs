# ServiceHub — Full Project Context

## 1. Product overview

ServiceHub is a mobile-first marketplace Progressive Web App (PWA) that connects customers with local service providers and suppliers. Customers discover services, book providers, order supplier products, enroll in workshops, and review completed services. Providers publish services and create and run workshops. Suppliers manage their listings and receive orders.

The application is built with **Next.js App Router, TypeScript, Tailwind CSS, and MongoDB**. Next.js is used for both the frontend and backend through Route Handlers. The application must work well on phones and desktop browsers, be installable, and provide useful offline behavior.

## 2. Project goals

- Deliver a working end-to-end marketplace, not just disconnected CRUD screens.
- Demonstrate CRUD, role-based business rules, MongoDB persistence, and a responsive UI.
- Demonstrate PWA installation, offline fallback, caching, and at least one meaningful offline capability per feature.
- Keep forms and workflows intentionally simple enough for a six-person student team.
- Use one consistent design system across all modules.

## 3. Roles and permissions

| Role       | Main capabilities                                                                                                                                                                                        |
| ---------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `CUSTOMER` | Browse services/suppliers/workshops, book services, order supplier products, attend workshops (enroll, cancel own enrollment, see status), review completed bookings, submit reports, manage own profile |
| `PROVIDER` | Manage own services, manage booking requests, create and manage own workshops, approve/reject customer enrollments and record attendance.Providers cannot enroll in workshops.                           |
| `SUPPLIER` | Manage own supplier products/listings, view and update orders received                                                                                                                                   |
| `ADMIN`    | Manage users, review reports and moderate (edit/cancel) any workshop. Does not create workshops; seed one demo admin account                                                                             |

A person has one primary role for this project. Do not build complex multi-role switching. A provider may also be a customer in real life, but the demo account should use one role to keep authorization straightforward.

## 4. Six-member work division

| Member | Feature module       | Main ownership                                                                                     |
| ------ | -------------------- | -------------------------------------------------------------------------------------------------- |
| 1      | Identity & Profiles  | Sign up, login, logout, profile view/edit, role-aware navigation                                   |
| 2      | Services             | Provider service CRUD; public service catalogue and details                                        |
| 3      | Suppliers & Ordering | Supplier listing CRUD; customer order placement; supplier order management                         |
| 4      | Reviews & Reports    | Reviews after completed bookings; report submission and admin resolution                           |
| 5      | Service Booking      | Booking creation, provider decisions, status lifecycle, customer/provider booking views            |
| 6      | Workshop Management  | Workshop CRUD by providers, customer enrollment requests, organizer approval and attendance status |

Each member owns their screens, API routes, MongoDB collection logic, validation, tests, and their feature's PWA contribution. Shared infrastructure (authentication, DB helper, design tokens, service-worker registration) should be agreed and merged early. Member 1 coordinates shared authentication and role middleware, but all members must use it rather than implement separate auth.

## 5. Main user journeys

### Service journey

1. Provider signs up and completes a basic profile.
2. Provider creates and publishes a service.
3. Customer browses service cards and opens a service detail.
4. Customer creates a booking with a preferred date/time and short note.
5. Provider accepts, rejects, or proposes a new time (optional stretch goal).
6. Customer and provider see the current booking status.
7. Provider marks the accepted booking completed.
8. Customer leaves a rating and short review.
9. A user may report a service, review, supplier listing, or workshop.

### Supplier order journey

1. Supplier creates a product/listing.
2. Customer opens the listing and places an order with quantity and delivery/contact note.
3. Supplier views incoming orders and updates the status.
4. Customer sees order status and order history.

### Workshop journey

1. Provider creates, then publishes, a workshop.
2. Customer requests to enroll.
3. The provider (organizer) approves or rejects the enrollment.
4. Customer sees enrollment status and workshop details.
5. After the workshop, the provider marks the approved customer attended or absent.

## 6. Core scope boundaries

Included:

- CRUD for services, supplier listings, and workshops.
- Simple sign-up/login/logout and profile editing.
- Service booking lifecycle.
- Supplier ordering lifecycle.
- Workshop participation.
- Reviews and reports.
- PWA manifest, installability, offline fallback, cache strategy, offline drafts/queues.

Not included unless the instructor explicitly asks:

- Online payments, refunds, shopping cart, delivery tracking, real-time chat, video calls, complex calendar availability, map routing, coupons, inventory variants, multi-vendor checkout, advanced analytics, AI recommendations, or a large admin dashboard.

## 7. Shared data model

Use MongoDB collections. Store references as MongoDB `ObjectId` values and serialize them to strings in API responses.

- `users`: name, email (unique, normalized), passwordHash, role, phone (optional), city (optional), bio (optional), createdAt, updatedAt.
- `services`: providerId, title, description, category, price, priceUnit, city, status (`DRAFT`/`PUBLISHED`/`ARCHIVED`), createdAt, updatedAt.
- `supplierListings`: supplierId, name, description, category, unitPrice, unitLabel, stock (non-negative quantity), available (boolean), createdAt, updatedAt.
- `supplierOrders`: listingId, supplierId, customerId, quantity, unitPriceSnapshot, totalSnapshot, contactName, contactPhone, note, status, createdAt, updatedAt.
- `bookings`: serviceId, providerId, customerId, requestedDate, requestedTime, addressOrArea, note, agreedDate, agreedTime, status, createdAt, updatedAt. Requested values are the customer's preferred local date/time; acceptance records the agreed pair, defaulting to the requested pair when no explicit pair is supplied.
- `reviews`: bookingId, serviceId, providerId, customerId, rating (1–5), comment, createdAt, updatedAt.
- `reports`: reporterId, targetType, targetId, reason, note, status, adminNote, createdAt, updatedAt.
- `workshops`: organizerId, title, description, category, location, startAt, durationMinutes, capacity, status, createdAt, updatedAt.
- `workshopParticipants`: workshopId, customerId, note, status, attendance, createdAt, updatedAt.

Use indexes for unique user email and common lookups such as providerId, customerId, status, serviceId, workshopId. Add indexes only where they support a real query.

## 8. Shared status rules

### Services

`DRAFT → PUBLISHED → ARCHIVED`. Only the owning provider may edit/archive their service.

### Supplier orders

`PENDING → ACCEPTED → COMPLETED`; `PENDING → REJECTED`; `PENDING → CANCELLED`; `ACCEPTED → CANCELLED`. Supplier stock is checked and decremented safely when an order is accepted. Supplier can update only orders assigned to that supplier. Status updates must be validated on the server.

### Bookings

`PENDING → ACCEPTED → IN_PROGRESS → COMPLETED`; `PENDING → REJECTED`; `PENDING → CANCELLED`; `ACCEPTED → CANCELLED`. Provider acceptance records agreed date/time values and uses the requested values by default. Do not allow review until `COMPLETED`.

### Reports

`PENDING → UNDER_REVIEW`, `RESOLVED`, or `DISMISSED`. Only admin can change status. Report targets are services, supplier listings, reviews, and workshops.

### Workshops

Workshop status: `DRAFT`, `PUBLISHED`, `CANCELLED`, `COMPLETED`.
Enrollment status: `PENDING`, `APPROVED`, `REJECTED`, `CANCELLED`.
Attendance: `NOT_MARKED`, `ATTENDED`, `ABSENT`.

## 9. Shared design system

Use the palette supplied by the team:

- Primary blue: `#2563EB`
- Secondary green: `#10B981`
- Tertiary amber: `#F59E0B`
- Neutral/dark base: `#0F172A`

Typography:

- Headings: **Plus Jakarta Sans**
- Body and labels: **Inter**

Visual direction:

- Dark-first interface with a deep navy background, slightly lighter navy surfaces, subtle borders, and high-contrast text.
- Blue is the primary action color; green communicates success/secondary actions; amber communicates attention/warnings. Red is reserved for destructive/error states.
- Do not make the interface orange-dominant. Amber is an accent only.
- Use consistent spacing, rounded cards, restrained shadows, and clear focus states.
- The supplied design-system reference includes compact component examples: buttons, search field, navigation, progress indicators, icon actions, and typography samples. Recreate these as reusable Tailwind components rather than copying the screenshot as a page.

Suggested tokens (adjust only with team agreement):

```css
:root {
  --color-primary: #2563eb;
  --color-secondary: #10b981;
  --color-tertiary: #f59e0b;
  --color-neutral: #0f172a;
  --color-background: #0b1220;
  --color-surface: #172033;
  --color-surface-elevated: #1e293b;
  --color-border: #334155;
  --color-text: #f8fafc;
  --color-muted: #94a3b8;
  --color-danger: #ef4444;
}
```

## 10. PWA strategy — important team rule

There must be **one shared service worker** at `/sw.js`, registered once by the root application. Do not create six independently registered service workers. Each member implements their feature's cache/draft/queue/notification behavior as a small, documented contribution coordinated through the shared worker and shared IndexedDB helper.

Each feature file describes its assigned PWA behavior. Offline content must be clearly labelled as cached, draft, or pending sync. Never display a locally queued write as if it has been saved to MongoDB.

## 11. Definition of done

A feature is complete when:

- Its main user stories work on mobile and desktop.
- CRUD/business rules are enforced by the backend, not only hidden in the UI.
- Data persists in MongoDB.
- Loading, empty, validation, success, and error states are present.
- Role and ownership permissions are checked.
- Its PWA behavior works and is labelled honestly.
- It has been tested online, offline, and after refresh.
- It follows the shared palette, typography, and reusable components.
