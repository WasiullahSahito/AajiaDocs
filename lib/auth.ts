/**
 * Mocked authentication: the session cookie holds a seeded user's id.
 * Deliberately simple for this exercise — see ARCHITECTURE.md for what a
 * production version would replace it with.
 */
import { cookies } from "next/headers";
import { findUserById, type User } from "@/lib/repo";
import { HttpError } from "@/lib/errors";

export const SESSION_COOKIE = "ajaia_uid";

export async function getCurrentUser(): Promise<User | null> {
  const store = await cookies();
  const id = store.get(SESSION_COOKIE)?.value;
  return id ? findUserById(id) : null;
}

export async function requireUser(): Promise<User> {
  const user = await getCurrentUser();
  if (!user) throw new HttpError(401, "Sign in to continue.");
  return user;
}
