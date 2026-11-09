import { ObjectId } from "mongodb";
import { getDatabase } from "@/lib/db/database";
import type { SafeBooking, BookingStatus } from "@/types/booking";

export type BookingDocument = {
  _id: ObjectId; serviceId: ObjectId; providerId: ObjectId; customerId: ObjectId;
  serviceTitle: string; requestedDate: string; requestedTime: string; agreedDate?: string; agreedTime?: string; addressOrArea: string;
  note?: string; cancellationReason?: string; clientRequestId: string; status: BookingStatus;
  createdAt: Date; updatedAt: Date;
};

export async function bookingsCollection() {
  const collection = (await getDatabase()).collection<BookingDocument>("bookings");
  await Promise.all([
    collection.createIndex({ customerId: 1, createdAt: -1 }),
    collection.createIndex({ providerId: 1, status: 1, requestedDate: 1, requestedTime: 1 }),
    collection.createIndex({ customerId: 1, clientRequestId: 1 }, { unique: true }),
  ]);
  return collection;
}

export function toSafeBooking(booking: BookingDocument, providerName?: string): SafeBooking {
  return { id: booking._id.toString(), serviceId: booking.serviceId.toString(), serviceTitle: booking.serviceTitle, providerId: booking.providerId.toString(), ...(providerName ? { providerName } : {}), customerId: booking.customerId.toString(), requestedDate: booking.requestedDate, requestedTime: booking.requestedTime, ...(booking.agreedDate ? { agreedDate: booking.agreedDate } : {}), ...(booking.agreedTime ? { agreedTime: booking.agreedTime } : {}), addressOrArea: booking.addressOrArea, ...(booking.note ? { note: booking.note } : {}), ...(booking.cancellationReason ? { cancellationReason: booking.cancellationReason } : {}), status: booking.status, createdAt: booking.createdAt.toISOString(), updatedAt: booking.updatedAt.toISOString() };
}
