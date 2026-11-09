import { ObjectId } from "mongodb";
import { requireRole } from "@/lib/auth/guards";
import { toSafeWorkshop, workshopsCollection } from "@/lib/workshops/workshops";
import { WorkshopManager } from "@/components/workshops/workshop-experience";

export default async function MyWorkshopsPage() {
  const user = await requireRole("PROVIDER", "ADMIN");
  const records = await (await workshopsCollection()).find({ ...(user.role === "ADMIN" ? {} : { organizerId: new ObjectId(user.id) }) }).sort({ startAt: 1 }).toArray();
  return <main className="min-h-screen bg-background px-4 py-10 sm:px-6 lg:px-8 lg:py-16"><div className="mx-auto w-full max-w-6xl"><WorkshopManager initial={records.map((record) => toSafeWorkshop(record, user.name))} /></div></main>;
}
