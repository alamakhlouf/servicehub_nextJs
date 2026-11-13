export const serviceStatuses = ["DRAFT", "PUBLISHED", "ARCHIVED"] as const;
export const servicePriceUnits = ["FIXED", "PER_HOUR", "FROM"] as const;

export type ServiceStatus = (typeof serviceStatuses)[number];
export type ServicePriceUnit = (typeof servicePriceUnits)[number];

export type SafeService = {
  id: string;
  providerId: string;
  title: string;
  description: string;
  category: string;
  price: number;
  priceUnit: ServicePriceUnit;
  city: string;
  imageUrl?: string;
  status: ServiceStatus;
  createdAt: string;
  updatedAt: string;
  provider?: { id: string; name: string; city?: string; bio?: string };
};
