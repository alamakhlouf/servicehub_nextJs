import { requireRole } from "@/lib/auth/guards";
import { WorkshopForm } from "@/components/workshops/workshop-experience";

export default async function NewWorkshopPage() {
  await requireRole("PROVIDER");
  return <main className="min-h-screen bg-background px-4 py-10 sm:px-6 lg:px-8 lg:py-16"><div className="mx-auto w-full max-w-6xl"><p className="text-xs font-semibold uppercase tracking-wide text-blue-300">Organizer workspace</p><h1 className="mt-2 font-display text-3xl font-bold">Create workshop</h1><p className="mt-3 text-text-muted">Save a private draft or publish when the details are ready.</p><div className="mt-8"><WorkshopForm /></div></div></main>;
}
