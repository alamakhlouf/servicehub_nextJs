# Feature 3 — Suppliers & Ordering (Member 3)

## Objective
Suppliers manage simple product/material listings. Customers can place an order from one supplier listing, and suppliers can process incoming orders. This is a lightweight ordering workflow, not a full e-commerce platform.

## User stories — supplier listings
- As a supplier, I can create a listing with name, category, description, unit price, and unit label.
- As a supplier, I can view, edit, mark unavailable, and delete/archive my listings.
- As a customer, I can browse available supplier listings and view details.

## User stories — orders
- As a customer, I can order a quantity of one supplier listing.
- As a customer, I can view my orders and current status.
- As a supplier, I can view orders for my listings and accept/reject them.
- As a supplier, I can complete an accepted order or cancel it when allowed.

## Screens
- `/suppliers`: public listing catalogue.
- `/suppliers/[id]`: listing detail and simple order form.
- `/dashboard/my-listings`: supplier CRUD.
- `/dashboard/supplier-orders`: incoming orders for supplier.
- `/dashboard/my-orders`: customer order history.

## Simple forms
Listing: name, category, description, unit price, unit label (piece/kg/pack/etc.), stock quantity, available toggle.
Order: quantity, contact name, contact phone, optional note. Do not build cart, multi-supplier checkout, payment, delivery tracking, or product variants. Stock is a single non-negative quantity used for order validation and safe updates.

## MongoDB documents
` supplierListings` collection (collection name without leading space):
```ts
{
  _id: ObjectId,
  supplierId: ObjectId,
  name: string,
  description: string,
  category: string,
  unitPrice: number,
  unitLabel: string,
  stock: number,
  available: boolean,
  createdAt: Date,
  updatedAt: Date
}
```

`supplierOrders`:
```ts
{
  _id: ObjectId,
  listingId: ObjectId,
  supplierId: ObjectId,
  customerId: ObjectId,
  quantity: number,
  unitPriceSnapshot: number,
  totalSnapshot: number,
  contactName: string,
  contactPhone: string,
  note?: string,
  status: "PENDING" | "ACCEPTED" | "REJECTED" | "COMPLETED" | "CANCELLED",
  createdAt: Date,
  updatedAt: Date
}
```

## API
Listings:
- `GET /api/suppliers` — public available listings.
- `POST /api/suppliers` — supplier only.
- `GET /api/suppliers/[id]`
- `PATCH /api/suppliers/[id]` — owner only.
- `DELETE /api/suppliers/[id]` — owner only; prefer marking unavailable.

Orders:
- `POST /api/supplier-orders` — customer only.
- `GET /api/supplier-orders` — current customer's orders or current supplier's incoming orders based on role.
- `GET /api/supplier-orders/[id]` — customer who placed it or owning supplier.
- `PATCH /api/supplier-orders/[id]` — supplier updates status; customer cancellation only when allowed.

## Business rules
- Quantity must be a positive integer.
- Unit price must be non-negative.
- The server fetches the listing and calculates total; never trust price/total sent by browser.
- Store `unitPriceSnapshot` and `totalSnapshot` so later listing price changes do not alter an existing order.
- Listing must be available at order time.
- Supplier identity is derived from the listing/session.
- Only the listing's supplier can process its order.
- Customer can cancel only a pending order.
- The server prevents quantities above available stock.
- Stock is decremented safely when an order is accepted and is not restored automatically after cancellation.
- Validate status transitions on the server.
- No real payment is collected; show order total as an informational amount.

## PWA contribution — preserve an order draft
- Save unfinished order form fields locally (IndexedDB preferred).
- Restore after refresh/offline and label **Draft — not ordered**.
- Do not create an offline order and display it as confirmed.
- Simplest required behavior: user can save a draft offline and submit once online.
- Optional: queue the order with a unique `clientRequestId`, retry on reconnect, and make the server idempotent.
- Clear draft only after a successful API response.

## Acceptance criteria
- Supplier can CRUD listings and toggle availability.
- Customer can place an order with quantity/contact information.
- Supplier can view and process only their orders.
- Order lifecycle is `PENDING → ACCEPTED → COMPLETED`, `PENDING → REJECTED`, `PENDING → CANCELLED`, or `ACCEPTED → CANCELLED`.
- Customer sees order status and fixed order total snapshot.
- No payment or delivery system is implied.
- Draft is restored offline and never confused with a submitted order.
