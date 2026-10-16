import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { findUserById } from "@/lib/data";

function getSessionSecret() {
  const sessionSecret = process.env.SESSION_SECRET;
  if (process.env.NODE_ENV === "production" && (!sessionSecret || sessionSecret.length < 32)) {
    throw new Error("Set SESSION_SECRET to a value of at least 32 characters before running in production.");
  }
  return new TextEncoder().encode(sessionSecret ?? "dev-secret-change-me");
}

export async function createSessionToken(userId: string) {
  return new SignJWT({ userId })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(getSessionSecret());
}

export async function verifySessionToken(token: string | undefined) {
  if (!token) return null;

  const secret = getSessionSecret();
  try {
    const { payload } = await jwtVerify(token, secret);
    if (typeof payload.userId !== "string") return null;
    return payload.userId;
  } catch {
    return null;
  }
}

export async function setSession(userId: string) {
  const token = await createSessionToken(userId);
  const store = await cookies();
  store.set("mf_session", token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 60 * 24 * 7,
    path: "/",
  });
}

export async function clearSession() {
  const store = await cookies();
  store.set("mf_session", "", { httpOnly: true, path: "/", maxAge: 0, secure: process.env.NODE_ENV === "production" });
}

export async function getSessionUserId() {
  const store = await cookies();
  const token = store.get("mf_session")?.value;
  return verifySessionToken(token);
}

export async function getCurrentUser() {
  const userId = await getSessionUserId();
  if (!userId) return null;
  return findUserById(userId);
}

export async function requireUser() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  return user;
}

export async function requireRole(role: "ADMIN" | "CLIENT" | "CLEANER") {
  const user = await requireUser();
  if (user.role !== role) redirect("/dashboard");
  return user;
}
