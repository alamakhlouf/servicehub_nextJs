import { describe, expect, it } from "vitest";
import { isAllowedPushEndpoint } from "./push-endpoint";

describe("browser push endpoint validation", () => {
  it("accepts the Microsoft push endpoints used by Edge", () => {
    expect(isAllowedPushEndpoint("https://wns2-example.notify.windows.com/w/?token=opaque")).toBe(true);
  });

  it("accepts supported browser push services", () => {
    expect(isAllowedPushEndpoint("https://fcm.googleapis.com/fcm/send/opaque")).toBe(true);
    expect(isAllowedPushEndpoint("https://updates.push.services.mozilla.com/wpush/v2/opaque")).toBe(true);
    expect(isAllowedPushEndpoint("https://web.push.apple.com/opaque")).toBe(true);
  });

  it("rejects insecure, malformed, and untrusted endpoints", () => {
    expect(isAllowedPushEndpoint("http://wns2-example.notify.windows.com/w/?token=opaque")).toBe(false);
    expect(isAllowedPushEndpoint("https://notify.windows.com.attacker.example/endpoint")).toBe(false);
    expect(isAllowedPushEndpoint("https://attacker.example/endpoint")).toBe(false);
    expect(isAllowedPushEndpoint("not a URL")).toBe(false);
    expect(isAllowedPushEndpoint(null)).toBe(false);
  });
});
