import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { isMailConfigured, sendInvitationEmail } from "@/lib/mailer";

const SMTP_KEYS = [
  "SMTP_HOST",
  "SMTP_PORT",
  "SMTP_SECURE",
  "SMTP_USER",
  "SMTP_PASS",
  "MAIL_FROM",
] as const;

describe("mailer — sans configuration SMTP", () => {
  let saved: Record<string, string | undefined>;

  beforeEach(() => {
    saved = {};
    for (const k of SMTP_KEYS) {
      saved[k] = process.env[k];
      delete process.env[k];
    }
  });

  afterEach(() => {
    for (const k of SMTP_KEYS) {
      if (saved[k] === undefined) delete process.env[k];
      else process.env[k] = saved[k];
    }
  });

  it("isMailConfigured est false", () => {
    expect(isMailConfigured()).toBe(false);
  });

  it("sendInvitationEmail est ignoré proprement (skipped), sans planter", async () => {
    const result = await sendInvitationEmail({
      to: "yassir@example.com",
      name: "Yassir",
      activateUrl: "https://app.example.com/activate/abc",
    });
    expect(result).toEqual({ sent: false, skipped: true });
  });

  it("devient configuré quand les variables SMTP sont présentes", () => {
    process.env.SMTP_HOST = "smtp.example.com";
    process.env.SMTP_USER = "u";
    process.env.SMTP_PASS = "p";
    expect(isMailConfigured()).toBe(true);
  });
});
