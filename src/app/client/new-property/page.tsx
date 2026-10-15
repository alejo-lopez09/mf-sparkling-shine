export const dynamic = "force-dynamic";

import { redirect } from "next/navigation";

import { createPropertyAction } from "@/app/actions";
import { AppShell } from "@/components/app-shell";
import { getCurrentUser } from "@/lib/session";

export default async function NewPropertyPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.role !== "CLIENT") redirect("/dashboard");

  return (
    <AppShell
      user={user}
      title="Register a new property"
      subtitle="Add a managed site so you can schedule cleaning jobs, access notes and service preferences."
    >
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <form action={createPropertyAction} className="grid gap-5 md:grid-cols-2">
          <div className="md:col-span-2">
            <label htmlFor="name" className="mb-1 block text-sm font-medium text-slate-700">Property name</label>
            <input id="name" name="name" type="text" placeholder="Example: Harlow Family Home" className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2.5 text-slate-900 outline-none transition focus:border-emerald-500" required />
          </div>

          <div className="md:col-span-2">
            <label htmlFor="address" className="mb-1 block text-sm font-medium text-slate-700">Address</label>
            <textarea id="address" name="address" rows={3} placeholder="Street, city, building name" className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2.5 text-slate-900 outline-none transition focus:border-emerald-500" required />
          </div>

          <div>
            <label htmlFor="postcode" className="mb-1 block text-sm font-medium text-slate-700">Postcode</label>
            <input id="postcode" name="postcode" type="text" placeholder="CM20 2AB" className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2.5 text-slate-900 outline-none transition focus:border-emerald-500" required />
          </div>

          <div>
            <label htmlFor="specialRequirements" className="mb-1 block text-sm font-medium text-slate-700">Special requirements</label>
            <input id="specialRequirements" name="specialRequirements" type="text" placeholder="Pet-safe products, allergies, room restrictions" className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2.5 text-slate-900 outline-none transition focus:border-emerald-500" />
          </div>

          <div className="md:col-span-2">
            <label htmlFor="accessInstructions" className="mb-1 block text-sm font-medium text-slate-700">Access instructions</label>
            <textarea id="accessInstructions" name="accessInstructions" rows={3} placeholder="Keys, alarm codes, entry times, security instructions" className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2.5 text-slate-900 outline-none transition focus:border-emerald-500" />
          </div>

          <div className="md:col-span-2 flex gap-3">
            <button type="submit" className="rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-700">
              Save property
            </button>
            <a href="/client" className="rounded-xl border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:border-slate-400">
              Back to client portal
            </a>
          </div>
        </form>
      </div>
    </AppShell>
  );
}
