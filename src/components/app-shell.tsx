import Link from "next/link";

import { logoutAction } from "@/app/actions";
import { cn } from "@/lib/utils";
import type { User } from "@/lib/types";

const navGroups = {
  ADMIN: [
    ["Overview", "/admin"],
    ["Bookings", "/dashboard"],
    ["Clients", "/dashboard"],
    ["Cleaners", "/dashboard"],
    ["Reports", "/dashboard"],
  ],
  CLIENT: [
    ["Dashboard", "/dashboard"],
    ["Properties", "/client/new-property"],
    ["New booking", "/client/new-booking"],
    ["History", "/dashboard"],
  ],
  CLEANER: [
    ["Dashboard", "/dashboard"],
    ["Schedule", "/dashboard"],
    ["Jobs", "/dashboard"],
    ["Messages", "/dashboard"],
  ],
} as const;

export function AppShell({
  user,
  title,
  subtitle,
  children,
}: {
  user: User | null;
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  const links = user ? navGroups[user.role] : [["Login", "/login"]];

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900">
      <div className="border-b border-slate-200 bg-white/90 backdrop-blur-sm">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          <div>
            <div className="text-xs font-semibold uppercase tracking-[0.25em] text-emerald-700">MF SPARKLING & SHINE LTD</div>
            <div className="text-sm text-slate-500">Cleaning operations</div>
          </div>
          <nav className="hidden items-center gap-4 md:flex">
            {links.map(([label, href]) => (
              <Link key={href} href={href} className={cn("text-sm font-medium text-slate-600 transition hover:text-slate-900", href === "/dashboard" && "text-slate-900")}>
                {label}
              </Link>
            ))}
          </nav>
          <div className="flex items-center gap-3">
            {user ? (
              <>
                <div className="hidden text-right sm:block">
                  <div className="text-sm font-medium text-slate-800">{user.name}</div>
                  <div className="text-xs uppercase tracking-[0.2em] text-slate-500">{user.role}</div>
                </div>
                <form action={logoutAction}>
                  <button className="rounded-full border border-slate-200 bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-700">
                    Sign out
                  </button>
                </form>
              </>
            ) : (
              <Link href="/login" className="rounded-full border border-slate-200 bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-700">
                Log in
              </Link>
            )}
          </div>
        </div>
      </div>

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <header className="mb-8 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-emerald-600">Operations dashboard</p>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight text-slate-900">{title}</h1>
          <p className="mt-2 text-sm text-slate-600">{subtitle}</p>
        </header>
        {children}
      </main>
    </div>
  );
}
