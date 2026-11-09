import { requireRole } from "@/lib/auth/guards";
import { listingsCollection, toSafeListing } from "@/lib/suppliers/listings";
import { ordersCollection, toSafeOrder } from "@/lib/suppliers/orders";
import { ObjectId } from "mongodb";
import { OrdersList } from "@/components/suppliers/orders-list";
export default async function MyOrdersPage() { const user = await requireRole("CUSTOMER", "PROVIDER"); const orders = await (await ordersCollection()).find({ customerId: new ObjectId(user.id) }).sort({ createdAt: -1 }).toArray(); const safe = await Promise.all(orders.map(async (order) => { const listing = await (await listingsCollection()).findOne({ _id: order.listingId }); return toSafeOrder(order, listing ? toSafeListing(listing) : undefined); })); return <main className="min-h-screen bg-background px-4 py-10 sm:px-6 lg:px-8 lg:py-16"><OrdersList initialOrders={safe} /></main>; }
