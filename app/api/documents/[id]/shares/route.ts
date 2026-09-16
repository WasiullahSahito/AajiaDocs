import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { loadDocumentFor } from "@/lib/documents";
import { HttpError } from "@/lib/errors";
import { readJson, withErrors } from "@/lib/http";
import { findUserByEmail, listShares, upsertShare } from "@/lib/repo";
import { shareSchema } from "@/lib/validation";

type Ctx = { params: Promise<{ id: string }> };

export const GET = withErrors(async (_req: Request, { params }: Ctx) => {
  const user = await requireUser();
  const { id } = await params;
  await loadDocumentFor(id, user.id, "share");
  return NextResponse.json({ shares: await listShares(id) });
});

export const POST = withErrors(async (req: Request, { params }: Ctx) => {
  const user = await requireUser();
  const { id } = await params;
  const { email, role } = shareSchema.parse(await readJson(req));
  const { doc } = await loadDocumentFor(id, user.id, "share");

  const target = await findUserByEmail(email);
  if (!target) throw new HttpError(404, `No account found for ${email}.`);
  if (target.id === doc.ownerId) throw new HttpError(400, "You already own this document.");

  await upsertShare(id, target.id, role);
  return NextResponse.json({ shares: await listShares(id) }, { status: 201 });
});
