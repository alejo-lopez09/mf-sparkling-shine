import { z } from "zod";

export const signInSchema = z.object({
  email: z.email("Please enter a valid email address."),
  password: z.string().min(8, "Password must be at least 8 characters."),
});

export const registerSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters."),
  email: z.email("Please enter a valid email address."),
  password: z.string().min(8, "Password must be at least 8 characters."),
});

export const staffAccountSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters."),
  email: z.email("Please enter a valid email address."),
  password: z.string().min(8, "Password must be at least 8 characters."),
  role: z.enum(["ADMIN", "CLEANER"]),
});

export const bookingSchema = z.object({
  propertyId: z.string().min(1, "Select a property."),
  serviceType: z.enum(["DOMESTIC", "DEEP", "OFFICE", "MOVE_IN"]),
  preferredDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Select a valid service date.")
    .refine((value) => !Number.isNaN(Date.parse(`${value}T00:00:00.000Z`))
      && new Date(`${value}T00:00:00.000Z`).toISOString().slice(0, 10) === value, "Select a valid service date.")
    .refine((value) => value >= new Date().toISOString().slice(0, 10), "The service date cannot be in the past."),
  preferredWindow: z.string().min(1, "Select a preferred time window."),
  frequency: z.enum(["ONE_OFF", "WEEKLY", "FORTNIGHTLY", "MONTHLY"]).default("ONE_OFF"),
  instructions: z.string().max(500).optional().or(z.literal("")),
  notes: z.string().max(500).optional().or(z.literal("")),
});

export const propertySchema = z.object({
  name: z.string().min(2, "Property name is required."),
  address: z.string().min(6, "Please provide the full property address."),
  postcode: z.string().min(4, "Please provide a valid postcode."),
  specialRequirements: z.string().max(500).optional().or(z.literal("")),
  accessInstructions: z.string().max(500).optional().or(z.literal("")),
});

export const overtimeSchema = z.object({
  bookingId: z.string().min(1, "Select an assigned service."),
  date: z.string().min(1, "Select a date."),
  additionalMinutes: z.coerce.number().min(15, "Minimum overtime is 15 minutes."),
  reason: z.string().min(3, "Please provide a reason."),
  description: z.string().min(5, "Please describe the additional work."),
});

export const checklistSchema = z.object({
  bookingId: z.string().min(1, "Select an assigned job."),
  jobCompleted: z.enum(["true", "false"]).transform((value) => value === "true"),
  notes: z.string().max(800).optional().or(z.literal("")),
});

export const serviceMessageSchema = z.object({
  bookingId: z.string().min(1),
  body: z.string().trim().min(1, "Write a message.").max(2000, "Messages must be 2,000 characters or fewer."),
});

export const serviceReviewSchema = z.object({
  bookingId: z.string().min(1),
  quality: z.coerce.number().int().min(1).max(5),
  punctuality: z.coerce.number().int().min(1).max(5),
  communication: z.coerce.number().int().min(1).max(5),
  comment: z.string().trim().max(1000).optional().or(z.literal("")),
});

export const assignmentActionSchema = z.object({
  bookingId: z.string().min(1),
  action: z.enum(["CHECK_IN", "CHECK_OUT"]),
});

export const incidentSchema = z.object({
  bookingId: z.string().min(1, "Select an assigned service."),
  severity: z.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"]),
  title: z.string().min(3, "Please give the issue a clear title."),
  description: z.string().min(10, "Please describe the incident in more detail."),
});
