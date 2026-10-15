import Link from "next/link";

import { registerAction } from "@/app/actions";

export default function RegisterPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-100 px-4 py-12">
      <div className="w-full max-w-lg rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
        <div className="mb-6">
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-emerald-700">Create account</p>
          <h1 className="mt-3 text-3xl font-semibold text-slate-900">Register</h1>
        </div>

        <form action={registerAction} className="space-y-4">
          <div>
            <label htmlFor="name" className="mb-1 block text-sm font-medium text-slate-700">Full name</label>
            <input id="name" name="name" className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2.5 text-slate-900 outline-none transition focus:border-emerald-500" required />
          </div>

          <div>
            <label htmlFor="email" className="mb-1 block text-sm font-medium text-slate-700">Email</label>
            <input id="email" name="email" type="email" className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2.5 text-slate-900 outline-none transition focus:border-emerald-500" required />
          </div>

          <div>
            <label htmlFor="password" className="mb-1 block text-sm font-medium text-slate-700">Password</label>
            <input id="password" name="password" type="password" minLength={8} className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2.5 text-slate-900 outline-none transition focus:border-emerald-500" required />
          </div>

          <div>
            <label htmlFor="role" className="mb-1 block text-sm font-medium text-slate-700">Role</label>
            <select id="role" name="role" defaultValue="CLIENT" className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2.5 text-slate-900 outline-none transition focus:border-emerald-500">
              <option value="CLIENT">Client</option>
              <option value="CLEANER">Cleaner</option>
              <option value="ADMIN">Administrator</option>
            </select>
          </div>

          <button type="submit" className="w-full rounded-xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-emerald-500">
            Create account
          </button>
        </form>

        <div className="mt-5 text-sm text-slate-600">
          Already have an account? <Link href="/login" className="font-medium text-emerald-700">Sign in</Link>
        </div>
      </div>
    </main>
  );
}
