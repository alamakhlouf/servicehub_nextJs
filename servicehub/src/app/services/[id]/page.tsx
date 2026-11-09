import { notFound } from "next/navigation";
import { findUserById, toSafeUser } from "@/lib/auth/users";
import { servicesCollection, toSafeService } from "@/lib/services/services";
import { ObjectId } from "mongodb";
import { ServiceDetail } from "@/components/services/service-detail";

export default async function ServiceDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!ObjectId.isValid(id)) notFound();
  const service = await (await servicesCollection()).findOne({ _id: new ObjectId(id), status: "PUBLISHED" });
  if (!service) notFound();
  const provider = await findUserById(service.providerId.toString());
  const safe = toSafeService(service, provider ? toSafeUser(provider) : undefined);
  return <ServiceDetail initialService={safe} />;
}
