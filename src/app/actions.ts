"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import {
  createAssignment,
  createBooking,
  createChecklistSubmission,
  createIncidentReport,
  createOvertimeRequest,
  createProperty,
  loginWithCredentials,
  registerUser,
  updateBookingStatus,
  updateOvertimeStatus,
} from "@/lib/data";
import { setSession, clearSession, requireRole, requireUser } from "@/lib/session";
import { bookingSchema, checklistSchema, incidentSchema, overtimeSchema, propertySchema, registerSchema, signInSchema } from "@/lib/validators";

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
  const role = String(formData.get("role") ?? "CLIENT") as "ADMIN" | "CLIENT" | "CLEANER";

  const parsed = registerSchema.safeParse({ name, email, password, role });
  if (!parsed.success) {
    redirect(`/register?error=${encodeURIComponent(parsed.error.issues[0]?.message ?? "Please check your registration details.")}`);
  }

  const user = await registerUser(parsed.data);
  await setSession(user.id);
  redirect("/dashboard");
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
  const status = String(formData.get("status") ?? "APPROVED") as "APPROVED" | "REJECTED";

  if (!bookingId) redirect("/admin");

  await updateBookingStatus(bookingId, status);
  revalidatePath("/admin");
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
    redirect(`/dashboard?error=${encodeURIComponent(parsed.error.issues[0]?.message ?? "Please fix overtime details.")}`);
  }

  await createOvertimeRequest({
    cleanerId: user.id,
    bookingId: parsed.data.bookingId || undefined,
    date: parsed.data.date,
    additionalMinutes: parsed.data.additionalMinutes,
    reason: parsed.data.reason,
    description: parsed.data.description,
  });

  revalidatePath("/dashboard");
  redirect("/dashboard");
}

export async function submitChecklistAction(formData: FormData) {
  const user = await requireRole("CLEANER");
  const parsed = checklistSchema.safeParse({
    bookingId: formData.get("bookingId") ?? undefined,
    jobCompleted: formData.get("jobCompleted") ?? "false",
    notes: formData.get("notes") ?? "",
    photosUploaded: formData.get("photosUploaded") ?? 0,
  });

  if (!parsed.success) {
    redirect(`/cleaner?error=${encodeURIComponent(parsed.error.issues[0]?.message ?? "Please review the checklist.")}`);
  }

  await createChecklistSubmission({
    cleanerId: user.id,
    bookingId: parsed.data.bookingId || undefined,
    jobCompleted: parsed.data.jobCompleted,
    notes: parsed.data.notes ?? "",
    photosUploaded: parsed.data.photosUploaded,
  });

  revalidatePath("/cleaner");
  redirect("/cleaner");
}

export async function reportIncidentAction(formData: FormData) {
  const user = await requireRole("CLEANER");
  const parsed = incidentSchema.safeParse({
    bookingId: formData.get("bookingId") ?? undefined,
    severity: formData.get("severity"),
    title: formData.get("title"),
    description: formData.get("description"),
  });

  if (!parsed.success) {
    redirect(`/cleaner?error=${encodeURIComponent(parsed.error.issues[0]?.message ?? "Please report the issue accurately.")}`);
  }

  await createIncidentReport({
    cleanerId: user.id,
    bookingId: parsed.data.bookingId || undefined,
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
  const explanation = String(formData.get("explanation") ?? "Reviewed by admin");

  if (!overtimeId) redirect("/admin");

  await updateOvertimeStatus(
    overtimeId,
    decision === "APPROVED" ? "APPROVED" : "REJECTED",
    explanation,
  );

  revalidatePath("/admin");
  redirect("/admin");
}
