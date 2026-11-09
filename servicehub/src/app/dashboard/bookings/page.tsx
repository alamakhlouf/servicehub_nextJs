import { ObjectId } from "mongodb";
import { requireRole } from "@/lib/auth/guards";
import { bookingsCollection, toSafeBooking } from "@/lib/bookings/bookings";
import { findUserById } from "@/lib/auth/users";
import { BookingList } from "@/components/bookings/booking-list";

export default async function BookingsPage() {
  const user = await requireRole("CUSTOMER", "PROVIDER");
  const filter = user.role === "CUSTOMER" ? { customerId: new ObjectId(user.id) } : { providerId: new ObjectId(user.id) };
  const records = await (await bookingsCollection()).find(filter).sort({ createdAt: -1 }).toArray();
  const bookings = await Promise.all(records.map(async (booking) => { const provider = await findUserById(booking.providerId.toString()); return toSafeBooking(booking, provider?.name); }));
  return <main className="min-h-screen bg-background px-4 py-10 sm:px-6 lg:px-8 lg:py-16"><BookingList initialBookings={bookings} provider={user.role === "PROVIDER"} /></main>;
}
