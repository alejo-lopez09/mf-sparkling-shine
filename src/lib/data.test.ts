import { describe, expect, it } from "vitest";

import { createBooking, ensureSeedData, loginWithCredentials, registerUser, updateBookingStatus } from "./data";

describe("MF Sparkling & Shine data layer", () => {
  it("loads the seeded demo accounts", async () => {
    const store = await ensureSeedData();
    expect(store.users.some((user) => user.email === "admin@mfcleaning.co.uk")).toBe(true);
    expect(store.users.some((user) => user.email === "client@mfcleaning.co.uk")).toBe(true);
    expect(store.users.some((user) => user.email === "cleaner@mfcleaning.co.uk")).toBe(true);
  });

  it("accepts the demo admin credentials and keeps the booking flow valid", async () => {
    const user = await loginWithCredentials("admin@mfcleaning.co.uk", "Welcome123!");
    expect(user?.role).toBe("ADMIN");

    const uniqueEmail = `lydia-${Date.now()}@demo.co.uk`;
    const newClient = await registerUser({
      name: "Lydia Hall",
      email: uniqueEmail,
      password: "StrongPass123!",
      role: "CLIENT",
    });

    const booking = await createBooking({
      clientId: newClient.id,
      propertyId: "p-001",
      serviceType: "DOMESTIC",
      preferredDate: "2026-11-05",
      preferredWindow: "09:00-11:00",
      frequency: "ONE_OFF",
      instructions: "Kitchen and lounge only.",
    });

    expect(booking.status).toBe("PENDING");
    const approved = await updateBookingStatus(booking.id, "APPROVED");
    expect(approved.status).toBe("APPROVED");
  });
});
