import { describe, expect, it } from "vitest";
import { reportCreateSchema, reportStatusSchema } from "./validation";

describe("report validation", () => {
  it("accepts supported targets and reasons", () => {
    expect(reportCreateSchema.safeParse({ targetType: "SERVICE", targetId: "507f1f77bcf86cd799439011", reason: "MISLEADING" }).success).toBe(true);
  });

  it("rejects unsupported moderation transitions", () => {
    expect(reportStatusSchema.safeParse({ status: "PENDING" }).success).toBe(false);
    expect(reportStatusSchema.safeParse({ status: "RESOLVED", adminNote: "Reviewed." }).success).toBe(true);
  });

  it("accepts user targets for moderation", () => {
    expect(reportCreateSchema.safeParse({ targetType: "USER", targetId: "507f1f77bcf86cd799439011", reason: "OTHER" }).success).toBe(true);
  });
});
