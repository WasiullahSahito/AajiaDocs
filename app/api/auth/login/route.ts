import { NextResponse } from "next/server";
import { SESSION_COOKIE } from "@/lib/auth";
import { HttpError } from "@/lib/errors";
import { readJson, withErrors } from "@/lib/http";
import { findUserById } from "@/lib/repo";
import { loginSchema } from "@/lib/validation";

export const POST = withErrors(async (req: Request) => {
  const { userId } = loginSchema.parse(await readJson(req));
  const user = await findUserById(userId);
  if (!user) throw new HttpError(404, "That user doesn't exist.");

  const res = NextResponse.json({ user });
  res.cookies.set(SESSION_COOKIE, user.id, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
  return res;
});
