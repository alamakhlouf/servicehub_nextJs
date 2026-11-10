export const workshopStatuses = ["DRAFT", "PUBLISHED", "CANCELLED", "COMPLETED"] as const;
export const participationStatuses = ["PENDING", "APPROVED", "REJECTED", "CANCELLED"] as const;
export const attendanceStatuses = ["NOT_MARKED", "ATTENDED", "ABSENT"] as const;
export type WorkshopStatus = (typeof workshopStatuses)[number];
export type ParticipationStatus = (typeof participationStatuses)[number];
export type AttendanceStatus = (typeof attendanceStatuses)[number];
export const skillLevels = ["ALL_LEVELS", "BEGINNER", "INTERMEDIATE", "ADVANCED"] as const;
export const workshopFormats = ["IN_PERSON", "ONLINE"] as const;
export type SkillLevel = (typeof skillLevels)[number];
export type WorkshopFormat = (typeof workshopFormats)[number];

export type SafeWorkshop = {
  id: string; organizerId: string; organizerName?: string; title: string; description: string;
  category: string; location: string; startAt: string; durationMinutes: number; capacity: number;
  approvedParticipantCount: number; imageUrl?: string; skillLevel: SkillLevel; learningPoints: string[];
  requirements: string[]; format: WorkshopFormat; status: WorkshopStatus; createdAt: string; updatedAt: string;
  meetingUrl?: string;
};

export type SafeWorkshopParticipant = {
  id: string; workshopId: string; customerId: string; customerName?: string; note?: string;
  clientRequestId?: string; status: ParticipationStatus; attendance: AttendanceStatus; createdAt: string; updatedAt: string;
};
