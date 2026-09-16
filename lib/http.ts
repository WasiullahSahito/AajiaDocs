import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { HttpError } from "@/lib/errors";

export function jsonError(status: number, error: string) {
  return NextResponse.json({ error }, { status });
}

/** Wraps a route handler so every failure becomes a consistent JSON error. */
export function withErrors<A extends unknown[]>(handler: (...args: A) => Promise<Response>) {
  return async (...args: A): Promise<Response> => {
    try {
      return await handler(...args);
    } catch (err) {
      if (err instanceof HttpError) return jsonError(err.status, err.message);
      if (err instanceof ZodError) return jsonError(400, err.issues[0]?.message ?? "Invalid request.");
      console.error(err);
      return jsonError(500, "Something went wrong on our side. Try again.");
    }
  };
}

export async function readJson(req: Request): Promise<unknown> {
  try {
    return await req.json();
  } catch {
    throw new HttpError(400, "Request body must be valid JSON.");
  }
}
