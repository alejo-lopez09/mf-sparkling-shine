export const dynamic = "force-dynamic";

import { redirect } from "next/navigation";

import { createBookingAction } from "@/app/actions";
import { AppShell } from "@/components/app-shell";
import { getPropertiesForUser } from "@/lib/data";
import { getCurrentUser } from "@/lib/session";

export default async function NewBookingPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.role !== "CLIENT") redirect("/dashboard");

  const properties = await getPropertiesForUser(user.id);

  return (
    <AppShell user={user} title="Create a booking request" subtitle="Submit a service request with dates, window, property information and cleaning instructions.">
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <form action={createBookingAction} className="grid gap-5 md:grid-cols-2">
          <div className="md:col-span-2">
            <label htmlFor="propertyId" className="mb-1 block text-sm font-medium text-slate-700">Property</label>
            <select id="propertyId" name="propertyId" className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2.5 text-slate-900 outline-none transition focus:border-emerald-500" required>
              {properties.map((property) => (
                <option key={property.id} value={property.id}>{property.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="serviceType" className="mb-1 block text-sm font-medium text-slate-700">Service type</label>
            <select id="serviceType" name="serviceType" defaultValue="DOMESTIC" className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2.5 text-slate-900 outline-none transition focus:border-emerald-500">
              <option value="DOMESTIC">Domestic</option>
              <option value="DEEP">Deep clean</option>
              <option value="OFFICE">Office</option>
              <option value="MOVE_IN">Move-in / end of tenancy</option>
            </select>
          </div>

          <div>
            <label htmlFor="frequency" className="mb-1 block text-sm font-medium text-slate-700">Frequency</label>
            <select id="frequency" name="frequency" defaultValue="ONE_OFF" className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2.5 text-slate-900 outline-none transition focus:border-emerald-500">
              <option value="ONE_OFF">One-off</option>
              <option value="WEEKLY">Weekly</option>
              <option value="FORTNIGHTLY">Fortnightly</option>
              <option value="MONTHLY">Monthly</option>
            </select>
          </div>

          <div>
            <label htmlFor="preferredDate" className="mb-1 block text-sm font-medium text-slate-700">Preferred date</label>
            <input id="preferredDate" name="preferredDate" type="date" className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2.5 text-slate-900 outline-none transition focus:border-emerald-500" required />
          </div>

          <div>
            <label htmlFor="preferredWindow" className="mb-1 block text-sm font-medium text-slate-700">Preferred time window</label>
            <select id="preferredWindow" name="preferredWindow" defaultValue="09:00-11:00" className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2.5 text-slate-900 outline-none transition focus:border-emerald-500">
              <option value="09:00-11:00">09:00 - 11:00</option>
              <option value="11:00-13:00">11:00 - 13:00</option>
              <option value="14:00-16:00">14:00 - 16:00</option>
              <option value="18:00-20:00">18:00 - 20:00</option>
            </select>
          </div>

          <div className="md:col-span-2">
            <label htmlFor="instructions" className="mb-1 block text-sm font-medium text-slate-700">Instructions</label>
            <textarea id="instructions" name="instructions" rows={4} placeholder="Entry instructions, access details, pet notes, key location or special requirements." className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2.5 text-slate-900 outline-none transition focus:border-emerald-500" />
          </div>

          <div className="md:col-span-2">
            <label htmlFor="notes" className="mb-1 block text-sm font-medium text-slate-700">Admin notes</label>
            <textarea id="notes" name="notes" rows={3} className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2.5 text-slate-900 outline-none transition focus:border-emerald-500" />
          </div>

          <div className="md:col-span-2">
            <button type="submit" className="rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-700">
              Submit booking request
            </button>
          </div>
        </form>
      </div>
    </AppShell>
  );
}
