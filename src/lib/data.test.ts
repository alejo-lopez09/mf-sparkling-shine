import { describe, expect, it } from "vitest";

import {
  createAssignment,
  createBooking,
  createChecklistSubmission,
  createProperty,
  createStaffAccount,
  createServiceMessage,
  createServiceReview,
  createOvertimeRequest,
  ensureSeedData,
  loginWithCredentials,
  registerUser,
  reviewChecklistSubmission,
  updateAssignmentAttendance,
  updateBookingStatus,
  updateOvertimeStatus,
} from "./data";
import { registerSchema } from "./validators";

describe("MF Sparkling & Shine data layer", () => {
  it("does not allow public registration to choose a privileged role", () => {
    const parsed = registerSchema.parse({
      name: "Lydia Hall",
      email: "lydia@example.co.uk",
      password: "StrongPass123!",
      role: "ADMIN",
    });

    expect(parsed).not.toHaveProperty("role");
  });

  it("loads the seeded demo accounts", async () => {
    const store = await ensureSeedData();
    expect(store.users.some((user) => user.email === "admin@mfcleaning.co.uk")).toBe(true);
    expect(store.users.some((user) => user.email === "client@mfcleaning.co.uk")).toBe(true);
    expect(store.users.some((user) => user.email === "cleaner@mfcleaning.co.uk")).toBe(true);
  });

  it("supports creating staff accounts without opening staff roles to public registration", async () => {
    const cleaner = await createStaffAccount({
      name: "New Cleaner",
      email: `cleaner-${Date.now()}@demo.co.uk`,
      password: "StrongPass123!",
      role: "CLEANER",
    });

    expect(cleaner.role).toBe("CLEANER");
  });

  it("accepts the demo admin credentials and keeps the booking flow valid", async () => {
    const user = await loginWithCredentials("admin@mfcleaning.co.uk", "Welcome123!");
    expect(user?.role).toBe("ADMIN");

    const uniqueEmail = `lydia-${Date.now()}@demo.co.uk`;
    const newClient = await registerUser({
      name: "Lydia Hall",
      email: uniqueEmail,
      password: "StrongPass123!",
    });

    expect(newClient.role).toBe("CLIENT");

    const property = await createProperty({
      clientId: newClient.id,
      name: "Lydia's Home",
      address: "12 Test Street, London",
      postcode: "SW1A 1AA",
    });

    const booking = await createBooking({
      clientId: newClient.id,
      propertyId: property.id,
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

  it("supports the full service, overtime, message, evidence-review and rating flow", async () => {
    const booking = await createBooking({
      clientId: "u-client",
      propertyId: "p-001",
      serviceType: "OFFICE",
      preferredDate: "2026-11-05",
      preferredWindow: "18:00-20:00",
      frequency: "MONTHLY",
      instructions: "After closing.",
    });
    await updateBookingStatus(booking.id, "APPROVED");
    await createAssignment({ bookingId: booking.id, cleanerId: "u-cleaner" });
    await updateBookingStatus(booking.id, "ASSIGNED");
    await expect(updateAssignmentAttendance(booking.id, "u-cleaner", "CHECK_OUT")).rejects.toThrow("Check in before checking out.");
    const checkedIn = await updateAssignmentAttendance(booking.id, "u-cleaner", "CHECK_IN");
    expect(checkedIn.checkedInAt).toBeDefined();
    await updateAssignmentAttendance(booking.id, "u-cleaner", "CHECK_OUT");

    const overtime = await createOvertimeRequest({
      cleanerId: "u-cleaner",
      bookingId: booking.id,
      date: "2026-11-05",
      additionalMinutes: 30,
      reason: "Additional reception work",
      description: "Polished the lobby after the client asked for extra attention.",
    });
    const approvedOvertime = await updateOvertimeStatus(overtime.id, "APPROVED");
    expect(approvedOvertime.approvedAt).toBeDefined();

    const checklist = await createChecklistSubmission({
      cleanerId: "u-cleaner",
      bookingId: booking.id,
      jobCompleted: true,
      notes: "Service completed and checked.",
      evidenceFiles: ["sample-evidence.jpg"],
    });
    expect(checklist.photosUploaded).toBe(1);
    await createServiceMessage({ bookingId: booking.id, senderId: "u-client", body: "Thank you for the update." });
    const reviewedChecklist = await reviewChecklistSubmission(checklist.id, "APPROVED");
    expect(reviewedChecklist.status).toBe("APPROVED");

    const review = await createServiceReview({
      bookingId: booking.id,
      clientId: "u-client",
      quality: 5,
      punctuality: 4,
      communication: 5,
      comment: "Excellent service.",
    });
    expect(review.quality).toBe(5);
  });
});
