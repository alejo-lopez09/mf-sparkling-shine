"use server";

import { promises as fs } from "node:fs";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import {
  createAssignment,
  createBooking,
  createChecklistSubmission,
  createIncidentReport,
  createOvertimeRequest,
  createProperty,
  createStaffAccount,
  createServiceMessage,
  createServiceReview,
  getAssignmentsForCleaner,
  getPropertiesForUser,
  findUserByEmail,
  loginWithCredentials,
  registerUser,
  reviewChecklistSubmission,
  updateAssignmentAttendance,
  updateBookingStatus,
  updateOvertimeStatus,
} from "@/lib/data";
import { setSession, clearSession, requireRole, requireUser } from "@/lib/session";
import { assignmentActionSchema, bookingSchema, checklistSchema, incidentSchema, overtimeSchema, propertySchema, registerSchema, serviceMessageSchema, serviceReviewSchema, signInSchema, staffAccountSchema } from "@/lib/validators";

export async function signInAction(formData: FormData) {
  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");

  const parsed = signInSchema.safeParse({ email, password });
  if (!parsed.success) {
    redirect(`/login?error=${encodeURIComponent(parsed.error.issues[0]?.message ?? "Invalid login details")}`);
  }

  const user = await loginWithCredentials(email, password);
  if (!user) {
    redirect(`/login?error=${encodeURIComponent("Invalid email or password.")}`);
  }

  await setSession(user.id);
  redirect("/dashboard");
}

export async function registerAction(formData: FormData) {
  const name = String(formData.get("name") ?? "");
  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");

  const parsed = registerSchema.safeParse({ name, email, password });
  if (!parsed.success) {
    redirect(`/register?error=${encodeURIComponent(parsed.error.issues[0]?.message ?? "Please check your registration details.")}`);
  }

  if (await findUserByEmail(parsed.data.email)) {
    redirect(`/register?error=${encodeURIComponent("An account with that email address already exists.")}`);
  }

  const user = await registerUser(parsed.data);
  await setSession(user.id);
  redirect("/dashboard");
}

export async function createStaffAccountAction(formData: FormData) {
  await requireRole("ADMIN");
  const parsed = staffAccountSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    password: formData.get("password"),
    role: formData.get("role"),
  });
  if (!parsed.success) {
    redirect(`/admin?error=${encodeURIComponent(parsed.error.issues[0]?.message ?? "Please review the staff account details.")}`);
  }
  if (await findUserByEmail(parsed.data.email)) {
    redirect(`/admin?error=${encodeURIComponent("An account with that email address already exists.")}`);
  }
  await createStaffAccount(parsed.data);
  revalidatePath("/admin");
  redirect(`/admin?success=${encodeURIComponent("Staff account created.")}`);
}

export async function logoutAction() {
  await clearSession();
  redirect("/");
}

export async function createBookingAction(formData: FormData) {
  const currentUser = await requireUser();
  if (currentUser.role !== "CLIENT") {
    redirect("/dashboard");
  }

  const parsed = bookingSchema.safeParse({
    propertyId: formData.get("propertyId"),
    serviceType: formData.get("serviceType"),
    preferredDate: formData.get("preferredDate"),
    preferredWindow: formData.get("preferredWindow"),
    frequency: formData.get("frequency") ?? "ONE_OFF",
    instructions: formData.get("instructions") ?? "",
    notes: formData.get("notes") ?? "",
  });

  if (!parsed.success) {
    redirect(`/client/new-booking?error=${encodeURIComponent(parsed.error.issues[0]?.message ?? "Please review the booking form.")}`);
  }

  if (!(await getPropertiesForUser(currentUser.id)).some((property) => property.id === parsed.data.propertyId)) {
    redirect(`/client/new-booking?error=${encodeURIComponent("Select one of your registered properties.")}`);
  }

  await createBooking({
    clientId: currentUser.id,
    propertyId: parsed.data.propertyId,
    serviceType: parsed.data.serviceType,
    preferredDate: parsed.data.preferredDate,
    preferredWindow: parsed.data.preferredWindow,
    frequency: parsed.data.frequency,
    instructions: parsed.data.instructions ?? "",
    notes: parsed.data.notes ?? "",
  });

  revalidatePath("/dashboard");
  revalidatePath("/client");
  redirect("/client");
}

export async function createPropertyAction(formData: FormData) {
  const currentUser = await requireUser();
  if (currentUser.role !== "CLIENT") {
    redirect("/dashboard");
  }

  const parsed = propertySchema.safeParse({
    name: formData.get("name"),
    address: formData.get("address"),
    postcode: formData.get("postcode"),
    specialRequirements: formData.get("specialRequirements") ?? "",
    accessInstructions: formData.get("accessInstructions") ?? "",
  });

  if (!parsed.success) {
    redirect(`/client/new-property?error=${encodeURIComponent(parsed.error.issues[0]?.message ?? "Please review the property details.")}`);
  }

  await createProperty({
    clientId: currentUser.id,
    name: parsed.data.name,
    address: parsed.data.address,
    postcode: parsed.data.postcode,
    specialRequirements: parsed.data.specialRequirements ?? "",
    accessInstructions: parsed.data.accessInstructions ?? "",
  });

  revalidatePath("/client");
  revalidatePath("/dashboard");
  redirect("/client");
}

export async function approveBookingAction(formData: FormData) {
  await requireRole("ADMIN");
  const bookingId = String(formData.get("bookingId") ?? "");
  const requestedStatus = String(formData.get("status") ?? "");
  if (requestedStatus !== "APPROVED" && requestedStatus !== "REJECTED") redirect("/admin");

  if (!bookingId) redirect("/admin");

  await updateBookingStatus(bookingId, requestedStatus);
  revalidatePath("/admin");
  revalidatePath("/client");
  redirect("/admin");
}

export async function assignCleanerAction(formData: FormData) {
  await requireRole("ADMIN");
  const bookingId = String(formData.get("bookingId") ?? "");
  const cleanerId = String(formData.get("cleanerId") ?? "");

  if (!bookingId || !cleanerId) redirect("/admin");

  await createAssignment({ bookingId, cleanerId, notes: "Confirmed by administrator" });
  await updateBookingStatus(bookingId, "ASSIGNED");
  revalidatePath("/admin");
  revalidatePath("/client");
  revalidatePath("/cleaner");
  redirect("/admin");
}

export async function submitOvertimeAction(formData: FormData) {
  const user = await requireRole("CLEANER");
  const parsed = overtimeSchema.safeParse({
    bookingId: formData.get("bookingId") ?? undefined,
    date: formData.get("date"),
    additionalMinutes: formData.get("additionalMinutes"),
    reason: formData.get("reason"),
    description: formData.get("description"),
  });

  if (!parsed.success) {
    redirect(`/cleaner?error=${encodeURIComponent(parsed.error.issues[0]?.message ?? "Please fix overtime details.")}`);
  }

  if (!(await getAssignmentsForCleaner(user.id)).some((assignment) => assignment.bookingId === parsed.data.bookingId)) {
    redirect(`/cleaner?error=${encodeURIComponent("Select one of your assigned services.")}`);
  }

  await createOvertimeRequest({
    cleanerId: user.id,
    bookingId: parsed.data.bookingId,
    date: parsed.data.date,
    additionalMinutes: parsed.data.additionalMinutes,
    reason: parsed.data.reason,
    description: parsed.data.description,
  });

  revalidatePath("/cleaner");
  revalidatePath("/admin");
  redirect("/cleaner");
}

export async function submitChecklistAction(formData: FormData) {
  const user = await requireRole("CLEANER");
  const parsed = checklistSchema.safeParse({
    bookingId: formData.get("bookingId") ?? undefined,
    jobCompleted: formData.get("jobCompleted") ?? "false",
    notes: formData.get("notes") ?? "",
  });

  if (!parsed.success) {
    redirect(`/cleaner?error=${encodeURIComponent(parsed.error.issues[0]?.message ?? "Please review the checklist.")}`);
  }

  const uploadFiles = formData.getAll("evidence").filter((value): value is File => value instanceof File && value.size > 0);
  if (uploadFiles.length > 5) {
    redirect(`/cleaner?error=${encodeURIComponent("Upload no more than five photos per service.")}`);
  }
  if (uploadFiles.some((file) => !["image/jpeg", "image/png", "image/webp"].includes(file.type) || file.size > 5 * 1024 * 1024)) {
    redirect(`/cleaner?error=${encodeURIComponent("Photos must be JPEG, PNG or WebP and no larger than 5 MB each.")}`);
  }
  const assignment = (await getAssignmentsForCleaner(user.id)).find((item) => item.bookingId === parsed.data.bookingId);
  if (!assignment?.checkedOutAt) {
    redirect(`/cleaner?error=${encodeURIComponent("Check out of the selected service before submitting its checklist.")}`);
  }

  const evidenceDirectory = process.env.EVIDENCE_DIR ?? path.join(process.cwd(), "data", "evidence");
  await fs.mkdir(evidenceDirectory, { recursive: true });
  const evidenceFiles: string[] = [];
  for (const file of uploadFiles) {
    const extension = file.type === "image/jpeg" ? ".jpg" : file.type === "image/png" ? ".png" : ".webp";
    const filename = `${randomUUID()}${extension}`;
    await fs.writeFile(path.join(/*turbopackIgnore: true*/ evidenceDirectory, filename), Buffer.from(await file.arrayBuffer()), { flag: "wx" });
    evidenceFiles.push(filename);
  }

  await createChecklistSubmission({
    cleanerId: user.id,
    bookingId: parsed.data.bookingId,
    jobCompleted: parsed.data.jobCompleted,
    notes: parsed.data.notes ?? "",
    evidenceFiles,
  });

  revalidatePath("/cleaner");
  revalidatePath("/admin");
  redirect("/cleaner");
}

export async function reportIncidentAction(formData: FormData) {
  const user = await requireRole("CLEANER");
  const parsed = incidentSchema.safeParse({
    bookingId: formData.get("bookingId"),
    severity: formData.get("severity"),
    title: formData.get("title"),
    description: formData.get("description"),
  });

  if (!parsed.success) {
    redirect(`/cleaner?error=${encodeURIComponent(parsed.error.issues[0]?.message ?? "Please report the issue accurately.")}`);
  }
  if (!(await getAssignmentsForCleaner(user.id)).some((assignment) => assignment.bookingId === parsed.data.bookingId)) {
    redirect(`/cleaner?error=${encodeURIComponent("Select one of your assigned services.")}`);
  }

  await createIncidentReport({
    cleanerId: user.id,
    bookingId: parsed.data.bookingId,
    severity: parsed.data.severity,
    title: parsed.data.title,
    description: parsed.data.description,
  });

  revalidatePath("/cleaner");
  redirect("/cleaner");
}

export async function approveOvertimeAction(formData: FormData) {
  await requireRole("ADMIN");
  const overtimeId = String(formData.get("overtimeId") ?? "");
  const decision = String(formData.get("decision") ?? "APPROVED");
  if (decision !== "APPROVED" && decision !== "REJECTED") redirect("/admin");

  if (!overtimeId) redirect("/admin");

  await updateOvertimeStatus(
    overtimeId,
    decision,
    decision === "APPROVED" ? "Approved by administrator" : "Rejected by administrator",
  );

  revalidatePath("/admin");
  revalidatePath("/cleaner");
  revalidatePath("/client");
  redirect("/admin");
}

export async function updateAssignmentAttendanceAction(formData: FormData) {
  const user = await requireRole("CLEANER");
  const parsed = assignmentActionSchema.safeParse({
    bookingId: formData.get("bookingId"),
    action: formData.get("action"),
  });
  if (!parsed.success) redirect(`/cleaner?error=${encodeURIComponent("Choose a valid assigned service action.")}`);
  await updateAssignmentAttendance(parsed.data.bookingId, user.id, parsed.data.action);
  revalidatePath("/cleaner");
  revalidatePath("/client");
  revalidatePath("/admin");
  redirect("/cleaner");
}

export async function reviewChecklistAction(formData: FormData) {
  await requireRole("ADMIN");
  const checklistId = String(formData.get("checklistId") ?? "");
  const decision = String(formData.get("decision") ?? "");
  if (!checklistId || (decision !== "APPROVED" && decision !== "REJECTED")) redirect("/admin");
  await reviewChecklistSubmission(checklistId, decision);
  revalidatePath("/admin");
  revalidatePath("/client");
  revalidatePath("/dashboard");
  redirect("/admin");
}

export async function sendServiceMessageAction(formData: FormData) {
  const user = await requireUser();
  const parsed = serviceMessageSchema.safeParse({
    bookingId: formData.get("bookingId"),
    body: formData.get("body"),
  });
  if (!parsed.success) redirect(`/dashboard?error=${encodeURIComponent(parsed.error.issues[0]?.message ?? "Please review the message.")}`);
  await createServiceMessage({ ...parsed.data, senderId: user.id });
  revalidatePath("/client");
  revalidatePath("/cleaner");
  revalidatePath("/admin");
  redirect(user.role === "ADMIN" ? "/admin" : user.role === "CLIENT" ? "/client" : "/cleaner");
}

export async function submitServiceReviewAction(formData: FormData) {
  const user = await requireRole("CLIENT");
  const parsed = serviceReviewSchema.safeParse({
    bookingId: formData.get("bookingId"),
    quality: formData.get("quality"),
    punctuality: formData.get("punctuality"),
    communication: formData.get("communication"),
    comment: formData.get("comment") ?? "",
  });
  if (!parsed.success) redirect(`/client?error=${encodeURIComponent(parsed.error.issues[0]?.message ?? "Please review your rating.")}`);
  await createServiceReview({ ...parsed.data, clientId: user.id, comment: parsed.data.comment ?? "" });
  revalidatePath("/client");
  revalidatePath("/admin");
  redirect("/client");
}
