import { promises as fs } from "node:fs";
import path from "node:path";
import { randomUUID } from "node:crypto";

import { hashPassword } from "@/lib/auth";
import { ensurePrismaClient, isDatabaseConfigured } from "@/lib/prisma";
import type {
  AppData,
  Assignment,
  BookingRequest,
  ChecklistSubmission,
  IncidentReport,
  Notification,
  OvertimeRequest,
  Property,
  ServiceMessage,
  ServiceReview,
  User,
} from "@/lib/types";

const appDataPath = process.env.APP_DATA_FILE
  ? path.resolve(process.env.APP_DATA_FILE)
  : path.join(process.cwd(), "data", "app-data.json");

const initialUsers: User[] = [
  {
    id: "u-admin",
    name: "Aisha Patel",
    email: "admin@mfcleaning.co.uk",
    passwordHash: "",
    role: "ADMIN",
    phone: "+44 20 7946 0111",
    createdAt: "2026-01-01T09:00:00.000Z",
  },
  {
    id: "u-client",
    name: "Jill Mason",
    email: "client@mfcleaning.co.uk",
    passwordHash: "",
    role: "CLIENT",
    phone: "+44 7740 123456",
    createdAt: "2026-01-10T09:00:00.000Z",
  },
  {
    id: "u-cleaner",
    name: "Sam Carter",
    email: "cleaner@mfcleaning.co.uk",
    passwordHash: "",
    role: "CLEANER",
    phone: "+44 7700 987654",
    createdAt: "2026-01-20T09:00:00.000Z",
  },
];

const initialProperties: Property[] = [
  {
    id: "p-001",
    name: "Harlow Family Home",
    address: "5 Willow Court, Harlow",
    postcode: "CM20 2AB",
    clientId: "u-client",
    specialRequirements: "No bleach on stone surfaces; front door keypad code 1842.",
    accessInstructions: "Use the side entrance after 8:30am. Keep keys in the basket by the utility room.",
    createdAt: "2026-01-09T09:00:00.000Z",
  },
  {
    id: "p-002",
    name: "Oak House Office",
    address: "87 Oak Lane, London",
    postcode: "SW1A 1AA",
    clientId: "u-client",
    specialRequirements: "Vacuum around server room only after 4pm.",
    accessInstructions: "Reception desk will issue a pass. Please avoid the first-floor archive room.",
    createdAt: "2026-02-12T09:00:00.000Z",
  },
];

const initialBookings: BookingRequest[] = [
  {
    id: "b-001",
    clientId: "u-client",
    propertyId: "p-001",
    serviceType: "DOMESTIC",
    preferredDate: "2026-10-20",
    preferredWindow: "09:00-11:00",
    frequency: "WEEKLY",
    instructions: "Please focus on kitchen, bathroom and landing. The client has a pet cat.",
    status: "PENDING",
    createdAt: "2026-10-15T08:00:00.000Z",
    notes: "Domestic deep clean on a weekly cadence.",
  },
  {
    id: "b-002",
    clientId: "u-client",
    propertyId: "p-002",
    serviceType: "OFFICE",
    preferredDate: "2026-10-15",
    preferredWindow: "18:00-20:00",
    frequency: "MONTHLY",
    instructions: "Quiet clean after closing. Please do not disturb the finance team.",
    status: "IN_PROGRESS",
    createdAt: "2026-10-13T10:00:00.000Z",
    notes: "Commercial office support.",
  },
];

const initialAssignments: Assignment[] = [
  {
    id: "a-001",
    bookingId: "b-001",
    cleanerId: "u-cleaner",
    status: "CONFIRMED",
    notes: "Assigned after admin confirmation.",
    createdAt: "2026-10-15T10:00:00.000Z",
  },
  {
    id: "a-002",
    bookingId: "b-002",
    cleanerId: "u-cleaner",
    status: "CONFIRMED",
    notes: "Office shift assignment.",
    createdAt: "2026-10-15T16:00:00.000Z",
    checkedInAt: "2026-10-15T18:00:00.000Z",
    checkedOutAt: "2026-10-15T20:00:00.000Z",
  },
];

const initialOvertime: OvertimeRequest[] = [
  {
    id: "o-001",
    cleanerId: "u-cleaner",
    bookingId: "b-002",
    date: "2026-10-15",
    additionalMinutes: 45,
    reason: "Extra time needed to finish the reception area.",
    description: "The client requested a deeper polish of the reception glass frontage and lobby floor.",
    status: "PENDING_APPROVAL",
    submittedAt: "2026-10-15T20:15:00.000Z",
  },
];

const initialNotifications: Notification[] = [
  {
    id: "n-001",
    userId: "u-admin",
    title: "New booking request",
    message: "Harlow Family Home requires a weekly cleaning review.",
    destination: "/admin",
    createdAt: "2026-10-15T08:30:00.000Z",
    read: false,
  },
  {
    id: "n-002",
    userId: "u-cleaner",
    title: "Confirmed assignment",
    message: "Harlow Family Home is scheduled for 20 October.",
    destination: "/cleaner",
    createdAt: "2026-10-15T10:10:00.000Z",
    read: false,
  },
];

const initialChecklistSubmissions: ChecklistSubmission[] = [
  {
    id: "c-001",
    cleanerId: "u-cleaner",
    bookingId: "b-002",
    jobCompleted: true,
    notes: "All standard areas completed. Lobby floor polished to requested finish.",
    photosUploaded: 2,
    evidenceFiles: [],
    submittedAt: "2026-10-15T20:45:00.000Z",
    status: "SUBMITTED",
  },
];

const initialIncidentReports: IncidentReport[] = [
  {
    id: "i-001",
    cleanerId: "u-cleaner",
    bookingId: "b-002",
    severity: "MEDIUM",
    title: "Reception glass streaking",
    description: "Visible streaks remained on front-facing glass after final polish.",
    raisedAt: "2026-10-15T20:55:00.000Z",
    status: "OPEN",
  },
];

function toEnumRole(role: User["role"]) {
  return role;
}

function toBookingStatus(status: BookingRequest["status"]) {
  return status;
}

function toOvertimeStatus(status: OvertimeRequest["status"]) {
  return status;
}

function toIncidentSeverity(severity: IncidentReport["severity"]) {
  return severity;
}

async function createSeedData(): Promise<AppData> {
  const users = await Promise.all(
    initialUsers.map(async (user) => ({
      ...user,
      passwordHash: await hashPassword("Welcome123!"),
    })),
  );

  return {
    users,
    properties: initialProperties,
    bookings: initialBookings,
    assignments: initialAssignments,
    overtimeRequests: initialOvertime,
    notifications: initialNotifications,
    checklistSubmissions: initialChecklistSubmissions,
    incidentReports: initialIncidentReports,
    serviceMessages: [],
    serviceReviews: [],
  };
}

export async function ensureSeedData(): Promise<AppData> {
  if (isDatabaseConfigured()) {
    const prisma = await ensurePrismaClient();
    if (await prisma.user.count()) {
      return readStore();
    }

    const seed = await createSeedData();
    await writeStore(seed);
    return seed;
  }

  const directory = path.dirname(appDataPath);
  await fs.mkdir(directory, { recursive: true });

  try {
    const existing = await fs.readFile(appDataPath, "utf8");
    if (existing.trim()) {
      return JSON.parse(existing) as AppData;
    }
  } catch {
    // Ignore missing file.
  }

  const seed = await createSeedData();

  await fs.writeFile(appDataPath, JSON.stringify(seed, null, 2), "utf8");
  return seed;
}

export async function readStore(): Promise<AppData> {
  if (isDatabaseConfigured()) {
    const prisma = await ensurePrismaClient();
    if ((await prisma.user.count()) === 0) {
      return ensureSeedData();
    }

    const [users, properties, bookings, assignments, overtimeRequests, notifications, checklistSubmissions, incidentReports, serviceMessages, serviceReviews] = await Promise.all([
      prisma.user.findMany({ orderBy: { createdAt: "desc" } }),
      prisma.property.findMany({ orderBy: { createdAt: "desc" } }),
      prisma.bookingRequest.findMany({ orderBy: { createdAt: "desc" } }),
      prisma.assignment.findMany({ orderBy: { createdAt: "desc" } }),
      prisma.overtimeRequest.findMany({ orderBy: { submittedAt: "desc" } }),
      prisma.notification.findMany({ orderBy: { createdAt: "desc" } }),
      prisma.checklistSubmission.findMany({ orderBy: { submittedAt: "desc" } }),
      prisma.incidentReport.findMany({ orderBy: { raisedAt: "desc" } }),
      prisma.serviceMessage.findMany({ orderBy: { createdAt: "desc" } }),
      prisma.serviceReview.findMany({ orderBy: { createdAt: "desc" } }),
    ]);

    return {
      users: users.map((user: Record<string, unknown>) => ({
        id: String(user.id),
        name: String(user.name),
        email: String(user.email),
        passwordHash: String(user.passwordHash),
        role: String(user.role) as User["role"],
        phone: typeof user.phone === "string" ? user.phone : undefined,
        createdAt: new Date(String(user.createdAt)).toISOString(),
      })),
      properties: properties.map((property: Record<string, unknown>) => ({
        id: String(property.id),
        name: String(property.name),
        address: String(property.address),
        postcode: String(property.postcode),
        specialRequirements: typeof property.specialRequirements === "string" ? property.specialRequirements : "",
        clientId: String(property.clientId),
        accessInstructions: typeof property.accessInstructions === "string" ? property.accessInstructions : "",
        createdAt: new Date(String(property.createdAt)).toISOString(),
      })),
      bookings: bookings.map((booking: Record<string, unknown>) => ({
        id: String(booking.id),
        clientId: String(booking.clientId),
        propertyId: String(booking.propertyId),
        serviceType: String(booking.serviceType) as BookingRequest["serviceType"],
        preferredDate: new Date(String(booking.preferredDate)).toISOString().slice(0, 10),
        preferredWindow: String(booking.preferredWindow),
        frequency: String(booking.frequency) as BookingRequest["frequency"],
        instructions: typeof booking.instructions === "string" ? booking.instructions : "",
        status: String(booking.status) as BookingRequest["status"],
        createdAt: new Date(String(booking.createdAt)).toISOString(),
        notes: typeof booking.notes === "string" ? booking.notes : undefined,
      })),
      assignments: assignments.map((assignment: Record<string, unknown>) => ({
        id: String(assignment.id),
        bookingId: String(assignment.bookingId),
        cleanerId: String(assignment.cleanerId),
        status: String(assignment.status) as Assignment["status"],
        notes: typeof assignment.notes === "string" ? assignment.notes : "",
        createdAt: new Date(String(assignment.createdAt)).toISOString(),
        checkedInAt: assignment.checkedInAt ? new Date(String(assignment.checkedInAt)).toISOString() : undefined,
        checkedOutAt: assignment.checkedOutAt ? new Date(String(assignment.checkedOutAt)).toISOString() : undefined,
      })),
      overtimeRequests: overtimeRequests.map((overtime: Record<string, unknown>) => ({
        id: String(overtime.id),
        cleanerId: String(overtime.cleanerId),
        bookingId: typeof overtime.bookingId === "string" ? overtime.bookingId : undefined,
        date: new Date(String(overtime.date)).toISOString().slice(0, 10),
        additionalMinutes: Number(overtime.additionalMinutes),
        reason: String(overtime.reason),
        description: String(overtime.description),
        status: String(overtime.status) as OvertimeRequest["status"],
        submittedAt: new Date(String(overtime.submittedAt)).toISOString(),
        decision: typeof overtime.decision === "string" ? overtime.decision : undefined,
        approvedAt: overtime.approvedAt ? new Date(String(overtime.approvedAt)).toISOString() : undefined,
      })),
      notifications: notifications.map((notification: Record<string, unknown>) => ({
        id: String(notification.id),
        userId: String(notification.userId),
        title: String(notification.title),
        message: String(notification.message),
        destination: String(notification.destination),
        createdAt: new Date(String(notification.createdAt)).toISOString(),
        read: Boolean(notification.read),
      })),
      checklistSubmissions: checklistSubmissions.map((checklist: Record<string, unknown>) => ({
        id: String(checklist.id),
        cleanerId: String(checklist.cleanerId),
        bookingId: typeof checklist.bookingId === "string" ? checklist.bookingId : undefined,
        jobCompleted: Boolean(checklist.jobCompleted),
        notes: typeof checklist.notes === "string" ? checklist.notes : "",
        photosUploaded: Number(checklist.photosUploaded),
        evidenceFiles: Array.isArray(checklist.evidenceFiles) ? checklist.evidenceFiles.filter((item): item is string => typeof item === "string") : [],
        submittedAt: new Date(String(checklist.submittedAt)).toISOString(),
        status: String(checklist.status) as ChecklistSubmission["status"],
      })),
      incidentReports: incidentReports.map((incident: Record<string, unknown>) => ({
        id: String(incident.id),
        cleanerId: String(incident.cleanerId),
        bookingId: typeof incident.bookingId === "string" ? incident.bookingId : undefined,
        severity: String(incident.severity) as IncidentReport["severity"],
        title: String(incident.title),
        description: String(incident.description),
        raisedAt: new Date(String(incident.raisedAt)).toISOString(),
        status: String(incident.status) as IncidentReport["status"],
      })),
      serviceMessages: serviceMessages.map((message: Record<string, unknown>) => ({
        id: String(message.id),
        bookingId: String(message.bookingId),
        senderId: String(message.senderId),
        body: String(message.body),
        createdAt: new Date(String(message.createdAt)).toISOString(),
      })),
      serviceReviews: serviceReviews.map((review: Record<string, unknown>) => ({
        id: String(review.id),
        bookingId: String(review.bookingId),
        clientId: String(review.clientId),
        cleanerId: String(review.cleanerId),
        quality: Number(review.quality),
        punctuality: Number(review.punctuality),
        communication: Number(review.communication),
        comment: String(review.comment),
        createdAt: new Date(String(review.createdAt)).toISOString(),
      })),
    };
  }

  await ensureSeedData();
  const raw = await fs.readFile(appDataPath, "utf8");
  const data = JSON.parse(raw) as Partial<AppData>;
  return {
    ...data,
    users: data.users ?? [],
    properties: data.properties ?? [],
    bookings: data.bookings ?? [],
    assignments: (data.assignments ?? []).map((assignment) => ({ ...assignment })),
    overtimeRequests: data.overtimeRequests ?? [],
    notifications: data.notifications ?? [],
    checklistSubmissions: (data.checklistSubmissions ?? []).map((checklist) => ({
      ...checklist,
      evidenceFiles: checklist.evidenceFiles ?? [],
    })),
    incidentReports: data.incidentReports ?? [],
    serviceMessages: data.serviceMessages ?? [],
    serviceReviews: data.serviceReviews ?? [],
  };
}

export async function writeStore(data: AppData) {
  if (isDatabaseConfigured()) {
    const prisma = await ensurePrismaClient();
    await Promise.all(data.users.map(async (user: User) => {
        await prisma.user.upsert({
          where: { email: user.email },
          update: {
            name: user.name,
            passwordHash: user.passwordHash,
            role: toEnumRole(user.role),
            phone: user.phone,
          },
          create: {
            id: user.id,
            name: user.name,
            email: user.email,
            passwordHash: user.passwordHash,
            role: toEnumRole(user.role),
            phone: user.phone,
            createdAt: new Date(user.createdAt),
          },
        });
      }));
    await Promise.all(data.properties.map(async (property: Property) => {
        await prisma.property.upsert({
          where: { id: property.id },
          update: {
            name: property.name,
            address: property.address,
            postcode: property.postcode,
            specialRequirements: property.specialRequirements,
            accessInstructions: property.accessInstructions,
            clientId: property.clientId,
          },
          create: {
            id: property.id,
            name: property.name,
            address: property.address,
            postcode: property.postcode,
            specialRequirements: property.specialRequirements,
            accessInstructions: property.accessInstructions,
            clientId: property.clientId,
            createdAt: new Date(property.createdAt),
          },
        });
      }));
    await Promise.all(data.bookings.map(async (booking: BookingRequest) => {
        await prisma.bookingRequest.upsert({
          where: { id: booking.id },
          update: {
            clientId: booking.clientId,
            propertyId: booking.propertyId,
            serviceType: booking.serviceType,
            preferredDate: new Date(`${booking.preferredDate}T00:00:00.000Z`),
            preferredWindow: booking.preferredWindow,
            frequency: booking.frequency,
            instructions: booking.instructions,
            status: toBookingStatus(booking.status),
            notes: booking.notes,
          },
          create: {
            id: booking.id,
            clientId: booking.clientId,
            propertyId: booking.propertyId,
            serviceType: booking.serviceType,
            preferredDate: new Date(`${booking.preferredDate}T00:00:00.000Z`),
            preferredWindow: booking.preferredWindow,
            frequency: booking.frequency,
            instructions: booking.instructions,
            status: toBookingStatus(booking.status),
            notes: booking.notes,
            createdAt: new Date(booking.createdAt),
          },
        });
      }));
    await Promise.all(data.assignments.map(async (assignment: Assignment) => {
        await prisma.assignment.upsert({
          where: { id: assignment.id },
          update: {
            bookingId: assignment.bookingId,
            cleanerId: assignment.cleanerId,
            status: assignment.status,
            notes: assignment.notes,
            checkedInAt: assignment.checkedInAt ? new Date(assignment.checkedInAt) : null,
            checkedOutAt: assignment.checkedOutAt ? new Date(assignment.checkedOutAt) : null,
          },
          create: {
            id: assignment.id,
            bookingId: assignment.bookingId,
            cleanerId: assignment.cleanerId,
            status: assignment.status,
            notes: assignment.notes,
            checkedInAt: assignment.checkedInAt ? new Date(assignment.checkedInAt) : null,
            checkedOutAt: assignment.checkedOutAt ? new Date(assignment.checkedOutAt) : null,
            createdAt: new Date(assignment.createdAt),
          },
        });
      }));
    await Promise.all(data.overtimeRequests.map(async (overtime: OvertimeRequest) => {
        await prisma.overtimeRequest.upsert({
          where: { id: overtime.id },
          update: {
            cleanerId: overtime.cleanerId,
            bookingId: overtime.bookingId ?? null,
            date: new Date(`${overtime.date}T00:00:00.000Z`),
            additionalMinutes: overtime.additionalMinutes,
            reason: overtime.reason,
            description: overtime.description,
            status: toOvertimeStatus(overtime.status),
            decision: overtime.decision,
            approvedAt: overtime.approvedAt ? new Date(overtime.approvedAt) : null,
          },
          create: {
            id: overtime.id,
            cleanerId: overtime.cleanerId,
            bookingId: overtime.bookingId ?? null,
            date: new Date(`${overtime.date}T00:00:00.000Z`),
            additionalMinutes: overtime.additionalMinutes,
            reason: overtime.reason,
            description: overtime.description,
            status: toOvertimeStatus(overtime.status),
            submittedAt: new Date(overtime.submittedAt),
            decision: overtime.decision,
            approvedAt: overtime.approvedAt ? new Date(overtime.approvedAt) : null,
          },
        });
      }));
    await Promise.all(data.notifications.map(async (notification: Notification) => {
        await prisma.notification.upsert({
          where: { id: notification.id },
          update: {
            userId: notification.userId,
            title: notification.title,
            message: notification.message,
            destination: notification.destination,
            read: notification.read,
          },
          create: {
            id: notification.id,
            userId: notification.userId,
            title: notification.title,
            message: notification.message,
            destination: notification.destination,
            read: notification.read,
            createdAt: new Date(notification.createdAt),
          },
        });
      }));
    await Promise.all(data.checklistSubmissions.map(async (checklist: ChecklistSubmission) => {
        await prisma.checklistSubmission.upsert({
          where: { id: checklist.id },
          update: {
            cleanerId: checklist.cleanerId,
            bookingId: checklist.bookingId ?? null,
            jobCompleted: checklist.jobCompleted,
            notes: checklist.notes,
            photosUploaded: checklist.photosUploaded,
            evidenceFiles: checklist.evidenceFiles ?? [],
            status: checklist.status,
          },
          create: {
            id: checklist.id,
            cleanerId: checklist.cleanerId,
            bookingId: checklist.bookingId ?? null,
            jobCompleted: checklist.jobCompleted,
            notes: checklist.notes,
            photosUploaded: checklist.photosUploaded,
            evidenceFiles: checklist.evidenceFiles ?? [],
            submittedAt: new Date(checklist.submittedAt),
            status: checklist.status,
          },
        });
      }));
    await Promise.all(data.serviceMessages.map(async (message: ServiceMessage) => {
      await prisma.serviceMessage.upsert({
        where: { id: message.id },
        update: { bookingId: message.bookingId, senderId: message.senderId, body: message.body },
        create: { ...message, createdAt: new Date(message.createdAt) },
      });
    }));
    await Promise.all(data.serviceReviews.map(async (review: ServiceReview) => {
      await prisma.serviceReview.upsert({
        where: { id: review.id },
        update: {
          bookingId: review.bookingId,
          clientId: review.clientId,
          cleanerId: review.cleanerId,
          quality: review.quality,
          punctuality: review.punctuality,
          communication: review.communication,
          comment: review.comment,
        },
        create: { ...review, createdAt: new Date(review.createdAt) },
      });
    }));
    await Promise.all(data.incidentReports.map(async (incident: IncidentReport) => {
        await prisma.incidentReport.upsert({
          where: { id: incident.id },
          update: {
            cleanerId: incident.cleanerId,
            bookingId: incident.bookingId ?? null,
            severity: toIncidentSeverity(incident.severity),
            title: incident.title,
            description: incident.description,
            status: incident.status,
          },
          create: {
            id: incident.id,
            cleanerId: incident.cleanerId,
            bookingId: incident.bookingId ?? null,
            severity: toIncidentSeverity(incident.severity),
            title: incident.title,
            description: incident.description,
            raisedAt: new Date(incident.raisedAt),
            status: incident.status,
          },
        });
      }));
    return;
  }

  const directory = path.dirname(appDataPath);
  await fs.mkdir(directory, { recursive: true });
  await fs.writeFile(appDataPath, JSON.stringify(data, null, 2), "utf8");
}

export async function findUserByEmail(email: string) {
  const data = await readStore();
  return data.users.find((user) => user.email.toLowerCase() === email.toLowerCase()) ?? null;
}

export async function findUserById(id: string) {
  const data = await readStore();
  return data.users.find((user) => user.id === id) ?? null;
}

export async function getAllUsers() {
  const data = await readStore();
  return data.users;
}

export async function getPropertiesForUser(userId: string) {
  const data = await readStore();
  return data.properties.filter((property) => property.clientId === userId);
}

export async function getBookingsForUser(userId: string) {
  const data = await readStore();
  return data.bookings.filter((booking) => booking.clientId === userId);
}

export async function getBookingsForAdmin() {
  const data = await readStore();
  return data.bookings;
}

export async function getAssignmentsForCleaner(cleanerId: string) {
  const data = await readStore();
  return data.assignments.filter((assignment) => assignment.cleanerId === cleanerId && assignment.status !== "CANCELLED");
}

export async function updateAssignmentAttendance(
  bookingId: string,
  cleanerId: string,
  action: "CHECK_IN" | "CHECK_OUT",
) {
  const data = await readStore();
  const assignment = data.assignments.find((item) => item.bookingId === bookingId && item.cleanerId === cleanerId && item.status !== "CANCELLED");
  if (!assignment) throw new Error("You are not assigned to this service.");

  const now = new Date().toISOString();
  if (action === "CHECK_IN") {
    const booking = data.bookings.find((item) => item.id === bookingId);
    if (!booking) throw new Error("Booking not found.");
    if (booking.status !== "ASSIGNED") throw new Error("The administrator must assign this service before check-in.");
    if (assignment.checkedInAt || assignment.checkedOutAt) throw new Error("This service has already been started or completed.");
    assignment.checkedInAt = now;
    booking.status = "IN_PROGRESS";
  } else {
    if (!assignment.checkedInAt) throw new Error("Check in before checking out.");
    if (assignment.checkedOutAt) throw new Error("This service has already been checked out.");
    assignment.checkedOutAt = now;
  }

  await writeStore(data);
  return assignment;
}

export async function getEvidenceAccess(filename: string, user: User) {
  const data = await readStore();
  const checklist = data.checklistSubmissions.find((item) => item.evidenceFiles.includes(filename));
  if (!checklist?.bookingId) return false;
  const booking = data.bookings.find((item) => item.id === checklist.bookingId);
  if (!booking) return false;
  if (user.role === "ADMIN" || (user.role === "CLIENT" && booking.clientId === user.id)) return true;
  return user.role === "CLEANER" && checklist.cleanerId === user.id;
}

export async function registerUser(input: {
  name: string;
  email: string;
  password: string;
}) {
  return createAccount({ ...input, role: "CLIENT" });
}

export async function createStaffAccount(input: {
  name: string;
  email: string;
  password: string;
  role: "ADMIN" | "CLEANER";
}) {
  return createAccount(input);
}

async function createAccount(input: {
  name: string;
  email: string;
  password: string;
  role: User["role"];
}) {
  const data = await readStore();
  const existing = data.users.find((user) => user.email.toLowerCase() === input.email.toLowerCase());

  if (existing) {
    throw new Error("A user with that email address already exists.");
  }

  const user: User = {
    id: `u-${randomUUID()}`,
    name: input.name,
    email: input.email,
    passwordHash: await hashPassword(input.password),
    role: input.role,
    createdAt: new Date().toISOString(),
  };

  data.users.push(user);
  await writeStore(data);
  return user;
}

export async function loginWithCredentials(email: string, password: string) {
  const user = await findUserByEmail(email);
  if (!user) return null;

  const { verifyPassword } = await import("@/lib/auth");
  const valid = await verifyPassword(password, user.passwordHash);
  return valid ? user : null;
}

export async function createProperty(input: {
  clientId: string;
  name: string;
  address: string;
  postcode: string;
  specialRequirements?: string;
  accessInstructions?: string;
}) {
  const data = await readStore();

  const property: Property = {
    id: `p-${Date.now()}`,
    clientId: input.clientId,
    name: input.name,
    address: input.address,
    postcode: input.postcode,
    specialRequirements: input.specialRequirements ?? "",
    accessInstructions: input.accessInstructions ?? "",
    createdAt: new Date().toISOString(),
  };

  data.properties.unshift(property);
  data.notifications.unshift({
    id: `n-${Date.now()}`,
    userId: "u-admin",
    title: "New property registered",
    message: `${input.name} has been added to the client portfolio and is ready for scheduling.`,
    destination: "/admin",
    createdAt: new Date().toISOString(),
    read: false,
  });

  await writeStore(data);
  return property;
}

export async function createBooking(input: {
  clientId: string;
  propertyId: string;
  serviceType: BookingRequest["serviceType"];
  preferredDate: string;
  preferredWindow: string;
  frequency: BookingRequest["frequency"];
  instructions: string;
  notes?: string;
}) {
  const data = await readStore();
  const property = data.properties.find((item) => item.id === input.propertyId && item.clientId === input.clientId);
  if (!property) throw new Error("Select one of your registered properties.");

  const booking: BookingRequest = {
    id: `b-${Date.now()}`,
    clientId: input.clientId,
    propertyId: input.propertyId,
    serviceType: input.serviceType,
    preferredDate: input.preferredDate,
    preferredWindow: input.preferredWindow,
    frequency: input.frequency,
    instructions: input.instructions,
    status: "PENDING",
    createdAt: new Date().toISOString(),
    notes: input.notes,
  };

  data.bookings.unshift(booking);
  data.notifications.unshift({
    id: `n-${Date.now()}`,
    userId: "u-admin",
    title: "New booking request",
    message: `A new ${input.serviceType.toLowerCase()} cleaning request is waiting for approval.`,
    destination: "/admin",
    createdAt: new Date().toISOString(),
    read: false,
  });

  await writeStore(data);
  return booking;
}

export async function updateBookingStatus(bookingId: string, status: BookingRequest["status"]) {
  const data = await readStore();
  const booking = data.bookings.find((item) => item.id === bookingId);
  if (!booking) throw new Error("Booking not found.");
  if (status === "ASSIGNED" && !data.assignments.some((item) => item.bookingId === booking.id)) {
    throw new Error("Assign a cleaner before confirming the service.");
  }
  if ((status === "APPROVED" || status === "REJECTED") && booking.status !== "PENDING") {
    throw new Error("Only pending bookings can be approved or rejected.");
  }

  booking.status = status;
  if (status === "REJECTED" || status === "CANCELLED") {
    for (const assignment of data.assignments.filter((item) => item.bookingId === bookingId)) {
      assignment.status = "CANCELLED";
    }
  }
  if (status !== "PENDING") {
    data.notifications.unshift({
      id: `n-${randomUUID()}`,
      userId: booking.clientId,
      title: status === "REJECTED" ? "Booking request declined" : "Booking status updated",
      message: `Your ${booking.serviceType.toLowerCase()} cleaning request is now ${status.replace(/_/g, " ").toLowerCase()}.`,
      destination: "/client",
      createdAt: new Date().toISOString(),
      read: false,
    });
  }
  await writeStore(data);
  return booking;
}

export async function createAssignment(input: { bookingId: string; cleanerId: string; notes?: string }) {
  const data = await readStore();
  const booking = data.bookings.find((item) => item.id === input.bookingId);
  if (!booking) throw new Error("Booking not found.");
  if (!["PENDING", "APPROVED", "ASSIGNED"].includes(booking.status)) throw new Error("This service can no longer be assigned.");
  if (!data.users.some((user) => user.id === input.cleanerId && user.role === "CLEANER")) throw new Error("Select a valid cleaner.");
  if (data.assignments.some((item) => item.bookingId === input.bookingId && item.checkedInAt)) {
    throw new Error("A service cannot be reassigned after the cleaner checks in.");
  }
  data.assignments = data.assignments.filter((item) => item.bookingId !== input.bookingId);
  const assignment: Assignment = {
    id: `a-${Date.now()}`,
    bookingId: input.bookingId,
    cleanerId: input.cleanerId,
    status: "CONFIRMED",
    notes: input.notes ?? "Admin confirmed this assignment.",
    createdAt: new Date().toISOString(),
  };

  data.assignments.unshift(assignment);
  data.notifications.unshift({
    id: `n-${Date.now()}`,
    userId: input.cleanerId,
    title: "Confirmed assignment",
    message: "You have been assigned to a new cleaning service.",
    destination: "/cleaner",
    createdAt: new Date().toISOString(),
    read: false,
  });
  data.notifications.unshift({
    id: `n-${randomUUID()}`,
    userId: booking.clientId,
    title: "Cleaner assigned",
    message: "A cleaner has been assigned to your service.",
    destination: "/client",
    createdAt: new Date().toISOString(),
    read: false,
  });

  await writeStore(data);
  return assignment;
}

export async function createOvertimeRequest(input: {
  cleanerId: string;
  bookingId: string;
  date: string;
  additionalMinutes: number;
  reason: string;
  description: string;
}) {
  const data = await readStore();
  if (!data.assignments.some((item) => item.bookingId === input.bookingId && item.cleanerId === input.cleanerId && item.status !== "CANCELLED")) {
    throw new Error("Overtime must relate to one of your assigned services.");
  }
  const booking = data.bookings.find((item) => item.id === input.bookingId);
  if (booking?.status === "CANCELLED" || booking?.status === "REJECTED") {
    throw new Error("Overtime cannot be recorded for a cancelled service.");
  }
  const overtime: OvertimeRequest = {
    id: `o-${Date.now()}`,
    cleanerId: input.cleanerId,
    bookingId: input.bookingId,
    date: input.date,
    additionalMinutes: input.additionalMinutes,
    reason: input.reason,
    description: input.description,
    status: "SUBMITTED",
    submittedAt: new Date().toISOString(),
  };

  data.overtimeRequests.unshift(overtime);
  data.notifications.unshift({
    id: `n-${Date.now()}`,
    userId: "u-admin",
    title: "Overtime awaiting approval",
    message: `Cleaner overtime request pending review: ${input.additionalMinutes} minutes.`,
    destination: "/admin",
    createdAt: new Date().toISOString(),
    read: false,
  });

  await writeStore(data);
  return overtime;
}

export async function updateOvertimeStatus(overtimeId: string, status: OvertimeRequest["status"], decision?: string) {
  const data = await readStore();
  const overtime = data.overtimeRequests.find((item) => item.id === overtimeId);
  if (!overtime) throw new Error("Overtime record not found.");
  if (overtime.status !== "SUBMITTED" && overtime.status !== "PENDING_APPROVAL") {
    throw new Error("This overtime request has already been reviewed.");
  }

  overtime.status = status;
  overtime.decision = decision ?? "Reviewed by administrator";
  overtime.approvedAt = status === "APPROVED" ? new Date().toISOString() : undefined;
  await writeStore(data);
  return overtime;
}

export async function createChecklistSubmission(input: {
  cleanerId: string;
  bookingId: string;
  jobCompleted: boolean;
  notes: string;
  evidenceFiles: string[];
}) {
  const data = await readStore();
  const assignment = data.assignments.find((item) => item.bookingId === input.bookingId && item.cleanerId === input.cleanerId && item.status !== "CANCELLED");
  if (!assignment) throw new Error("You are not assigned to this service.");
  if (!assignment.checkedOutAt) throw new Error("Check out of the service before submitting its checklist.");
  if (data.checklistSubmissions.some((item) => item.bookingId === input.bookingId && item.cleanerId === input.cleanerId && item.status !== "REJECTED")) {
    throw new Error("A checklist for this service is already awaiting review or has been approved.");
  }
  const submission: ChecklistSubmission = {
    id: `c-${Date.now()}`,
    cleanerId: input.cleanerId,
    bookingId: input.bookingId,
    jobCompleted: input.jobCompleted,
    notes: input.notes,
    photosUploaded: input.evidenceFiles.length,
    evidenceFiles: input.evidenceFiles,
    submittedAt: new Date().toISOString(),
    status: "SUBMITTED",
  };

  data.checklistSubmissions.unshift(submission);
  data.notifications.unshift({
    id: `n-${Date.now()}`,
    userId: "u-admin",
    title: "Cleaning checklist submitted",
    message: `A cleaner has submitted a job completion checklist for review.`,
    destination: "/admin",
    createdAt: new Date().toISOString(),
    read: false,
  });

  await writeStore(data);
  return submission;
}

export async function reviewChecklistSubmission(
  checklistId: string,
  decision: "APPROVED" | "REJECTED",
) {
  const data = await readStore();
  const submission = data.checklistSubmissions.find((item) => item.id === checklistId);
  if (!submission?.bookingId) throw new Error("Checklist submission not found.");
  if (submission.status !== "SUBMITTED") throw new Error("This checklist has already been reviewed.");
  if (decision === "APPROVED" && !submission.jobCompleted) {
    throw new Error("A checklist marked incomplete cannot be approved as completed work.");
  }
  const booking = data.bookings.find((item) => item.id === submission.bookingId);
  if (!booking) throw new Error("Booking not found.");
  if (!data.assignments.some((item) => item.bookingId === booking.id && item.cleanerId === submission.cleanerId && item.checkedOutAt)) {
    throw new Error("The assigned cleaner must check out before the submitted work can be reviewed.");
  }
  submission.status = decision;
  booking.status = decision === "APPROVED" && submission.jobCompleted ? "COMPLETED" : "REQUIRES_CORRECTIVE_WORK";
  data.notifications.unshift({
    id: `n-${randomUUID()}`,
    userId: booking.clientId,
    title: decision === "APPROVED" && submission.jobCompleted ? "Service completed" : "Service needs follow-up",
    message: decision === "APPROVED" && submission.jobCompleted
      ? "Your cleaning service has been reviewed and completed. You can now leave a rating."
      : "The cleaning service requires follow-up. Please contact the administrator if you need more information.",
    destination: "/client",
    createdAt: new Date().toISOString(),
    read: false,
  });
  await writeStore(data);
  return submission;
}

export async function createServiceMessage(input: { bookingId: string; senderId: string; body: string }) {
  const data = await readStore();
  const booking = data.bookings.find((item) => item.id === input.bookingId);
  const sender = data.users.find((item) => item.id === input.senderId);
  if (!booking || !sender) throw new Error("Service or sender not found.");
  const assignedCleaner = data.assignments.some((item) => item.bookingId === booking.id && item.cleanerId === sender.id && item.status !== "CANCELLED");
  if (sender.role !== "ADMIN" && sender.id !== booking.clientId && !assignedCleaner) {
    throw new Error("You are not allowed to message this service.");
  }
  const message: ServiceMessage = {
    id: `m-${randomUUID()}`,
    bookingId: booking.id,
    senderId: sender.id,
    body: input.body,
    createdAt: new Date().toISOString(),
  };
  data.serviceMessages.unshift(message);
  const recipientIds = sender.role === "ADMIN"
    ? [booking.clientId, ...data.assignments.filter((item) => item.bookingId === booking.id).map((item) => item.cleanerId)]
    : [sender.id === booking.clientId
      ? data.assignments.find((item) => item.bookingId === booking.id)?.cleanerId
      : booking.clientId,
    ...data.users.filter((item) => item.role === "ADMIN").map((item) => item.id)];
  for (const recipientId of new Set(recipientIds.filter((id): id is string => Boolean(id) && id !== sender.id))) {
    const recipientRole = data.users.find((item) => item.id === recipientId)?.role;
    data.notifications.unshift({
      id: `n-${randomUUID()}`,
      userId: recipientId,
      title: "New service message",
      message: "A new message was added to a cleaning service.",
      destination: recipientRole === "ADMIN" ? "/admin" : recipientRole === "CLEANER" ? "/cleaner" : "/client",
      createdAt: message.createdAt,
      read: false,
    });
  }
  await writeStore(data);
  return message;
}

export async function createServiceReview(input: {
  bookingId: string;
  clientId: string;
  quality: number;
  punctuality: number;
  communication: number;
  comment: string;
}) {
  const data = await readStore();
  const booking = data.bookings.find((item) => item.id === input.bookingId && item.clientId === input.clientId);
  if (!booking || booking.status !== "COMPLETED") throw new Error("Only completed services can be reviewed.");
  if (data.serviceReviews.some((review) => review.bookingId === booking.id)) throw new Error("This service has already been reviewed.");
  const assignment = data.assignments.find((item) => item.bookingId === booking.id);
  if (!assignment) throw new Error("The service has no assigned cleaner.");
  const review: ServiceReview = {
    id: `r-${randomUUID()}`,
    bookingId: booking.id,
    clientId: input.clientId,
    cleanerId: assignment.cleanerId,
    quality: input.quality,
    punctuality: input.punctuality,
    communication: input.communication,
    comment: input.comment,
    createdAt: new Date().toISOString(),
  };
  data.serviceReviews.unshift(review);
  await writeStore(data);
  return review;
}

export async function createIncidentReport(input: {
  cleanerId: string;
  bookingId: string;
  severity: IncidentReport["severity"];
  title: string;
  description: string;
}) {
  const data = await readStore();
  if (!data.assignments.some((item) => item.bookingId === input.bookingId && item.cleanerId === input.cleanerId && item.status !== "CANCELLED")) {
    throw new Error("Incidents must relate to one of your assigned services.");
  }
  const incident: IncidentReport = {
    id: `i-${Date.now()}`,
    cleanerId: input.cleanerId,
    bookingId: input.bookingId,
    severity: input.severity,
    title: input.title,
    description: input.description,
    raisedAt: new Date().toISOString(),
    status: "OPEN",
  };

  data.incidentReports.unshift(incident);
  data.notifications.unshift({
    id: `n-${Date.now()}`,
    userId: "u-admin",
    title: "Incident reported",
    message: `${input.title} has been flagged by a cleaner and requires review.`,
    destination: "/admin",
    createdAt: new Date().toISOString(),
    read: false,
  });

  await writeStore(data);
  return incident;
}

export async function markNotificationRead(notificationId: string) {
  const data = await readStore();
  const notification = data.notifications.find((item) => item.id === notificationId);
  if (!notification) return null;
  notification.read = true;
  await writeStore(data);
  return notification;
}

export async function getDashboardSummary(user: User) {
  const data = await readStore();
  const userBookings = data.bookings.filter((booking) => booking.clientId === user.id);
  const cleanerAssignments = data.assignments.filter((assignment) => assignment.cleanerId === user.id && assignment.status !== "CANCELLED");

  const metrics = {
    bookingsByStatus: {
      PENDING: data.bookings.filter((b) => b.status === "PENDING").length,
      APPROVED: data.bookings.filter((b) => b.status === "APPROVED").length,
      COMPLETED: data.bookings.filter((b) => b.status === "COMPLETED").length,
      REJECTED: data.bookings.filter((b) => b.status === "REJECTED").length,
    },
    totalProperties: data.properties.length,
    upcoming: userBookings.length,
    assignments: cleanerAssignments.length,
    notifications: data.notifications.filter((n) => n.userId === user.id && !n.read).length,
    openIncidents: data.incidentReports.filter((item) => item.status !== "RESOLVED").length,
    checklistPendingReview: data.checklistSubmissions.filter((item) => item.status === "SUBMITTED").length,
  };

  return {
    properties: data.properties,
    bookings: user.role === "CLIENT" ? userBookings : data.bookings,
    assignments: user.role === "CLEANER" ? cleanerAssignments : data.assignments,
    overtimeRequests: data.overtimeRequests.filter((item) => user.role === "ADMIN" || item.cleanerId === user.id),
    notifications: data.notifications.filter((n) => n.userId === user.id),
    checklistSubmissions: data.checklistSubmissions.filter((item) => user.role === "ADMIN" || item.cleanerId === user.id),
    incidentReports: data.incidentReports.filter((item) => user.role === "ADMIN" || item.cleanerId === user.id),
    serviceMessages: data.serviceMessages.filter((item) => user.role === "ADMIN"
      || (user.role === "CLIENT" && userBookings.some((booking) => booking.id === item.bookingId))
      || (user.role === "CLEANER" && cleanerAssignments.some((assignment) => assignment.bookingId === item.bookingId))),
    serviceReviews: data.serviceReviews.filter((item) => user.role === "ADMIN"
      || (user.role === "CLIENT" && item.clientId === user.id)
      || (user.role === "CLEANER" && item.cleanerId === user.id)),
    metrics,
  };
}
