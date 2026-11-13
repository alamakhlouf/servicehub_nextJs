export const reportTargetTypes = ["SERVICE", "SUPPLIER_LISTING", "USER", "REVIEW", "WORKSHOP"] as const;
export const reportReasons = ["SPAM", "ABUSIVE", "MISLEADING", "OTHER"] as const;
export const reportStatuses = ["PENDING", "UNDER_REVIEW", "RESOLVED", "DISMISSED"] as const;
export type ReportTargetType = (typeof reportTargetTypes)[number];
export type ReportReason = (typeof reportReasons)[number];
export type ReportStatus = (typeof reportStatuses)[number];

export type SafeReport = {
  id: string;
  reporterId: string;
  targetType: ReportTargetType;
  targetId: string;
  targetLabel?: string;
  targetDetails?: {
    kind: "SERVICE" | "SUPPLIER_LISTING" | "USER";
    description?: string;
    category?: string;
    price?: number;
    priceUnit?: string;
    city?: string;
    stock?: number;
    unitPrice?: number;
    unitLabel?: string;
    available?: boolean;
    email?: string;
    role?: string;
    blocked?: boolean;
  };
  reason: ReportReason;
  note?: string;
  status: ReportStatus;
  adminNote?: string;
  createdAt: string;
  updatedAt: string;
  submissionState?: "SUBMITTED";
  moderationHistory?: Array<{ moderatorId: string; from: ReportStatus; to: ReportStatus; note?: string; changedAt: string }>;
};
