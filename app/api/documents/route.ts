import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { readJson, withErrors } from "@/lib/http";
import { createDocument, listOwnedDocuments, listSharedDocuments } from "@/lib/repo";
import { createDocumentSchema } from "@/lib/validation";

export const GET = withErrors(async () => {
  const user = await requireUser();
  const [owned, shared] = await Promise.all([listOwnedDocuments(user.id), listSharedDocuments(user.id)]);
  return NextResponse.json({ owned, shared });
});

export const POST = withErrors(async (req: Request) => {
  const user = await requireUser();
  const { title } = createDocumentSchema.parse(await readJson(req));
  const id = await createDocument({ ownerId: user.id, title: title ?? "Untitled document", content: "<p></p>" });
  return NextResponse.json({ document: { id } }, { status: 201 });
});
