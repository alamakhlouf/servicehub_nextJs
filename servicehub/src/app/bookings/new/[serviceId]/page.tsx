import { notFound } from "next/navigation";
import { redirect } from "next/navigation";
import { ObjectId } from "mongodb";
import { findUserById, getCurrentUser, toSafeUser } from "@/lib/auth/users";
import { servicesCollection, toSafeService } from "@/lib/services/services";
import { BookingForm } from "@/components/bookings/booking-form";
import { Card } from "@/components/ui";

export default async function NewBookingPage({ params }: { params: Promise<{ serviceId: string }> }) {
  const { serviceId } = await params;
  if (!ObjectId.isValid(serviceId)) notFound();
  const user = await getCurrentUser();
  if (!user) redirect(`/login?returnTo=${encodeURIComponent(`/bookings/new/${serviceId}`)}`);
  const service = await (await servicesCollection()).findOne({ _id: new ObjectId(serviceId), status: "PUBLISHED" });
  if (!service) notFound();
  if (user.role !== "CUSTOMER") {
    return <main className="min-h-screen bg-background px-4 py-10 sm:px-6 lg:px-8 lg:py-16"><div className="mx-auto w-full max-w-2xl"><Card className="p-6 sm:p-8"><h1 className="font-display text-2xl font-bold">Customer account required</h1><p className="mt-3 text-sm leading-6 text-text-muted">Only customer accounts can request a service booking. You are currently signed in as a {user.role.toLowerCase()}.</p></Card></div></main>;
  }
  const provider = await findUserById(service.providerId.toString());
  return <main className="min-h-screen bg-background px-4 py-10 sm:px-6 lg:px-8 lg:py-16"><div className="mx-auto w-full max-w-2xl"><BookingForm service={toSafeService(service, provider ? toSafeUser(provider) : undefined)} /></div></main>;
}
