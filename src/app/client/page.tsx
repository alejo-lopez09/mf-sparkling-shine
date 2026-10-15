export const dynamic = "force-dynamic";

import Link from "next/link";

import { AppShell } from "@/components/app-shell";
import { getDashboardSummary, getPropertiesForUser } from "@/lib/data";
import { getCurrentUser } from "@/lib/session";
import { redirect } from "next/navigation";

export default async function ClientPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.role !== "CLIENT") redirect("/dashboard");

  const [summary, properties] = await Promise.all([getDashboardSummary(user), getPropertiesForUser(user.id)]);

  return (
    <AppShell user={user} title="Client portal" subtitle="Manage properties, service requests and upcoming bookings.">
      <div className="grid gap-4 md:grid-cols-3">
        {[
          ["Upcoming", summary.bookings.length, "Active services"],
          ["Properties", properties.length, "Registered properties"],
          ["Unread", summary.notifications.filter((item) => !item.read).length, "Service notifications"],
        ].map(([label, value, hint]) => (
          <div key={label} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm text-slate-500">{label}</p>
            <p className="mt-2 text-3xl font-semibold text-slate-900">{String(value)}</p>
            <p className="mt-2 text-xs text-slate-500">{hint}</p>
          </div>
        ))}
      </div>

      <div className="mt-8 grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-slate-900">Bookings</h2>
            <Link href="/client/new-booking" className="rounded-lg bg-emerald-600 px-3 py-2 text-xs font-semibold text-white hover:bg-emerald-500">New booking</Link>
          </div>
          <div className="space-y-3">
            {summary.bookings.map((booking) => (
              <div key={booking.id} className="flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                <div>
                  <div className="font-medium text-slate-800">{booking.serviceType} cleaning</div>
                  <div className="text-xs text-slate-500">{booking.preferredDate} · {booking.preferredWindow}</div>
                </div>
                <span className="rounded-full border border-slate-200 bg-white px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-700">{booking.status}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center justify-between gap-3">
            <h2 className="text-lg font-semibold text-slate-900">Properties</h2>
            <Link href="/client/new-property" className="rounded-lg border border-slate-200 bg-slate-900 px-3 py-2 text-xs font-semibold text-white hover:bg-slate-700">Add property</Link>
          </div>
          <div className="mt-4 space-y-3">
            {properties.map((property) => (
              <div key={property.id} className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-3">
                <div className="font-medium text-slate-800">{property.name}</div>
                <div className="text-sm text-slate-600">{property.address}</div>
                <div className="mt-2 text-xs uppercase tracking-[0.2em] text-slate-500">{property.postcode}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </AppShell>
  );
}
