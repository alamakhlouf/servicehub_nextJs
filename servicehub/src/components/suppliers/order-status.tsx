import { Badge } from "@/components/ui";
import type { SupplierOrderStatus } from "@/types/supplier";
export function OrderStatus({ status }: { status: SupplierOrderStatus }) { const tone = status === "COMPLETED" || status === "ACCEPTED" ? "success" : status === "PENDING" ? "warning" : status === "REJECTED" ? "error" : "neutral"; return <Badge tone={tone}>{status}</Badge>; }
