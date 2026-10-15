export const dynamic = "force-dynamic";

import Link from "next/link";

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

export default async function DashboardPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const [summary, allUsers] = await Promise.all([getDashboardSummary(user), getAllUsers()]);

  return (
    <AppShell
      user={user}
      title={user.role === "ADMIN" ? "Operations overview" : user.role === "CLIENT" ? "Client dashboard" : "Cleaner dashboard"}
      subtitle="Monitor upcoming work, approval queues, service status and important notifications."
    >
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {[
          ["Bookings", summary.metrics.bookingsByStatus.PENDING + summary.metrics.bookingsByStatus.APPROVED, "Across all active bookings"],
          ["Properties", summary.metrics.totalProperties, "Managed properties"],
          ["Upcoming", summary.metrics.upcoming, "Services on the calendar"],
          ["Notifications", summary.metrics.notifications, "Unread messages"],
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
            <h2 className="text-lg font-semibold text-slate-900">Recent bookings</h2>
            <Link href="/admin" className="text-sm font-medium text-emerald-700">View all</Link>
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
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900">Team</h2>
          <div className="mt-4 space-y-3">
            {allUsers.slice(0, 5).map((member) => (
              <div key={member.id} className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
                <div>
                  <div className="text-sm font-medium text-slate-800">{member.name}</div>
                  <div className="text-[11px] uppercase tracking-[0.2em] text-slate-500">{member.role}</div>
                </div>
                <Link href="/dashboard" className="text-xs font-medium text-emerald-700">Profile</Link>
              </div>
            ))}
          </div>
        </div>
      </div>
    </AppShell>
  );
}
