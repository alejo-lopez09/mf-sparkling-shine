export const dynamic = "force-dynamic";

import Link from "next/link";

import {
  approveBookingAction,
  approveOvertimeAction,
  assignCleanerAction,
  createStaffAccountAction,
  reviewChecklistAction,
  sendServiceMessageAction,
} from "@/app/actions";
import { AppShell } from "@/components/app-shell";
import { getAllUsers, getBookingsForAdmin, getDashboardSummary } from "@/lib/data";
import { requireRole } from "@/lib/session";

export default async function AdminPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string | string[]; success?: string | string[] }>;
}) {
  const user = await requireRole("ADMIN");
  const [summary, bookings, users, params] = await Promise.all([getDashboardSummary(user), getBookingsForAdmin(), getAllUsers(), searchParams]);
  const error = Array.isArray(params.error) ? params.error[0] : params.error;
  const success = Array.isArray(params.success) ? params.success[0] : params.success;
  const cleaners = users.filter((member) => member.role === "CLEANER");
  const userNames = new Map(users.map((member) => [member.id, member.name]));
  const properties = new Map(summary.properties.map((property) => [property.id, property]));
  const bookingMap = new Map(bookings.map((booking) => [booking.id, booking]));
  const pendingChecklists = summary.checklistSubmissions.filter((item) => item.status === "SUBMITTED");
  const pendingOvertime = summary.overtimeRequests.filter((item) => item.status === "SUBMITTED" || item.status === "PENDING_APPROVAL");
  const todayInUK = new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/London" }).format(new Date());

  return (
    <AppShell user={user} title="Administrator panel" subtitle="Review requests, assign staff, supervise services and export operating records.">
      {error ? <p role="alert" className="mb-6 rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-800">{error}</p> : null}
      {success ? <p role="status" className="mb-6 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">{success}</p> : null}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[
          ["Pending bookings", summary.metrics.bookingsByStatus.PENDING],
          ["Services today", bookings.filter((booking) => booking.preferredDate === todayInUK).length],
          ["Checklists to review", pendingChecklists.length],
          ["Overtime to review", pendingOvertime.length],
        ].map(([label, value]) => (
          <div key={label} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm text-slate-500">{label}</p>
            <p className="mt-2 text-3xl font-semibold text-slate-900">{value}</p>
          </div>
        ))}
      </div>

      <section className="mt-8 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">Bookings and assignments</h2>
            <p className="text-sm text-slate-500">Domestic and office services use the same tracked service workflow.</p>
          </div>
          <Link href="/admin/report.csv" className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-700">Download all services</Link>
        </div>
        <form action="/admin/report.csv" method="get" className="mt-4 grid gap-3 rounded-xl bg-slate-50 p-3 sm:grid-cols-2 xl:grid-cols-5">
          <div><label htmlFor="report-from" className="mb-1 block text-xs font-medium text-slate-700">From</label><input id="report-from" name="from" type="date" className="w-full rounded-lg border border-slate-300 bg-white px-2 py-2 text-sm" /></div>
          <div><label htmlFor="report-to" className="mb-1 block text-xs font-medium text-slate-700">To</label><input id="report-to" name="to" type="date" className="w-full rounded-lg border border-slate-300 bg-white px-2 py-2 text-sm" /></div>
          <div><label htmlFor="report-client" className="mb-1 block text-xs font-medium text-slate-700">Client</label><select id="report-client" name="clientId" defaultValue="" className="w-full rounded-lg border border-slate-300 bg-white px-2 py-2 text-sm"><option value="">All clients</option>{users.filter((member) => member.role === "CLIENT").map((client) => <option key={client.id} value={client.id}>{client.name}</option>)}</select></div>
          <div><label htmlFor="report-cleaner" className="mb-1 block text-xs font-medium text-slate-700">Cleaner</label><select id="report-cleaner" name="cleanerId" defaultValue="" className="w-full rounded-lg border border-slate-300 bg-white px-2 py-2 text-sm"><option value="">All cleaners</option>{cleaners.map((cleaner) => <option key={cleaner.id} value={cleaner.id}>{cleaner.name}</option>)}</select></div>
          <div><label htmlFor="report-address" className="mb-1 block text-xs font-medium text-slate-700">Address contains</label><input id="report-address" name="address" type="search" className="w-full rounded-lg border border-slate-300 bg-white px-2 py-2 text-sm" /></div>
          <button className="rounded-lg bg-emerald-600 px-3 py-2 text-sm font-semibold text-white hover:bg-emerald-500 sm:col-span-2 xl:col-span-5">Download filtered report</button>
        </form>
        <div className="mt-4 space-y-4">
          {bookings.map((booking) => {
            const property = properties.get(booking.propertyId);
            const assignment = summary.assignments.find((item) => item.bookingId === booking.id);
            return (
              <article key={booking.id} className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h3 className="font-semibold text-slate-900">{booking.serviceType} · {property?.name ?? "Property"}</h3>
                    <p className="text-sm text-slate-600">{property?.address} {property?.postcode}</p>
                    <p className="mt-1 text-xs text-slate-500">
                      Client: {userNames.get(booking.clientId) ?? "Unknown"} · {booking.preferredDate} · {booking.preferredWindow} · {booking.frequency.replace("_", " ")}
                    </p>
                    {booking.instructions ? <p className="mt-2 text-sm text-slate-600">{booking.instructions}</p> : null}
                  </div>
                  <span className="rounded-full border border-slate-300 bg-white px-3 py-1 text-xs font-semibold uppercase text-slate-700">{booking.status.replace(/_/g, " ")}</span>
                </div>
                {assignment ? (
                  <p className="mt-3 text-sm text-slate-600">
                    Cleaner: {userNames.get(assignment.cleanerId) ?? "Unknown"}
                    {assignment.checkedInAt ? ` · Checked in ${new Date(assignment.checkedInAt).toLocaleString("en-GB", { timeZone: "Europe/London" })}` : ""}
                    {assignment.checkedOutAt ? ` · Checked out ${new Date(assignment.checkedOutAt).toLocaleString("en-GB", { timeZone: "Europe/London" })}` : ""}
                  </p>
                ) : null}
                <div className="mt-4 flex flex-wrap items-center gap-2">
                  {booking.status === "PENDING" ? (
                    <>
                      <form action={approveBookingAction}>
                        <input type="hidden" name="bookingId" value={booking.id} />
                        <input type="hidden" name="status" value="APPROVED" />
                        <button className="rounded-lg bg-emerald-600 px-3 py-2 text-xs font-semibold text-white hover:bg-emerald-500">Approve</button>
                      </form>
                      <form action={approveBookingAction}>
                        <input type="hidden" name="bookingId" value={booking.id} />
                        <input type="hidden" name="status" value="REJECTED" />
                        <button className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:border-slate-400">Reject</button>
                      </form>
                    </>
                  ) : null}
                  {["PENDING", "APPROVED", "ASSIGNED"].includes(booking.status) && cleaners.length > 0 ? (
                    <form action={assignCleanerAction} className="flex flex-wrap items-center gap-2">
                      <input type="hidden" name="bookingId" value={booking.id} />
                      <label className="sr-only" htmlFor={`cleaner-${booking.id}`}>Choose cleaner for {booking.id}</label>
                      <select id={`cleaner-${booking.id}`} name="cleanerId" required defaultValue={assignment?.cleanerId ?? ""} className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs text-slate-800">
                        <option value="" disabled>Select cleaner</option>
                        {cleaners.map((cleaner) => <option key={cleaner.id} value={cleaner.id}>{cleaner.name}</option>)}
                      </select>
                      <button className="rounded-lg bg-slate-900 px-3 py-2 text-xs font-semibold text-white hover:bg-slate-700">{assignment && booking.status === "ASSIGNED" ? "Reassign" : "Confirm assignment"}</button>
                    </form>
                  ) : null}
                </div>
              </article>
            );
          })}
          {bookings.length === 0 ? <p className="text-sm text-slate-500">No bookings yet.</p> : null}
        </div>
      </section>

      <div className="mt-8 grid gap-6 xl:grid-cols-2">
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900">Checklist and evidence review</h2>
          <div className="mt-4 space-y-4">
            {pendingChecklists.map((checklist) => {
              const booking = checklist.bookingId ? bookingMap.get(checklist.bookingId) : undefined;
              const checkedOut = summary.assignments.some((assignment) => assignment.bookingId === checklist.bookingId
                && assignment.cleanerId === checklist.cleanerId && assignment.checkedOutAt);
              return (
                <article key={checklist.id} className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                  <p className="font-medium text-slate-800">{booking?.serviceType ?? "Service"} · {properties.get(booking?.propertyId ?? "")?.name ?? "Property"}</p>
                  <p className="text-sm text-slate-600">Cleaner: {userNames.get(checklist.cleanerId) ?? "Unknown"} · {checklist.jobCompleted ? "Reported complete" : "Follow-up requested"}</p>
                  <p className="mt-2 whitespace-pre-wrap text-sm text-slate-600">{checklist.notes || "No notes provided."}</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {checklist.evidenceFiles.map((filename) => (
                      <a key={filename} href={`/api/evidence/${filename}`} target="_blank" rel="noreferrer" className="text-sm font-medium text-emerald-700 underline">View photo</a>
                    ))}
                    {checklist.evidenceFiles.length === 0 ? <span className="text-sm text-slate-500">No photos attached.</span> : null}
                  </div>
                  {checkedOut ? (
                    <div className="mt-4 flex gap-2">
                      {(checklist.jobCompleted ? ["APPROVED", "REJECTED"] as const : ["REJECTED"] as const).map((decision) => (
                        <form action={reviewChecklistAction} key={decision}>
                          <input type="hidden" name="checklistId" value={checklist.id} />
                          <input type="hidden" name="decision" value={decision} />
                          <button className={`rounded-lg px-3 py-2 text-xs font-semibold text-white ${decision === "APPROVED" ? "bg-emerald-600 hover:bg-emerald-500" : "bg-rose-600 hover:bg-rose-500"}`}>
                            {decision === "APPROVED" ? "Approve work" : "Request corrective work"}
                          </button>
                        </form>
                      ))}
                    </div>
                  ) : <p className="mt-3 text-xs text-amber-800">The assigned cleaner must check out of the service before this work can be reviewed.</p>}
                </article>
              );
            })}
            {pendingChecklists.length === 0 ? <p className="text-sm text-slate-500">No checklists waiting for review.</p> : null}
          </div>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900">Overtime approvals</h2>
          <div className="mt-4 space-y-3">
            {pendingOvertime.map((request) => (
              <article key={request.id} className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                <p className="font-medium text-slate-800">{request.reason}</p>
                <p className="text-sm text-slate-600">
                  {request.date} · {request.additionalMinutes} minutes · {userNames.get(request.cleanerId) ?? "Cleaner"}
                  {request.bookingId ? ` · ${properties.get(bookingMap.get(request.bookingId)?.propertyId ?? "")?.name ?? "Service"}` : ""}
                </p>
                <p className="mt-1 text-sm text-slate-600">{request.description}</p>
                <div className="mt-3 flex gap-2">
                  {(["APPROVED", "REJECTED"] as const).map((decision) => (
                    <form action={approveOvertimeAction} key={decision}>
                      <input type="hidden" name="overtimeId" value={request.id} />
                      <input type="hidden" name="decision" value={decision} />
                      <button className={`rounded-lg px-3 py-2 text-xs font-semibold text-white ${decision === "APPROVED" ? "bg-emerald-600 hover:bg-emerald-500" : "bg-rose-600 hover:bg-rose-500"}`}>{decision === "APPROVED" ? "Approve" : "Reject"}</button>
                    </form>
                  ))}
                </div>
              </article>
            ))}
            {pendingOvertime.length === 0 ? <p className="text-sm text-slate-500">No overtime requests waiting for review.</p> : null}
          </div>
        </section>
      </div>

      <div className="mt-8 grid gap-6 xl:grid-cols-2">
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900">Service conversations</h2>
          <div className="mt-4 space-y-3">
            {summary.serviceMessages.slice(0, 20).map((message) => {
              const booking = bookingMap.get(message.bookingId);
              return (
                <article key={message.id} className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                  <p className="text-xs text-slate-500">{properties.get(booking?.propertyId ?? "")?.name ?? "Service"} · {userNames.get(message.senderId) ?? "Team member"} · {new Date(message.createdAt).toLocaleString("en-GB", { timeZone: "Europe/London" })}</p>
                  <p className="mt-1 whitespace-pre-wrap text-sm text-slate-700">{message.body}</p>
                  {booking ? (
                    <form action={sendServiceMessageAction} className="mt-3 flex gap-2">
                      <input type="hidden" name="bookingId" value={booking.id} />
                      <input name="body" required maxLength={2000} placeholder="Reply to this service" className="min-w-0 flex-1 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm" />
                      <button className="rounded-lg bg-slate-900 px-3 py-2 text-xs font-semibold text-white">Reply</button>
                    </form>
                  ) : null}
                </article>
              );
            })}
            {summary.serviceMessages.length === 0 ? <p className="text-sm text-slate-500">No service messages yet.</p> : null}
          </div>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900">Client ratings</h2>
          <div className="mt-4 space-y-3">
            {summary.serviceReviews.map((review) => (
              <article key={review.id} className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                <p className="font-medium text-slate-800">{properties.get(bookingMap.get(review.bookingId)?.propertyId ?? "")?.name ?? "Service"} · {userNames.get(review.cleanerId) ?? "Cleaner"}</p>
                <p className="text-sm text-slate-600">Quality {review.quality}/5 · Punctuality {review.punctuality}/5 · Communication {review.communication}/5</p>
                {review.comment ? <p className="mt-1 text-sm text-slate-600">{review.comment}</p> : null}
              </article>
            ))}
            {summary.serviceReviews.length === 0 ? <p className="text-sm text-slate-500">No ratings submitted yet.</p> : null}
          </div>
        </section>
      </div>

      <section className="mt-8 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div><h2 className="text-lg font-semibold text-slate-900">Team</h2><p className="text-sm text-slate-500">Create cleaner and administrator accounts for project staff.</p></div>
          <details className="w-full rounded-xl border border-slate-200 bg-slate-50 p-4 sm:max-w-xl">
            <summary className="cursor-pointer text-sm font-semibold text-slate-800">Add staff account</summary>
            <form action={createStaffAccountAction} className="mt-4 grid gap-3 sm:grid-cols-2">
              <div><label htmlFor="staff-name" className="mb-1 block text-xs font-medium text-slate-700">Full name</label><input id="staff-name" name="name" required minLength={2} className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm" /></div>
              <div><label htmlFor="staff-email" className="mb-1 block text-xs font-medium text-slate-700">Email</label><input id="staff-email" name="email" type="email" required className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm" /></div>
              <div><label htmlFor="staff-password" className="mb-1 block text-xs font-medium text-slate-700">Temporary password (8+ characters)</label><input id="staff-password" name="password" type="password" minLength={8} required className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm" /></div>
              <div><label htmlFor="staff-role" className="mb-1 block text-xs font-medium text-slate-700">Role</label><select id="staff-role" name="role" defaultValue="CLEANER" className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"><option value="CLEANER">Cleaner</option><option value="ADMIN">Administrator</option></select></div>
              <button className="rounded-lg bg-slate-900 px-3 py-2 text-xs font-semibold text-white hover:bg-slate-700 sm:col-span-2">Create account</button>
            </form>
          </details>
        </div>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {users.map((member) => (
            <div key={member.id} className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
              <div className="font-medium text-slate-800">{member.name}</div>
              <div className="text-[11px] uppercase tracking-[0.22em] text-slate-500">{member.role}</div>
            </div>
          ))}
        </div>
      </section>
    </AppShell>
  );
}
