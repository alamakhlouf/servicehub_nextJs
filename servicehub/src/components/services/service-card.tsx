import Link from "next/link";
import { Badge, Card } from "@/components/ui";
import type { SafeService } from "@/types/service";

export function ServiceCard({ service, manage = false }: { service: SafeService; manage?: boolean }) {
  return (
    <Card className="flex h-full flex-col p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-blue-300">{service.category}</p>
          <h2 className="mt-2 font-display text-lg font-bold">{service.title}</h2>
        </div>
        <Badge tone={service.status === "PUBLISHED" ? "success" : service.status === "ARCHIVED" ? "neutral" : "warning"}>{service.status}</Badge>
      </div>
      <p className="mt-3 line-clamp-3 text-sm leading-6 text-text-muted">{service.description}</p>
      <div className="mt-5 flex flex-wrap gap-x-4 gap-y-2 text-sm text-text-subtle">
        <span>{formatPrice(service.price, service.priceUnit)}</span>
        <span>{service.city}</span>
        {service.provider ? <span>By {service.provider.name}</span> : null}
      </div>
      <Link className="mt-5 inline-flex min-h-10 items-center text-sm font-semibold text-blue-300 hover:text-white" href={manage ? `/dashboard/my-services/${service.id}/edit` : `/services/${service.id}`}>
        {manage ? "Manage service" : "View service"} <span aria-hidden="true" className="ml-1">→</span>
      </Link>
    </Card>
  );
}

export function formatPrice(price: number, unit: SafeService["priceUnit"]) {
  const suffix = unit === "PER_HOUR" ? " / hour" : unit === "FROM" ? " / starting price" : "";
  return `${new Intl.NumberFormat("en", { style: "currency", currency: "USD", maximumFractionDigits: 2 }).format(price)}${suffix}`;
}
