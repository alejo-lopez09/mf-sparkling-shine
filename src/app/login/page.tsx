import Link from "next/link";

import { signInAction } from "@/app/actions";

export default function LoginPage({
  searchParams,
}: {
  searchParams?: { error?: string };
}) {
  const error = searchParams?.error;

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-100 px-4 py-12">
      <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
        <div className="mb-6">
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-emerald-700">Welcome back</p>
          <h1 className="mt-3 text-3xl font-semibold text-slate-900">Sign in</h1>
        </div>

        <form action={signInAction} className="space-y-4">
          <div>
            <label htmlFor="email" className="mb-1 block text-sm font-medium text-slate-700">Email</label>
            <input id="email" name="email" type="email" defaultValue="admin@mfcleaning.co.uk" className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2.5 text-slate-900 outline-none ring-0 transition focus:border-emerald-500" required />
          </div>

          <div>
            <label htmlFor="password" className="mb-1 block text-sm font-medium text-slate-700">Password</label>
            <input id="password" name="password" type="password" defaultValue="Welcome123!" className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2.5 text-slate-900 outline-none ring-0 transition focus:border-emerald-500" required />
          </div>

          {error ? (
            <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>
          ) : null}

          <button type="submit" className="w-full rounded-xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-700">
            Continue to dashboard
          </button>
        </form>

        <div className="mt-5 flex items-center justify-between text-sm text-slate-600">
          <span>Need an account?</span>
          <Link href="/register" className="font-medium text-emerald-700 hover:text-emerald-600">Register</Link>
        </div>
      </div>
    </main>
  );
}
