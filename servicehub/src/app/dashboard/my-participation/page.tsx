import { requireRole } from "@/lib/auth/guards";
import { ParticipationHistory } from "@/components/workshops/workshop-experience";

export default async function MyParticipationPage() {
  await requireRole("PROVIDER");
  return <main className="min-h-screen bg-background px-4 py-10 sm:px-6 lg:px-8 lg:py-16"><div className="mx-auto w-full max-w-6xl"><ParticipationHistory /></div></main>;
}
