import { ProviderServices } from "@/components/services/provider-services";
import { requireRole } from "@/lib/auth/guards";
import { servicesCollection, toSafeService } from "@/lib/services/services";
import { ObjectId } from "mongodb";

export default async function MyServicesPage() {
  const user = await requireRole("PROVIDER");
  const services = await (await servicesCollection()).find({ providerId: new ObjectId(user.id) }).sort({ updatedAt: -1 }).toArray();
  return <main className="min-h-screen bg-background px-4 py-10 sm:px-6 lg:px-8 lg:py-16"><ProviderServices initialServices={services.map((service) => toSafeService(service, user))} /></main>;
}
