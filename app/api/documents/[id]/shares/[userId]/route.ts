import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { loadDocumentFor } from "@/lib/documents";
import { withErrors } from "@/lib/http";
import { listShares, removeShare } from "@/lib/repo";

type Ctx = { params: Promise<{ id: string; userId: string }> };

export const DELETE = withErrors(async (_req: Request, { params }: Ctx) => {
  const user = await requireUser();
  const { id, userId } = await params;
  await loadDocumentFor(id, user.id, "share");
  await removeShare(id, userId);
  return NextResponse.json({ shares: await listShares(id) });
});
