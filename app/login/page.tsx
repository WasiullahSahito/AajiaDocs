import { LoginPicker } from "@/components/LoginPicker";
import { listUsers } from "@/lib/repo";

export const dynamic = "force-dynamic";

export default async function LoginPage() {
  const users = await listUsers();
  return (
    <main className="login">
      <div className="login-panel">
        <h1 className="wordmark">Ajaia Docs</h1>
        <p className="muted">
          Choose a demo account. Sign in as one person to share a document, then switch accounts to see it
          from the other side.
        </p>
        <LoginPicker users={users} />
      </div>
    </main>
  );
}
