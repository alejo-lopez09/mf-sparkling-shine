export const dynamic = "force-dynamic";

import Link from "next/link";

import { markNotificationReadAction } from "@/app/actions";
import { AppShell } from "@/components/app-shell";
import { getDashboardSummary, getAllUsers } from "@/lib/data";
import { getCurrentUser } from "@/lib/session";
import { redirect } from "next/navigation";

function StatusBadge({ status }: { status: string }) {
  const palette: Record<string, string> = {
    PENDING: "bg-amber-100 text-amber-800 border-amber-200",
    APPROVED: "bg-emerald-100 text-emerald-800 border-emerald-200",
    ASSIGNED: "bg-blue-100 text-blue-800 border-blue-200",
    COMPLETED: "bg-slate-800 text-white border-slate-800",
    REJECTED: "bg-rose-100 text-rose-800 border-rose-200",
    CONFIRMED: "bg-cyan-100 text-cyan-800 border-cyan-200",
    SUBMITTED: "bg-violet-100 text-violet-800 border-violet-200",
    PENDING_APPROVAL: "bg-amber-100 text-amber-800 border-amber-200",
  };

  return <span className={`inline-flex rounded-full border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] ${palette[status] ?? "bg-slate-100 text-slate-700 border-slate-200"}`}>{status.replace(/_/g, " ")}</span>;
}

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string | string[] }>;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const [summary, allUsers, params] = await Promise.all([
    getDashboardSummary(user),
    user.role === "ADMIN" ? getAllUsers() : Promise.resolve([]),
    searchParams,
  ]);
  const error = Array.isArray(params.error) ? params.error[0] : params.error;
  const viewAllHref = user.role === "ADMIN" ? "/admin" : user.role === "CLIENT" ? "/client" : "/cleaner";
  const viewAllLabel = user.role === "CLEANER" ? "View my services" : "View all";

  return (
    <AppShell
      user={user}
      title={user.role === "ADMIN" ? "Operations overview" : user.role === "CLIENT" ? "Client dashboard" : "Cleaner dashboard"}
      subtitle={user.role === "ADMIN"
        ? "Review requests, monitor services and keep track of team notifications."
        : user.role === "CLIENT"
          ? "Track your cleaning requests, service updates and messages."
          : "See your assigned services, work updates and notifications."}
    >
      {error ? <p role="alert" className="mb-6 rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-800">{error}</p> : null}
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {[
          ["Open requests", summary.metrics.bookingsByStatus.PENDING + summary.metrics.bookingsByStatus.APPROVED, user.role === "ADMIN" ? "Awaiting approval or assignment" : "Awaiting confirmation"],
          ["Properties", summary.metrics.totalProperties, user.role === "CLEANER" ? "Assigned locations" : user.role === "CLIENT" ? "Your registered locations" : "Managed properties"],
          ["Upcoming", summary.metrics.upcoming, "Services on the calendar"],
          ["Notifications", summary.metrics.notifications, "Unread updates"],
        ].map(([label, value, hint]) => (
          <div key={label} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm font-medium text-slate-500">{label}</p>
            <p className="mt-2 text-3xl font-semibold text-slate-900">{String(value)}</p>
            <p className="mt-2 text-xs text-slate-500">{hint}</p>
          </div>
        ))}
      </div>

      <div className="mt-8 grid gap-6 xl:grid-cols-[1.3fr_0.7fr]">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-slate-900">{user.role === "CLEANER" ? "Assigned services" : user.role === "CLIENT" ? "My services" : "Recent bookings"}</h2>
            <Link href={viewAllHref} className="text-sm font-medium text-emerald-700">{viewAllLabel}</Link>
          </div>
          <div className="space-y-3">
            {summary.bookings.slice(0, 4).map((booking) => (
              <div key={booking.id} className="flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                <div>
                  <div className="font-medium text-slate-800">{booking.serviceType} cleaning</div>
                  <div className="text-xs text-slate-500">{booking.preferredDate} · {booking.preferredWindow}</div>
                </div>
                <StatusBadge status={booking.status} />
              </div>
            ))}
            {summary.bookings.length === 0 ? <p className="text-sm text-slate-500">No services to show yet.</p> : null}
          </div>
        </div>

        {user.role === "ADMIN" ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-slate-900">Team</h2>
              <Link href="/admin" className="text-sm font-medium text-emerald-700">Manage staff</Link>
            </div>
            <div className="mt-4 space-y-3">
              {allUsers.filter((member) => member.role !== "CLIENT").slice(0, 5).map((member) => (
                <div key={member.id} className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
                  <div className="text-sm font-medium text-slate-800">{member.name}</div>
                  <div className="text-[11px] uppercase tracking-[0.2em] text-slate-500">{member.role}{member.active ? "" : " · INACTIVE"}</div>
                </div>
              ))}
            </div>
          </div>
        ) : null}
      </div>

      <section className="mt-8 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">Notifications</h2>
            <p className="text-sm text-slate-500">{summary.metrics.notifications} unread</p>
          </div>
        </div>
        <div className="mt-4 space-y-3">
          {summary.notifications.slice(0, 8).map((notification) => {
            const href = notification.destination.startsWith("/") && !notification.destination.startsWith("//")
              ? notification.destination
              : viewAllHref;
            return (
              <article key={notification.id} className="flex flex-wrap items-start justify-between gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-sm font-semibold text-slate-800">{notification.title}</h3>
                    {!notification.read ? <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold uppercase text-emerald-800">Unread</span> : null}
                  </div>
                  <p className="mt-1 text-sm text-slate-600">{notification.message}</p>
                  <time dateTime={notification.createdAt} className="mt-1 block text-xs text-slate-500">
                    {new Date(notification.createdAt).toLocaleString("en-GB", { timeZone: "Europe/London" })}
                  </time>
                  <Link href={href} className="mt-2 inline-block text-xs font-semibold text-emerald-700 underline">Open related page</Link>
                </div>
                {!notification.read ? (
                  <form action={markNotificationReadAction}>
                    <input type="hidden" name="notificationId" value={notification.id} />
                    <button className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:border-slate-400">Mark as read</button>
                  </form>
                ) : null}
              </article>
            );
          })}
          {summary.notifications.length === 0 ? <p className="text-sm text-slate-500">You are all caught up.</p> : null}
        </div>
      </section>
    </AppShell>
  );
}
