import { z } from "zod";

export const signInSchema = z.object({
  email: z.email("Please enter a valid email address."),
  password: z.string().min(8, "Password must be at least 8 characters."),
});

export const registerSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters."),
  email: z.email("Please enter a valid email address."),
  password: z.string().min(8, "Password must be at least 8 characters."),
  role: z.enum(["ADMIN", "CLIENT", "CLEANER"]).default("CLIENT"),
});

export const bookingSchema = z.object({
  propertyId: z.string().min(1, "Select a property."),
  serviceType: z.enum(["DOMESTIC", "DEEP", "OFFICE", "MOVE_IN"]),
  preferredDate: z.string().min(1, "Select a preferred date."),
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
  bookingId: z.string().optional(),
  date: z.string().min(1, "Select a date."),
  additionalMinutes: z.coerce.number().min(15, "Minimum overtime is 15 minutes."),
  reason: z.string().min(3, "Please provide a reason."),
  description: z.string().min(5, "Please describe the additional work."),
});

export const checklistSchema = z.object({
  bookingId: z.string().optional(),
  jobCompleted: z.enum(["true", "false"]).transform((value) => value === "true"),
  notes: z.string().max(800).optional().or(z.literal("")),
  photosUploaded: z.coerce.number().min(0).max(20).default(0),
});

export const incidentSchema = z.object({
  bookingId: z.string().optional(),
  severity: z.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"]),
  title: z.string().min(3, "Please give the issue a clear title."),
  description: z.string().min(10, "Please describe the incident in more detail."),
});
