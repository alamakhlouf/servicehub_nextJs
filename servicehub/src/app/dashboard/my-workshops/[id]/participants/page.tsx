import { ObjectId } from "mongodb";
import { notFound } from "next/navigation";
import { requireRole } from "@/lib/auth/guards";
import { workshopsCollection } from "@/lib/workshops/workshops";
import { ParticipantManager } from "@/components/workshops/workshop-experience";

export default async function ParticipantsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params; const user = await requireRole("PROVIDER", "ADMIN");
  if (!ObjectId.isValid(id)) notFound();
  const record = await (await workshopsCollection()).findOne({ _id: new ObjectId(id), ...(user.role === "ADMIN" ? {} : { organizerId: new ObjectId(user.id) }) });
  if (!record) notFound();
  return <main className="min-h-screen bg-background px-4 py-10 sm:px-6 lg:px-8 lg:py-16"><div className="mx-auto w-full max-w-4xl"><p className="text-sm text-text-muted">{record.title}</p><div className="mt-3"><ParticipantManager completed={record.status === "COMPLETED"} workshopId={id} /></div></div></main>;
}
