# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Stack

Existing Next.js App Router application using TypeScript and Tailwind CSS, with MongoDB as the planned persistence layer and PWA capabilities.

## Users

- **Customers** discover local services and supplier products, request bookings, place supplier orders, attend workshops, review completed services, submit reports, and manage their profiles.
- **Providers** publish and manage services, manage booking requests, and request participation in workshops.
- **Suppliers** manage product listings and process orders received for their listings.
- **Admins** manage users and review, resolve, or dismiss reports.

Customers are the primary end users. Each person has one primary role for the project; complex multi-role switching is out of scope.

## Product Purpose

ServiceHub is a mobile-first marketplace PWA that connects customers with local service providers and suppliers. It supports the complete basic journeys from discovery through booking or ordering, status tracking, workshops, and post-service reviews. Success means delivering a working end-to-end marketplace with role-aware workflows, MongoDB persistence, responsive browser behavior, installability, and useful offline behavior.

## Positioning

ServiceHub combines local services, supplier products, and practical workshops in one lightweight marketplace. Its meaningfully different mechanism is the connected workflow across discovery, service booking, supplier ordering, workshop participation, and review/report follow-up, including clearly labeled offline support.

## Operating Context

ServiceHub is used primarily on phones but must also work well in desktop browsers and be installable as a PWA. Customers browse public marketplace content and initiate bookings or orders. Providers and suppliers manage their own listings and incoming work from role-aware dashboards. Admins handle user and report management. Offline behavior should support public read access, safe drafts, and pending booking synchronization without presenting unconfirmed work as accepted.

## Capabilities and Constraints

- Role-aware sign-up, login, logout, profile viewing, and basic profile editing for `CUSTOMER`, `PROVIDER`, `SUPPLIER`, and `ADMIN`.
- Public CRUD-backed catalogues for provider services, supplier listings, and workshops, with ownership and publication rules enforced on the server.
- Service booking lifecycle: `PENDING → ACCEPTED → IN_PROGRESS → COMPLETED`, with `PENDING → REJECTED`, `PENDING → CANCELLED`, and `ACCEPTED → CANCELLED`. Customer requested date/time values are local preferences; provider acceptance records the agreed pair, defaulting to the requested pair.
- Supplier order lifecycle: `PENDING → ACCEPTED → COMPLETED`, with `PENDING → REJECTED`, `PENDING → CANCELLED`, and `ACCEPTED → CANCELLED`. Supplier listings have official stock/available-quantity validation, and stock is decremented safely on acceptance.
- Workshop participation requests, organizer approval or rejection, and attendance tracking.
- Reviews only after a customer's related booking is completed; one review per booking.
- Reports for services, supplier listings, reviews, and workshops, with statuses `PENDING`, `UNDER_REVIEW`, `RESOLVED`, and `DISMISSED`; only admins can moderate them.
- MongoDB persistence with server-derived identity and role authorization, validated status transitions, safe serialized responses, and indexes supporting real queries.
- Responsive UI and installable PWA behavior, including a manifest, offline fallback, cache strategies, safe offline drafts, and an offline booking request queue.
- Offline states must be explicit: cached content may be outdated, drafts are not submitted, and booking requests remain pending sync until the server confirms them.
- Do not add online payments, refunds, delivery tracking, real-time chat, video calls, map routing, coupons, inventory variants, multi-vendor checkout, advanced analytics, AI recommendations, or a large admin dashboard unless explicitly requested later.
- No payment is collected; supplier order totals are informational snapshots. Supplier stock is a single non-negative quantity; variants and inventory management remain out of scope.
- Forms and workflows should remain simple enough for a six-person student team to implement and maintain.

## Brand Commitments

- The product name is **ServiceHub**.
- The supplied project specification commits to a dark-first navy interface with blue as the primary action color, green for success or secondary actions, amber for attention, and red reserved for destructive or error states.
- The supplied typography commitment is Plus Jakarta Sans for headings and Inter for body text and labels.

## Evidence on Hand

- Product requirements and project constraints are documented in `00_PROJECT_CONTEXT.md` and `01_PROJECT_SETUP.md`.
- Feature-level requirements are documented in `features/01_IDENTITY_PROFILES.md` through `features/06_WORKSHOPS.md`.
- The existing application is a Next.js starter shell in `src/app/`; feature implementation and production marketplace data are not yet present.
- No production testimonials, customer research, analytics, payments, or content assets are available. Future work must not fabricate them.

## Product Principles

1. Connect the full local-marketplace journey instead of shipping disconnected CRUD screens.
2. Keep role permissions and status transitions explicit, server-validated, and easy to understand.
3. Treat offline work honestly: preserve useful access and drafts without claiming that unconfirmed actions succeeded.
4. Prefer simple, focused workflows over feature expansion beyond the defined student-project scope.
5. Use one consistent foundation so all feature modules feel like one product.

## Accessibility & Inclusion

No product-specific accessibility standard or user need was specified during init. Standard web accessibility remains an implementation responsibility, including keyboard access, visible focus states, readable contrast, and clear form and status feedback.
