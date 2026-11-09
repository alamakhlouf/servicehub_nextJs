export const workshopStatuses = ["DRAFT", "PUBLISHED", "CANCELLED", "COMPLETED"] as const;
export const participationStatuses = ["PENDING", "APPROVED", "REJECTED", "CANCELLED"] as const;
export const attendanceStatuses = ["NOT_MARKED", "ATTENDED", "ABSENT"] as const;
export type WorkshopStatus = (typeof workshopStatuses)[number];
export type ParticipationStatus = (typeof participationStatuses)[number];
export type AttendanceStatus = (typeof attendanceStatuses)[number];

export type SafeWorkshop = {
  id: string; organizerId: string; organizerName?: string; title: string; description: string;
  category: string; location: string; startAt: string; durationMinutes: number; capacity: number;
  approvedParticipantCount: number; imageUrl?: string; status: WorkshopStatus; createdAt: string; updatedAt: string;
};

export type SafeWorkshopParticipant = {
  id: string; workshopId: string; providerId: string; providerName?: string; note?: string;
  clientRequestId?: string; status: ParticipationStatus; attendance: AttendanceStatus; createdAt: string; updatedAt: string;
};
