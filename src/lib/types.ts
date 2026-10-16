export type Role = "ADMIN" | "CLIENT" | "CLEANER";

export type User = {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
  role: Role;
  phone?: string;
  createdAt: string;
};

export type Property = {
  id: string;
  name: string;
  address: string;
  postcode: string;
  specialRequirements: string;
  clientId: string;
  accessInstructions: string;
  createdAt: string;
};

export type BookingStatus =
  | "PENDING"
  | "APPROVED"
  | "ASSIGNED"
  | "IN_PROGRESS"
  | "COMPLETED"
  | "REQUIRES_CORRECTIVE_WORK"
  | "CANCELLED"
  | "REJECTED";

export type BookingRequest = {
  id: string;
  clientId: string;
  propertyId: string;
  serviceType: "DOMESTIC" | "DEEP" | "OFFICE" | "MOVE_IN";
  preferredDate: string;
  preferredWindow: string;
  frequency: "ONE_OFF" | "WEEKLY" | "FORTNIGHTLY" | "MONTHLY";
  instructions: string;
  status: BookingStatus;
  createdAt: string;
  notes?: string;
};

export type AssignmentStatus = "PUBLISHED" | "INTERESTED" | "CONFIRMED" | "CANCELLED";

export type Assignment = {
  id: string;
  bookingId: string;
  cleanerId: string;
  status: AssignmentStatus;
  notes: string;
  createdAt: string;
  checkedInAt?: string;
  checkedOutAt?: string;
};

export type OvertimeStatus = "SUBMITTED" | "PENDING_APPROVAL" | "APPROVED" | "REJECTED";

export type OvertimeRequest = {
  id: string;
  cleanerId: string;
  bookingId?: string;
  date: string;
  additionalMinutes: number;
  reason: string;
  description: string;
  status: OvertimeStatus;
  submittedAt: string;
  decision?: string;
  approvedAt?: string;
};

export type Notification = {
  id: string;
  userId: string;
  title: string;
  message: string;
  destination: string;
  createdAt: string;
  read: boolean;
};

export type ChecklistSubmission = {
  id: string;
  cleanerId: string;
  bookingId?: string;
  jobCompleted: boolean;
  notes: string;
  photosUploaded: number;
  evidenceFiles: string[];
  submittedAt: string;
  status: "SUBMITTED" | "APPROVED" | "REJECTED";
};

export type ServiceMessage = {
  id: string;
  bookingId: string;
  senderId: string;
  body: string;
  createdAt: string;
};

export type ServiceReview = {
  id: string;
  bookingId: string;
  clientId: string;
  cleanerId: string;
  quality: number;
  punctuality: number;
  communication: number;
  comment: string;
  createdAt: string;
};

export type IncidentReport = {
  id: string;
  cleanerId: string;
  bookingId?: string;
  severity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  title: string;
  description: string;
  raisedAt: string;
  status: "OPEN" | "RESOLVING" | "RESOLVED";
};

export type AppData = {
  users: User[];
  properties: Property[];
  bookings: BookingRequest[];
  assignments: Assignment[];
  overtimeRequests: OvertimeRequest[];
  notifications: Notification[];
  checklistSubmissions: ChecklistSubmission[];
  incidentReports: IncidentReport[];
  serviceMessages: ServiceMessage[];
  serviceReviews: ServiceReview[];
};
