export const supplierOrderStatuses = ["PENDING", "ACCEPTED", "REJECTED", "CANCELLED", "COMPLETED"] as const;
export type SupplierOrderStatus = (typeof supplierOrderStatuses)[number];

export type SafeSupplierListing = {
  id: string;
  supplierId: string;
  name: string;
  description: string;
  category: string;
  unitPrice: number;
  unitLabel: string;
  stock: number;
  available: boolean;
  createdAt: string;
  updatedAt: string;
  supplier?: { id: string; name: string; city?: string; bio?: string };
};

export type SafeSupplierOrder = {
  id: string;
  listingId: string;
  supplierId: string;
  customerId: string;
  quantity: number;
  unitPriceSnapshot: number;
  totalSnapshot: number;
  contactName: string;
  contactPhone: string;
  note?: string;
  status: SupplierOrderStatus;
  createdAt: string;
  updatedAt: string;
  listing?: Pick<SafeSupplierListing, "id" | "name" | "unitLabel">;
};
