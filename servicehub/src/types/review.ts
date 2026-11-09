export type SafeReview = {
  id: string;
  bookingId: string;
  serviceId: string;
  providerId: string;
  customerId: string;
  customerName?: string;
  serviceTitle?: string;
  rating: number;
  comment: string;
  createdAt: string;
  updatedAt: string;
  submissionState?: "SUBMITTED";
};
