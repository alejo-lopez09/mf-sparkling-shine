import { getAllUsers, getDashboardSummary } from "@/lib/data";
import { getCurrentUser } from "@/lib/session";

function csvCell(value: string | number) {
  const text = String(value);
  const safe = /^[\s]*[=+\-@]/.test(text) ? `'${text}` : text;
  return `"${safe.replace(/"/g, '""')}"`;
}

export async function GET(request: Request) {
  const user = await getCurrentUser();
  if (!user || user.role !== "ADMIN") return new Response("Forbidden", { status: 403 });

  const url = new URL(request.url);
  const from = url.searchParams.get("from");
  const to = url.searchParams.get("to");
  const clientId = url.searchParams.get("clientId");
  const cleanerId = url.searchParams.get("cleanerId");
  const addressFilter = url.searchParams.get("address")?.trim().toLocaleLowerCase("en-GB");
  const summary = await getDashboardSummary(user);
  const users = await getAllUsers();
  const people = new Map(users.map((person) => [person.id, person.name]));
  const properties = new Map(summary.properties.map((property) => [property.id, property]));
  const assignments = new Map(summary.assignments.map((assignment) => [assignment.bookingId, assignment]));
  const rows: (string | number)[][] = [
    ["Service ID", "Client", "Property", "Address", "Postcode", "Service type", "Date", "Time window", "Status", "Cleaner", "Check-in", "Check-out", "Worked hours", "Work approved", "Checklist notes", "Evidence photos", "Quality rating", "Punctuality rating", "Communication rating", "Approved overtime minutes", "Approved overtime details"],
  ];

  for (const booking of summary.bookings) {
    if (from && booking.preferredDate < from) continue;
    if (to && booking.preferredDate > to) continue;
    const property = properties.get(booking.propertyId);
    const assignment = assignments.get(booking.id);
    if (clientId && booking.clientId !== clientId) continue;
    if (cleanerId && assignment?.cleanerId !== cleanerId) continue;
    if (addressFilter && !`${property?.address ?? ""} ${property?.postcode ?? ""}`.toLocaleLowerCase("en-GB").includes(addressFilter)) continue;
    const duration = assignment?.checkedInAt && assignment.checkedOutAt
      ? Math.max(0, Date.parse(assignment.checkedOutAt) - Date.parse(assignment.checkedInAt)) / 3_600_000
      : 0;
    const approvedEntries = summary.overtimeRequests.filter((item) => item.bookingId === booking.id && item.status === "APPROVED");
    const approvedOvertime = approvedEntries.reduce((total, item) => total + item.additionalMinutes, 0);
    const overtimeDetails = approvedEntries.map((item) => `${item.additionalMinutes} minutes: ${item.reason} — ${item.description}`).join(" | ");
    const checklist = summary.checklistSubmissions.find((item) => item.bookingId === booking.id && item.status === "APPROVED");
    const review = summary.serviceReviews.find((item) => item.bookingId === booking.id);
    rows.push([
      booking.id,
      people.get(booking.clientId) ?? "",
      property?.name ?? "",
      property?.address ?? "",
      property?.postcode ?? "",
      booking.serviceType,
      booking.preferredDate,
      booking.preferredWindow,
      booking.status,
      assignment ? people.get(assignment.cleanerId) ?? "" : "",
      assignment?.checkedInAt ?? "",
      assignment?.checkedOutAt ?? "",
      duration.toFixed(2),
      checklist ? "Yes" : "No",
      checklist?.notes ?? "",
      checklist?.evidenceFiles.length ?? 0,
      review?.quality ?? "",
      review?.punctuality ?? "",
      review?.communication ?? "",
      approvedOvertime,
      overtimeDetails,
    ]);
  }

  const csv = rows.map((row) => row.map(csvCell).join(",")).join("\r\n");
  return new Response(`\uFEFF${csv}`, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": 'attachment; filename="mf-sparkling-shine-service-report.csv"',
      "Cache-Control": "private, no-store",
    },
  });
}
