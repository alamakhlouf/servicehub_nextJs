import { ObjectId } from "mongodb";
import { notFound } from "next/navigation";
import { requireRole } from "@/lib/auth/guards";
import { toSafeWorkshop, workshopsCollection } from "@/lib/workshops/workshops";
import { WorkshopForm } from "@/components/workshops/workshop-experience";

export default async function EditWorkshopPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params; const user = await requireRole("PROVIDER", "ADMIN");
  if (!ObjectId.isValid(id)) notFound();
  const record = await (await workshopsCollection()).findOne({ _id: new ObjectId(id), ...(user.role === "ADMIN" ? {} : { organizerId: new ObjectId(user.id) }) });
  if (!record) notFound();
  return <main className="min-h-screen bg-background px-4 py-10 sm:px-6 lg:px-8 lg:py-16"><div className="mx-auto w-full max-w-6xl"><p className="text-xs font-semibold uppercase tracking-wide text-blue-300">Organizer workspace</p><h1 className="mt-2 font-display text-3xl font-bold">Edit workshop</h1><div className="mt-8"><WorkshopForm initial={toSafeWorkshop(record, user.name, record.approvedParticipantCount, true)} /></div></div></main>;
}
