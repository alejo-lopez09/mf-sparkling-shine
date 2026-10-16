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
  getDashboardSummary,
  loginWithCredentials,
  markNotificationRead,
  registerUser,
  reviewChecklistSubmission,
  setStaffAccountActive,
  updateAssignmentAttendance,
  updateBookingStatus,
  updateOvertimeStatus,
  updateStaffProfile,
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

  it("allows administrators to deactivate and reactivate staff without locking out the last administrator", async () => {
    const cleaner = await createStaffAccount({
      name: "Temporary Cleaner",
      email: `temporary-cleaner-${Date.now()}@demo.co.uk`,
      password: "StrongPass123!",
      role: "CLEANER",
    });

    const deactivated = await setStaffAccountActive(cleaner.id, false, "u-admin");
    expect(deactivated.member?.active).toBe(false);
    expect(await loginWithCredentials(cleaner.email, "StrongPass123!")).toBeNull();
    await expect(createAssignment({ bookingId: "b-001", cleanerId: cleaner.id })).rejects.toThrow("Select an active cleaner.");

    const reactivated = await setStaffAccountActive(cleaner.id, true, "u-admin");
    expect(reactivated.member?.active).toBe(true);
    expect(await loginWithCredentials(cleaner.email, "StrongPass123!")).not.toBeNull();

    expect((await setStaffAccountActive("u-admin", false, "u-admin")).error).toContain("own administrator");
    expect((await setStaffAccountActive("u-admin", false, "another-admin")).error).toContain("last active administrator");
  });

  it("allows administrators to update staff names and contact numbers without changing login identities", async () => {
    const cleaner = await createStaffAccount({
      name: "Before Edit",
      email: `profile-edit-${Date.now()}@demo.co.uk`,
      password: "StrongPass123!",
      role: "CLEANER",
    });

    const result = await updateStaffProfile({ userId: cleaner.id, name: "After Edit", phone: "+44 7700 000000" });
    expect(result.member?.name).toBe("After Edit");
    expect(result.member?.phone).toBe("+44 7700 000000");
    expect(await loginWithCredentials(cleaner.email, "StrongPass123!")).not.toBeNull();
    expect((await updateStaffProfile({ userId: "missing-user", name: "Unknown Person" })).error).toContain("not found");
  });

  it("keeps dashboard data within each user's role and notification ownership", async () => {
    const outsideClient = await registerUser({
      name: "Another Client",
      email: `another-client-${Date.now()}@demo.co.uk`,
      password: "StrongPass123!",
    });
    const outsideProperty = await createProperty({
      clientId: outsideClient.id,
      name: "Private Home",
      address: "1 Private Road, London",
      postcode: "N1 1AA",
    });
    const outsideBooking = await createBooking({
      clientId: outsideClient.id,
      propertyId: outsideProperty.id,
      serviceType: "DOMESTIC",
      preferredDate: "2026-11-05",
      preferredWindow: "09:00-11:00",
      frequency: "ONE_OFF",
      instructions: "",
    });

    const clientSummary = await getDashboardSummary(outsideClient);
    const demoUsers = (await ensureSeedData()).users;
    const demoCleaner = demoUsers.find((user) => user.id === "u-cleaner");
    const demoAdmin = demoUsers.find((user) => user.id === "u-admin");
    if (!demoCleaner || !demoAdmin) throw new Error("Seeded dashboard test accounts are missing.");
    const cleanerSummary = await getDashboardSummary(demoCleaner);
    const adminSummary = await getDashboardSummary(demoAdmin);
    expect(clientSummary.bookings.map((booking) => booking.id)).toEqual([outsideBooking.id]);
    expect(clientSummary.properties.map((property) => property.id)).toEqual([outsideProperty.id]);
    expect(clientSummary.assignments).toEqual([]);
    expect(cleanerSummary.bookings.some((booking) => booking.id === outsideBooking.id)).toBe(false);
    expect(cleanerSummary.properties.some((property) => property.id === outsideProperty.id)).toBe(false);
    expect(adminSummary.bookings.some((booking) => booking.id === outsideBooking.id)).toBe(true);

    expect(await markNotificationRead("n-001", outsideClient.id)).toBeNull();
    expect((await markNotificationRead("n-001", "u-admin"))?.read).toBe(true);
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
