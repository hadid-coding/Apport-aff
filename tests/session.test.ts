import { describe, expect, it } from "vitest";
import { signSession, verifySession, type SessionPayload } from "@/lib/session";

const payload: SessionPayload = {
  userId: "user_123",
  email: "yassir.chouaf@example.com",
  name: "Yassir CHOUAF",
  role: "CONSULTANT",
};

describe("session", () => {
  it("signe puis vérifie une session", async () => {
    const token = await signSession(payload);
    const verified = await verifySession(token);
    expect(verified).toMatchObject(payload);
  });

  it("rejette un jeton falsifié", async () => {
    const token = await signSession(payload);
    const tampered = `${token.slice(0, -4)}XXXX`;
    expect(await verifySession(tampered)).toBeNull();
  });

  it("rejette une chaîne arbitraire", async () => {
    expect(await verifySession("not-a-jwt")).toBeNull();
  });
});
