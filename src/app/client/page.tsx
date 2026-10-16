export const dynamic = "force-dynamic";

import Link from "next/link";
import { sendServiceMessageAction, submitServiceReviewAction } from "@/app/actions";
import { AppShell } from "@/components/app-shell";
import { getDashboardSummary, getPropertiesForUser } from "@/lib/data";
import { getCurrentUser } from "@/lib/session";
import { redirect } from "next/navigation";

export default async function ClientPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string | string[] }>;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.role !== "CLIENT") redirect("/dashboard");

  const [summary, properties, params] = await Promise.all([getDashboardSummary(user), getPropertiesForUser(user.id), searchParams]);
  const error = Array.isArray(params.error) ? params.error[0] : params.error;
  const propertyMap = new Map(properties.map((property) => [property.id, property]));
  const reviewedBookings = new Set(summary.serviceReviews.map((review) => review.bookingId));
  const completedChecklists = summary.checklistSubmissions.filter((item) => item.status === "APPROVED");

  return (
    <AppShell user={user} title="Client portal" subtitle="Manage properties, track your service and communicate with the cleaning team.">
      {error ? <p role="alert" className="mb-6 rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-800">{error}</p> : null}
      <div className="grid gap-4 md:grid-cols-3">
        {[
          ["Services", summary.bookings.length, "Requests and completed visits"],
          ["Properties", properties.length, "Registered locations"],
          ["Unread", summary.notifications.filter((item) => !item.read).length, "Service notifications"],
        ].map(([label, value, hint]) => (
          <div key={label} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm text-slate-500">{label}</p><p className="mt-2 text-3xl font-semibold text-slate-900">{value}</p><p className="mt-2 text-xs text-slate-500">{hint}</p>
          </div>
        ))}
      </div>

      <section className="mt-8 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div><h2 className="text-lg font-semibold text-slate-900">Service history</h2><p className="text-sm text-slate-500">Status, conversation, evidence and feedback for each booking.</p></div>
          <Link href="/client/new-booking" className="rounded-lg bg-emerald-600 px-3 py-2 text-xs font-semibold text-white hover:bg-emerald-500">New booking</Link>
        </div>
        <div className="space-y-5">
          {summary.bookings.map((booking) => {
            const property = propertyMap.get(booking.propertyId);
            const messages = summary.serviceMessages.filter((message) => message.bookingId === booking.id).slice().reverse();
            const checklists = completedChecklists.filter((checklist) => checklist.bookingId === booking.id);
            const review = summary.serviceReviews.find((item) => item.bookingId === booking.id);
            return (
              <article key={booking.id} className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h3 className="font-semibold text-slate-900">{booking.serviceType.replace("_", " ")} · {property?.name ?? "Property"}</h3>
                    <p className="text-sm text-slate-600">{property?.address} {property?.postcode}</p>
                    <p className="mt-1 text-xs text-slate-500">{booking.preferredDate} · {booking.preferredWindow} · {booking.frequency.replace("_", " ")}</p>
                    {booking.instructions ? <p className="mt-2 text-sm text-slate-600">{booking.instructions}</p> : null}
                  </div>
                  <span className="rounded-full border border-slate-300 bg-white px-3 py-1 text-xs font-semibold uppercase text-slate-700">{booking.status.replace(/_/g, " ")}</span>
                </div>

                {checklists.map((checklist) => (
                  <div key={checklist.id} className="mt-4 rounded-lg border border-emerald-200 bg-emerald-50 p-3">
                    <p className="text-sm font-semibold text-emerald-900">Work approved by the administrator</p>
                    {checklist.notes ? <p className="mt-1 whitespace-pre-wrap text-sm text-emerald-900">{checklist.notes}</p> : null}
                    <div className="mt-2 flex flex-wrap gap-3">
                      {checklist.evidenceFiles.map((filename) => <a key={filename} href={`/api/evidence/${filename}`} target="_blank" rel="noreferrer" className="text-sm font-medium text-emerald-800 underline">View service photo</a>)}
                    </div>
                  </div>
                ))}

                <div className="mt-4 border-t border-slate-200 pt-4">
                  <h4 className="text-sm font-semibold text-slate-800">Service conversation</h4>
                  <div className="mt-2 max-h-48 space-y-2 overflow-y-auto">
                    {messages.map((message) => (
                      <p key={message.id} className="rounded-lg bg-white p-2 text-sm text-slate-700">
                        <span className="mb-1 block text-[10px] text-slate-400">{new Date(message.createdAt).toLocaleString("en-GB", { timeZone: "Europe/London" })}</span>{message.body}
                      </p>
                    ))}
                    {messages.length === 0 ? <p className="text-xs text-slate-500">No messages yet. Use this secure thread to contact the team.</p> : null}
                  </div>
                  <form action={sendServiceMessageAction} className="mt-3 flex gap-2">
                    <input type="hidden" name="bookingId" value={booking.id} />
                    <label htmlFor={`message-${booking.id}`} className="sr-only">Message about this service</label>
                    <input id={`message-${booking.id}`} name="body" maxLength={2000} required placeholder="Write a service message" className="min-w-0 flex-1 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm" />
                    <button className="rounded-lg bg-slate-900 px-3 py-2 text-xs font-semibold text-white">Send</button>
                  </form>
                </div>

                {booking.status === "COMPLETED" && !reviewedBookings.has(booking.id) ? (
                  <form action={submitServiceReviewAction} className="mt-4 grid gap-3 border-t border-slate-200 pt-4 sm:grid-cols-3">
                    <input type="hidden" name="bookingId" value={booking.id} />
                    {(["quality", "punctuality", "communication"] as const).map((aspect) => (
                      <div key={aspect}>
                        <label htmlFor={`${aspect}-${booking.id}`} className="mb-1 block text-xs font-medium capitalize text-slate-700">{aspect} (1–5)</label>
                        <select id={`${aspect}-${booking.id}`} name={aspect} required defaultValue="5" className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm">
                          {[5, 4, 3, 2, 1].map((value) => <option key={value} value={value}>{value}</option>)}
                        </select>
                      </div>
                    ))}
                    <div className="sm:col-span-3">
                      <label htmlFor={`comment-${booking.id}`} className="mb-1 block text-xs font-medium text-slate-700">Optional comment</label>
                      <textarea id={`comment-${booking.id}`} name="comment" maxLength={1000} rows={2} className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm" />
                    </div>
                    <button className="w-fit rounded-lg bg-emerald-600 px-4 py-2 text-xs font-semibold text-white hover:bg-emerald-500">Submit service rating</button>
                  </form>
                ) : null}
                {review ? <p className="mt-4 border-t border-slate-200 pt-3 text-sm text-slate-700">Your rating: quality {review.quality}/5 · punctuality {review.punctuality}/5 · communication {review.communication}/5{review.comment ? ` · “${review.comment}”` : ""}</p> : null}
                {booking.status === "REQUIRES_CORRECTIVE_WORK" ? <p className="mt-3 text-sm font-medium text-rose-700">The service has been flagged for corrective follow-up. Please message the team here.</p> : null}
              </article>
            );
          })}
          {summary.bookings.length === 0 ? <p className="text-sm text-slate-500">You have no service requests yet.</p> : null}
        </div>
      </section>

      <section className="mt-8 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div><h2 className="text-lg font-semibold text-slate-900">Properties</h2><p className="text-sm text-slate-500">Your saved cleaning locations.</p></div>
          <Link href="/client/new-property" className="rounded-lg bg-slate-900 px-3 py-2 text-xs font-semibold text-white hover:bg-slate-700">Add property</Link>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          {properties.map((property) => (
            <div key={property.id} className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-3">
              <div className="font-medium text-slate-800">{property.name}</div><div className="text-sm text-slate-600">{property.address}</div><div className="mt-1 text-xs uppercase tracking-[0.2em] text-slate-500">{property.postcode}</div>
            </div>
          ))}
          {properties.length === 0 ? <p className="text-sm text-slate-500">Add a property before requesting a cleaning.</p> : null}
        </div>
      </section>
    </AppShell>
  );
}
