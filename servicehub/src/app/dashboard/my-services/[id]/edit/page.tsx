import { notFound } from "next/navigation";
import { ObjectId } from "mongodb";
import { ServiceForm } from "@/components/services/service-form";
import { requireRole } from "@/lib/auth/guards";
import { servicesCollection, toSafeService } from "@/lib/services/services";

export default async function EditServicePage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireRole("PROVIDER"); const { id } = await params;
  if (!ObjectId.isValid(id)) notFound();
  const service = await (await servicesCollection()).findOne({ _id: new ObjectId(id), providerId: new ObjectId(user.id) });
  if (!service) notFound();
  return <main className="flex min-h-screen items-start justify-center bg-background px-4 py-10 sm:px-6 lg:px-8 lg:py-16"><ServiceForm service={toSafeService(service, user)} /></main>;
}
