import Link from "next/link";

export default function HomePage() {
  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,_#ecfeff,_#f8fafc_30%,_#f1f5f9_100%)] text-slate-800">
      <div className="mx-auto flex max-w-7xl flex-col px-4 py-10 sm:px-6 lg:px-8">
        <header className="mb-12 flex items-center justify-between">
          <div>
            <div className="text-xs font-semibold uppercase tracking-[0.35em] text-emerald-700">MF SPARKLING & SHINE LTD</div>
            <div className="mt-2 text-sm text-slate-600">Premium cleaning operations & client service platform</div>
          </div>
          <nav className="flex items-center gap-3">
            <Link href="/login" className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-800 transition hover:border-slate-300">
              Login
            </Link>
            <Link href="/register" className="rounded-full bg-slate-900 px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-slate-700">
              Register
            </Link>
          </nav>
        </header>

        <section className="grid items-center gap-8 lg:grid-cols-[1.2fr_0.8fr]">
          <div>
            <p className="mb-4 inline-flex rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-emerald-700">
              Trusted home & commercial cleaning
            </p>
            <h1 className="max-w-xl text-4xl font-semibold tracking-tight text-slate-900 sm:text-5xl">
              Commercial and domestic cleaning made operationally simple.
            </h1>
            <p className="mt-5 max-w-lg text-lg text-slate-600">
              Manage bookings, assignments, checklists, overtime verification, service evidence and reporting from one secure platform built for the UK cleaning sector.
            </p>
            <div className="mt-8 flex flex-wrap gap-4">
              <Link href="/register" className="rounded-full bg-emerald-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-emerald-500">
                Create account
              </Link>
              <Link href="/login" className="rounded-full border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-800 transition hover:border-slate-300">
                Existing user login
              </Link>
            </div>
            <div className="mt-10 grid gap-4 sm:grid-cols-3">
              {[
                ["120+", "Properties managed"],
                ["36", "Active cleaners"],
                ["98%", "Client satisfaction"],
              ].map(([value, label]) => (
                <div key={label} className="rounded-2xl border border-slate-200 bg-white/80 p-4 shadow-sm">
                  <div className="text-2xl font-semibold text-slate-900">{value}</div>
                  <div className="mt-2 text-sm text-slate-600">{label}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-lg shadow-slate-200/60">
            <div className="mb-6 rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">Demo accounts</p>
              <div className="mt-4 space-y-3 text-sm text-slate-700">
                <div className="flex items-center justify-between rounded-xl bg-white px-3 py-2">
                  <span>Admin</span>
                  <span className="font-medium">admin@mfcleaning.co.uk</span>
                </div>
                <div className="flex items-center justify-between rounded-xl bg-white px-3 py-2">
                  <span>Client</span>
                  <span className="font-medium">client@mfcleaning.co.uk</span>
                </div>
                <div className="flex items-center justify-between rounded-xl bg-white px-3 py-2">
                  <span>Cleaner</span>
                  <span className="font-medium">cleaner@mfcleaning.co.uk</span>
                </div>
              </div>
            </div>
            <div className="grid gap-3 text-sm text-slate-600">
              {[
                "Secure sessions and role-based controls",
                "Booking approvals and cleaner assignment workflows",
                "Time records, overtime approvals and evidence review",
              ].map((item) => (
                <div key={item} className="flex gap-3 rounded-xl border border-slate-200 bg-slate-50 px-3 py-3">
                  <div className="mt-0.5 h-2.5 w-2.5 rounded-full bg-emerald-500" />
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
