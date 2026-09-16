import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { HttpError } from "@/lib/errors";
import { withErrors } from "@/lib/http";
import { convertFileToDocument, MAX_UPLOAD_BYTES } from "@/lib/import";
import { createDocument } from "@/lib/repo";

export const POST = withErrors(async (req: Request) => {
  const user = await requireUser();

  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    throw new HttpError(400, "Upload a file using multipart/form-data.");
  }
  const file = form.get("file");
  if (!(file instanceof File)) throw new HttpError(400, "Choose a file to import.");
  if (file.size > MAX_UPLOAD_BYTES) throw new HttpError(413, "The file is larger than 4 MB.");

  const { title, content } = await convertFileToDocument(file.name, Buffer.from(await file.arrayBuffer()));
  const id = await createDocument({ ownerId: user.id, title, content });
  return NextResponse.json({ document: { id, title } }, { status: 201 });
});
