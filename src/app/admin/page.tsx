export const dynamic = "force-dynamic";

import Link from "next/link";

import { approveBookingAction, approveOvertimeAction, assignCleanerAction } from "@/app/actions";
import { AppShell } from "@/components/app-shell";
import { getAllUsers, getBookingsForAdmin, getDashboardSummary } from "@/lib/data";
import { requireRole } from "@/lib/session";

export default async function AdminPage() {
  const user = await requireRole("ADMIN");
  const [summary, bookings, users] = await Promise.all([getDashboardSummary(user), getBookingsForAdmin(), getAllUsers()]);

  return (
    <AppShell user={user} title="Administrator panel" subtitle="Review bookings, assign cleaners, approve overtime and supervise operations.">
      <div className="grid gap-4 md:grid-cols-3">
        {[
          ["Pending reviews", summary.metrics.bookingsByStatus.PENDING, "Booking approvals"],
          ["Services today", 5, "Live schedule"],
          ["Overtime awaiting approval", summary.overtimeRequests.filter((item) => item.status === "PENDING_APPROVAL").length, "Approval queue"],
        ].map(([label, value, hint]) => (
          <div key={label} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm text-slate-500">{label}</p>
            <p className="mt-2 text-3xl font-semibold text-slate-900">{String(value)}</p>
            <p className="mt-2 text-xs text-slate-500">{hint}</p>
          </div>
        ))}
      </div>

      <div className="mt-8 grid gap-6 xl:grid-cols-[1.4fr_0.6fr]">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900">Booking approvals</h2>
          <div className="mt-4 space-y-4">
            {bookings.map((booking) => (
              <div key={booking.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="font-medium text-slate-800">{booking.serviceType} service</p>
                    <p className="text-xs text-slate-500">{booking.preferredDate} · {booking.preferredWindow}</p>
                  </div>
                  <span className="rounded-full border border-amber-200 bg-amber-100 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-amber-800">{booking.status}</span>
                </div>
                <div className="mt-4 flex flex-wrap gap-3">
                  <form action={approveBookingAction} className="inline-flex">
                    <input type="hidden" name="bookingId" value={booking.id} />
                    <input type="hidden" name="status" value="APPROVED" />
                    <button className="rounded-lg bg-emerald-600 px-3 py-2 text-xs font-semibold text-white hover:bg-emerald-500">Approve</button>
                  </form>
                  <form action={approveBookingAction} className="inline-flex">
                    <input type="hidden" name="bookingId" value={booking.id} />
                    <input type="hidden" name="status" value="REJECTED" />
                    <button className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:border-slate-400">Reject</button>
                  </form>
                  <form action={assignCleanerAction} className="inline-flex">
                    <input type="hidden" name="bookingId" value={booking.id} />
                    <input type="hidden" name="cleanerId" value="u-cleaner" />
                    <button className="rounded-lg bg-slate-900 px-3 py-2 text-xs font-semibold text-white hover:bg-slate-700">Assign cleaner</button>
                  </form>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900">Team</h2>
          <div className="mt-4 space-y-3">
            {users.map((member) => (
              <div key={member.id} className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
                <div className="font-medium text-slate-800">{member.name}</div>
                <div className="text-[11px] uppercase tracking-[0.22em] text-slate-500">{member.role}</div>
              </div>
            ))}
          </div>
          <div className="mt-6">
            <Link href="/dashboard" className="text-sm font-medium text-emerald-700">Open reporting workspace</Link>
          </div>
        </div>
      </div>

      <div className="mt-8 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-900">Overtime approvals</h2>
        <div className="mt-4 space-y-4">
          {summary.overtimeRequests.map((request) => (
            <div key={request.id} className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4 md:flex-row md:items-center md:justify-between">
              <div>
                <div className="font-medium text-slate-800">{request.reason}</div>
                <div className="text-xs text-slate-500">{request.date} · {request.additionalMinutes} minutes</div>
              </div>
              <div className="flex gap-2">
                <form action={approveOvertimeAction} className="inline-flex">
                  <input type="hidden" name="overtimeId" value={request.id} />
                  <input type="hidden" name="decision" value="APPROVED" />
                  <button className="rounded-lg bg-emerald-600 px-3 py-2 text-xs font-semibold text-white hover:bg-emerald-500">Approve</button>
                </form>
                <form action={approveOvertimeAction} className="inline-flex">
                  <input type="hidden" name="overtimeId" value={request.id} />
                  <input type="hidden" name="decision" value="REJECTED" />
                  <button className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:border-slate-400">Reject</button>
                </form>
              </div>
            </div>
          ))}
        </div>
      </div>
    </AppShell>
  );
}
