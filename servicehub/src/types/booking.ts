export const bookingStatuses = ["PENDING", "ACCEPTED", "IN_PROGRESS", "COMPLETED", "REJECTED", "CANCELLED"] as const;
export type BookingStatus = (typeof bookingStatuses)[number];

export type SafeBooking = {
  id: string;
  serviceId: string;
  serviceTitle: string;
  providerId: string;
  providerName?: string;
  customerId: string;
  requestedDate: string;
  requestedTime: string;
  agreedDate?: string;
  agreedTime?: string;
  addressOrArea: string;
  note?: string;
  cancellationReason?: string;
  status: BookingStatus;
  createdAt: string;
  updatedAt: string;
};
