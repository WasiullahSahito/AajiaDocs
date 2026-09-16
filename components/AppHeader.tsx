import Link from "next/link";
import type { User } from "@/lib/repo";
import { SignOutButton } from "@/components/SignOutButton";

export function AppHeader({ user }: { user: User }) {
  return (
    <header className="app-header">
      <Link href="/documents" className="wordmark">
        Ajaia Docs
      </Link>
      <div className="app-header-user">
        <span>
          Signed in as <strong>{user.name}</strong>
        </span>
        <SignOutButton />
      </div>
    </header>
  );
}
