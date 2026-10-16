export const dynamic = "force-dynamic";

import { reportIncidentAction, sendServiceMessageAction, submitChecklistAction, submitOvertimeAction, updateAssignmentAttendanceAction } from "@/app/actions";
import { AppShell } from "@/components/app-shell";
import { getDashboardSummary } from "@/lib/data";
import { getCurrentUser } from "@/lib/session";
import { redirect } from "next/navigation";

export default async function CleanerPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string | string[] }>;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.role !== "CLEANER") redirect("/dashboard");

  const [summary, params] = await Promise.all([getDashboardSummary(user), searchParams]);
  const error = Array.isArray(params.error) ? params.error[0] : params.error;
  const bookings = new Map(summary.bookings.map((booking) => [booking.id, booking]));
  const properties = new Map(summary.properties.map((property) => [property.id, property]));
  const checklistEligibleAssignments = summary.assignments.filter((assignment) =>
    assignment.checkedOutAt && !summary.checklistSubmissions.some((item) => item.bookingId === assignment.bookingId && item.cleanerId === user.id && item.status !== "REJECTED"));

  return (
    <AppShell user={user} title="Cleaner workspace" subtitle="View your jobs, record service times, submit evidence and communicate within each service.">
      {error ? <p role="alert" className="mb-6 rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-800">{error}</p> : null}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[
          ["Assigned jobs", summary.assignments.length],
          ["Checklist review", summary.metrics.checklistPendingReview],
          ["Open incidents", summary.metrics.openIncidents],
          ["Overtime requests", summary.overtimeRequests.length],
        ].map(([label, value]) => (
          <div key={label} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm text-slate-500">{label}</p>
            <p className="mt-2 text-3xl font-semibold text-slate-900">{value}</p>
          </div>
        ))}
      </div>

      <section className="mt-8 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-900">Working schedule</h2>
        <div className="mt-4 grid gap-4 lg:grid-cols-2">
          {summary.assignments.map((assignment) => {
            const booking = bookings.get(assignment.bookingId);
            const property = booking ? properties.get(booking.propertyId) : undefined;
            const conversation = summary.serviceMessages.filter((message) => message.bookingId === assignment.bookingId).slice().reverse();
            return (
              <article key={assignment.id} className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h3 className="font-semibold text-slate-900">{booking?.serviceType ?? "Service"} · {property?.name ?? "Property"}</h3>
                    <p className="text-sm text-slate-600">{property?.address} {property?.postcode}</p>
                    <p className="text-xs text-slate-500">{booking?.preferredDate} · {booking?.preferredWindow}</p>
                    {booking?.instructions ? <p className="mt-2 text-sm text-slate-600">{booking.instructions}</p> : null}
                  </div>
                  <span className="rounded-full border border-cyan-200 bg-cyan-100 px-2.5 py-1 text-xs font-semibold uppercase text-cyan-800">{booking?.status.replace(/_/g, " ")}</span>
                </div>
                {assignment.checkedInAt ? <p className="mt-3 text-xs text-slate-600">Checked in: {new Date(assignment.checkedInAt).toLocaleString("en-GB", { timeZone: "Europe/London" })}</p> : null}
                {assignment.checkedOutAt ? <p className="text-xs text-slate-600">Checked out: {new Date(assignment.checkedOutAt).toLocaleString("en-GB", { timeZone: "Europe/London" })}</p> : null}
                {!assignment.checkedOutAt && booking?.status === "ASSIGNED" ? (
                  <form action={updateAssignmentAttendanceAction} className="mt-3">
                    <input type="hidden" name="bookingId" value={assignment.bookingId} />
                    <input type="hidden" name="action" value={assignment.checkedInAt ? "CHECK_OUT" : "CHECK_IN"} />
                    <button className="rounded-lg bg-slate-900 px-3 py-2 text-xs font-semibold text-white hover:bg-slate-700">{assignment.checkedInAt ? "Check out" : "Check in"}</button>
                  </form>
                ) : null}
                {!assignment.checkedOutAt && booking?.status !== "ASSIGNED" && !assignment.checkedInAt ? (
                  <p className="mt-3 text-xs text-amber-800">Waiting for administrator assignment confirmation.</p>
                ) : null}

                <div className="mt-4 border-t border-slate-200 pt-3">
                  <h4 className="text-sm font-semibold text-slate-800">Service messages</h4>
                  <div className="mt-2 max-h-36 space-y-2 overflow-y-auto">
                    {conversation.map((message) => (
                      <p key={message.id} className="rounded-lg bg-white p-2 text-sm text-slate-700">
                        <span className="block text-[10px] text-slate-400">{new Date(message.createdAt).toLocaleString("en-GB", { timeZone: "Europe/London" })}</span>
                        {message.body}
                      </p>
                    ))}
                    {conversation.length === 0 ? <p className="text-xs text-slate-500">No messages yet.</p> : null}
                  </div>
                  <form action={sendServiceMessageAction} className="mt-2 flex gap-2">
                    <input type="hidden" name="bookingId" value={assignment.bookingId} />
                    <label htmlFor={`message-${assignment.id}`} className="sr-only">Message about this service</label>
                    <input id={`message-${assignment.id}`} name="body" maxLength={2000} required placeholder="Write a service message" className="min-w-0 flex-1 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm" />
                    <button className="rounded-lg bg-emerald-600 px-3 py-2 text-xs font-semibold text-white">Send</button>
                  </form>
                </div>
              </article>
            );
          })}
          {summary.assignments.length === 0 ? <p className="text-sm text-slate-500">No confirmed assignments yet.</p> : null}
        </div>
      </section>

      <div className="mt-8 grid gap-6 xl:grid-cols-2">
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900">Job checklist and photo evidence</h2>
          {checklistEligibleAssignments.length > 0 ? (
            <form action={submitChecklistAction} className="mt-4 space-y-4">
              <div>
                <label htmlFor="checklistBookingId" className="mb-1 block text-sm font-medium text-slate-700">Completed service</label>
                <select id="checklistBookingId" name="bookingId" required className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2.5 text-slate-900">
                  {checklistEligibleAssignments.map((assignment) => {
                    const booking = bookings.get(assignment.bookingId);
                    return <option key={assignment.id} value={assignment.bookingId}>{properties.get(booking?.propertyId ?? "")?.name ?? "Property"} · {booking?.preferredDate}</option>;
                  })}
                </select>
              </div>
              <div>
                <label htmlFor="jobCompleted" className="mb-1 block text-sm font-medium text-slate-700">Job status</label>
                <select id="jobCompleted" name="jobCompleted" defaultValue="true" className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2.5 text-slate-900">
                  <option value="true">Completed successfully</option>
                  <option value="false">Incomplete / follow-up required</option>
                </select>
              </div>
              <div>
                <label htmlFor="evidence" className="mb-1 block text-sm font-medium text-slate-700">Photos (JPEG, PNG or WebP; up to five, 5 MB each)</label>
                <input id="evidence" name="evidence" type="file" accept="image/jpeg,image/png,image/webp" multiple className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2.5 text-sm text-slate-700" />
              </div>
              <div>
                <label htmlFor="notes" className="mb-1 block text-sm font-medium text-slate-700">Checklist notes</label>
                <textarea id="notes" name="notes" rows={4} maxLength={800} placeholder="Tasks completed, exceptions and follow-up actions." className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2.5 text-slate-900" />
              </div>
              <button className="rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-700">Submit for administrator review</button>
            </form>
          ) : (
            <p className="mt-3 text-sm text-slate-500">Check out of an assigned service to submit its checklist and evidence.</p>
          )}
        </section>

        <div className="space-y-6">
          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-900">Submit overtime</h2>
            <form action={submitOvertimeAction} className="mt-4 space-y-4">
              <div>
                <label htmlFor="overtimeBookingId" className="mb-1 block text-sm font-medium text-slate-700">Related service</label>
                <select id="overtimeBookingId" name="bookingId" defaultValue="" required className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2.5 text-slate-900">
                  <option value="" disabled>Select a service</option>
                  {summary.assignments.map((assignment) => {
                    const booking = bookings.get(assignment.bookingId);
                    return <option key={assignment.id} value={assignment.bookingId}>{properties.get(booking?.propertyId ?? "")?.name ?? "Property"} · {booking?.preferredDate}</option>;
                  })}
                </select>
              </div>
              <div>
                <label htmlFor="overtimeDate" className="mb-1 block text-sm font-medium text-slate-700">Date</label>
                <input id="overtimeDate" name="date" type="date" required className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2.5 text-slate-900" />
              </div>
              <div>
                <label htmlFor="additionalMinutes" className="mb-1 block text-sm font-medium text-slate-700">Additional minutes</label>
                <input id="additionalMinutes" name="additionalMinutes" type="number" min={15} defaultValue={30} required className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2.5 text-slate-900" />
              </div>
              <div>
                <label htmlFor="reason" className="mb-1 block text-sm font-medium text-slate-700">Reason</label>
                <input id="reason" name="reason" type="text" required placeholder="Reason for overtime" className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2.5 text-slate-900" />
              </div>
              <div>
                <label htmlFor="description" className="mb-1 block text-sm font-medium text-slate-700">Work carried out</label>
                <textarea id="description" name="description" rows={3} required placeholder="Describe the additional work." className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2.5 text-slate-900" />
              </div>
              <button className="rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-500">Request overtime</button>
            </form>
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-900">Report incident</h2>
            <form action={reportIncidentAction} className="mt-4 space-y-4">
              <div>
                <label htmlFor="incidentBookingId" className="mb-1 block text-sm font-medium text-slate-700">Related service</label>
                <select id="incidentBookingId" name="bookingId" defaultValue="" required className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2.5 text-slate-900">
                  <option value="" disabled>Select a service</option>
                  {summary.assignments.map((assignment) => <option key={assignment.id} value={assignment.bookingId}>{properties.get(bookings.get(assignment.bookingId)?.propertyId ?? "")?.name ?? "Property"}</option>)}
                </select>
              </div>
              <div>
                <label htmlFor="severity" className="mb-1 block text-sm font-medium text-slate-700">Severity</label>
                <select id="severity" name="severity" defaultValue="MEDIUM" className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2.5 text-slate-900">
                  <option value="LOW">Low</option><option value="MEDIUM">Medium</option><option value="HIGH">High</option><option value="CRITICAL">Critical</option>
                </select>
              </div>
              <div>
                <label htmlFor="title" className="mb-1 block text-sm font-medium text-slate-700">Title</label>
                <input id="title" name="title" required minLength={3} placeholder="Issue summary" className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2.5 text-slate-900" />
              </div>
              <div>
                <label htmlFor="incidentDescription" className="mb-1 block text-sm font-medium text-slate-700">Description</label>
                <textarea id="incidentDescription" name="description" rows={3} required minLength={10} placeholder="Describe what happened and what was affected." className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2.5 text-slate-900" />
              </div>
              <button className="rounded-xl bg-rose-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-rose-500">Raise incident</button>
            </form>
          </section>
        </div>
      </div>
    </AppShell>
  );
}
