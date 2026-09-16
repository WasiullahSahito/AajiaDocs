import Link from "next/link";
import { redirect } from "next/navigation";
import { DocumentEditor } from "@/components/DocumentEditor";
import { getCurrentUser } from "@/lib/auth";
import { loadDocumentFor } from "@/lib/documents";
import { HttpError } from "@/lib/errors";

export const dynamic = "force-dynamic";

export default async function DocumentPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  const { id } = await params;

  try {
    const { doc, role } = await loadDocumentFor(id, user.id, "read");
    return (
      <DocumentEditor
        key={doc.id}
        documentId={doc.id}
        initialTitle={doc.title}
        initialContent={doc.content}
        role={role}
        ownerName={doc.ownerName}
      />
    );
  } catch (err) {
    if (!(err instanceof HttpError)) throw err;
    return (
      <main className="login">
        <div className="login-panel">
          <h1>This document isn&apos;t available</h1>
          <p className="muted">
            It may have been deleted, or it hasn&apos;t been shared with {user.name}. Ask the owner to share it with
            your account.
          </p>
          <Link className="button" href="/documents">
            Back to documents
          </Link>
        </div>
      </main>
    );
  }
}
