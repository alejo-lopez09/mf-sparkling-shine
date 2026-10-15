export const dynamic = "force-dynamic";

import { AppShell } from "@/components/app-shell";
import { getDashboardSummary } from "@/lib/data";
import { getCurrentUser } from "@/lib/session";
import { redirect } from "next/navigation";

import { reportIncidentAction, submitChecklistAction, submitOvertimeAction } from "@/app/actions";

export default async function CleanerPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.role !== "CLEANER") redirect("/dashboard");

  const summary = await getDashboardSummary(user);

  return (
    <AppShell user={user} title="Cleaner workspace" subtitle="Track assignments, document completion, report incidents and submit overtime.">
      <div className="grid gap-4 md:grid-cols-4">
        {[
          ["Assigned jobs", summary.assignments.length, "Confirmed schedules"],
          ["Checklist review", summary.metrics.checklistPendingReview, "Awaiting approval"],
          ["Open incidents", summary.metrics.openIncidents, "Needs attention"],
          ["Overtime requests", summary.overtimeRequests.length, "Awaiting review"],
        ].map(([label, value, hint]) => (
          <div key={label} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm text-slate-500">{label}</p>
            <p className="mt-2 text-3xl font-semibold text-slate-900">{String(value)}</p>
            <p className="mt-2 text-xs text-slate-500">{hint}</p>
          </div>
        ))}
      </div>

      <div className="mt-8 grid gap-6 xl:grid-cols-2">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900">Working schedule</h2>
          <div className="mt-4 space-y-3">
            {summary.assignments.length > 0 ? summary.assignments.map((assignment) => (
              <div key={assignment.id} className="flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                <div>
                  <div className="font-medium text-slate-800">Assignment {assignment.id}</div>
                  <div className="text-xs text-slate-500">Status: {assignment.status}</div>
                </div>
                <span className="rounded-full border border-cyan-200 bg-cyan-100 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-cyan-800">Live</span>
              </div>
            )) : (
              <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-4 text-sm text-slate-500">No confirmed assignments yet.</div>
            )}
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900">Job checklist</h2>
          <form action={submitChecklistAction} className="mt-4 space-y-4">
            <div>
              <label htmlFor="bookingId" className="mb-1 block text-sm font-medium text-slate-700">Assignment reference</label>
              <input id="bookingId" name="bookingId" type="text" defaultValue={summary.assignments[0]?.bookingId ?? ""} className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2.5 text-slate-900" placeholder="Optional booking reference" />
            </div>
            <div>
              <label htmlFor="jobCompleted" className="mb-1 block text-sm font-medium text-slate-700">Job status</label>
              <select id="jobCompleted" name="jobCompleted" defaultValue="true" className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2.5 text-slate-900">
                <option value="true">Completed successfully</option>
                <option value="false">Incomplete / follow-up required</option>
              </select>
            </div>
            <div>
              <label htmlFor="photosUploaded" className="mb-1 block text-sm font-medium text-slate-700">Photos uploaded</label>
              <input id="photosUploaded" name="photosUploaded" type="number" min={0} max={20} defaultValue={0} className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2.5 text-slate-900" />
            </div>
            <div>
              <label htmlFor="notes" className="mb-1 block text-sm font-medium text-slate-700">Checklist notes</label>
              <textarea id="notes" name="notes" rows={4} placeholder="Describe completed tasks, exceptions and follow-up actions." className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2.5 text-slate-900" />
            </div>
            <button type="submit" className="rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-700">Submit checklist</button>
          </form>
        </div>
      </div>

      <div className="mt-8 grid gap-6 xl:grid-cols-2">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900">Submit overtime</h2>
          <form action={submitOvertimeAction} className="mt-4 space-y-4">
            <div>
              <label htmlFor="date" className="mb-1 block text-sm font-medium text-slate-700">Date</label>
              <input id="date" name="date" type="date" className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2.5 text-slate-900" required />
            </div>
            <div>
              <label htmlFor="additionalMinutes" className="mb-1 block text-sm font-medium text-slate-700">Additional minutes</label>
              <input id="additionalMinutes" name="additionalMinutes" type="number" min={15} defaultValue={30} className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2.5 text-slate-900" required />
            </div>
            <div>
              <label htmlFor="reason" className="mb-1 block text-sm font-medium text-slate-700">Reason</label>
              <input id="reason" name="reason" type="text" placeholder="Reason for overtime" className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2.5 text-slate-900" required />
            </div>
            <div>
              <label htmlFor="description" className="mb-1 block text-sm font-medium text-slate-700">Description</label>
              <textarea id="description" name="description" rows={3} placeholder="What extra work was required?" className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2.5 text-slate-900" required />
            </div>
            <button type="submit" className="rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-500">Request overtime</button>
          </form>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900">Report incident</h2>
          <form action={reportIncidentAction} className="mt-4 space-y-4">
            <div>
              <label htmlFor="severity" className="mb-1 block text-sm font-medium text-slate-700">Severity</label>
              <select id="severity" name="severity" defaultValue="MEDIUM" className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2.5 text-slate-900">
                <option value="LOW">Low</option>
                <option value="MEDIUM">Medium</option>
                <option value="HIGH">High</option>
                <option value="CRITICAL">Critical</option>
              </select>
            </div>
            <div>
              <label htmlFor="title" className="mb-1 block text-sm font-medium text-slate-700">Title</label>
              <input id="title" name="title" type="text" placeholder="Issue summary" className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2.5 text-slate-900" required />
            </div>
            <div>
              <label htmlFor="incidentDescription" className="mb-1 block text-sm font-medium text-slate-700">Description</label>
              <textarea id="incidentDescription" name="description" rows={4} placeholder="Describe what happened, where and what was affected." className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2.5 text-slate-900" required />
            </div>
            <button type="submit" className="rounded-xl bg-rose-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-rose-500">Raise incident</button>
          </form>
        </div>
      </div>
    </AppShell>
  );
}
