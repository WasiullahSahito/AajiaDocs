import Link from "next/link";
import { redirect } from "next/navigation";
import { AppHeader } from "@/components/AppHeader";
import { DashboardActions } from "@/components/DashboardActions";
import { getCurrentUser } from "@/lib/auth";
import { listOwnedDocuments, listSharedDocuments } from "@/lib/repo";

export const dynamic = "force-dynamic";

const formatDate = (d: Date) =>
  new Intl.DateTimeFormat("en", { dateStyle: "medium", timeStyle: "short", timeZone: "UTC" }).format(d) + " UTC";

export default async function DocumentsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const [owned, shared] = await Promise.all([listOwnedDocuments(user.id), listSharedDocuments(user.id)]);

  return (
    <>
      <AppHeader user={user} />
      <main className="dashboard">
        <div className="dashboard-top">
          <h1>Documents</h1>
          <DashboardActions />
        </div>

        <section aria-labelledby="owned-heading" className="doc-section">
          <h2 id="owned-heading">My documents</h2>
          {owned.length === 0 ? (
            <p className="empty">You don&apos;t own any documents yet. Create one or import a file to get started.</p>
          ) : (
            <ul className="doc-list">
              {owned.map((d) => (
                <li key={d.id}>
                  <Link href={`/documents/${d.id}`} className="doc-row">
                    <span className="doc-row-title">{d.title}</span>
                    <span className="doc-row-meta">
                      {d.shareCount > 0 ? (
                        <span className="tag tag-owned">Shared with {d.shareCount}</span>
                      ) : (
                        <span className="tag">Private</span>
                      )}
                      <span>Edited {formatDate(d.updatedAt)}</span>
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section aria-labelledby="shared-heading" className="doc-section">
          <h2 id="shared-heading">Shared with me</h2>
          {shared.length === 0 ? (
            <p className="empty">Nothing has been shared with you yet.</p>
          ) : (
            <ul className="doc-list">
              {shared.map((d) => (
                <li key={d.id}>
                  <Link href={`/documents/${d.id}`} className="doc-row">
                    <span className="doc-row-title">
                      <span className="avatar" aria-hidden="true">
                        {d.ownerName.charAt(0)}
                      </span>
                      {d.title}
                    </span>
                    <span className="doc-row-meta">
                      <span className={`tag ${d.role === "editor" ? "tag-owned" : ""}`}>
                        {d.role === "editor" ? "Can edit" : "Can view"}
                      </span>
                      <span>Owned by {d.ownerName}</span>
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>
      </main>
    </>
  );
}
