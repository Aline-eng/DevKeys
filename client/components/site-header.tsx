"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSession, signOut } from "@/lib/auth-client";

export function SiteHeader() {
  const { data: session, isPending } = useSession();
  const router = useRouter();

  return (
    <header className="flex items-center justify-between border-b border-zinc-200 px-6 py-4 dark:border-zinc-800">
      <Link href="/" className="font-semibold tracking-tight">
        DevKeys
      </Link>
      <nav className="flex items-center gap-4 text-sm">
        <Link href="/practice" className="text-zinc-600 hover:text-zinc-950 dark:text-zinc-400 dark:hover:text-zinc-50">
          Practice
        </Link>
        {!isPending && session && (
          <Link href="/dashboard" className="text-zinc-600 hover:text-zinc-950 dark:text-zinc-400 dark:hover:text-zinc-50">
            Dashboard
          </Link>
        )}
        {!isPending && session ? (
          <button
            onClick={async () => {
              await signOut();
              router.push("/");
              router.refresh();
            }}
            className="text-zinc-600 hover:text-zinc-950 dark:text-zinc-400 dark:hover:text-zinc-50"
          >
            Sign out
          </button>
        ) : (
          !isPending && (
            <>
              <Link href="/sign-in" className="text-zinc-600 hover:text-zinc-950 dark:text-zinc-400 dark:hover:text-zinc-50">
                Sign in
              </Link>
              <Link
                href="/sign-up"
                className="rounded-full bg-foreground px-4 py-1.5 text-background transition-colors hover:bg-[#383838] dark:hover:bg-[#ccc]"
              >
                Sign up
              </Link>
            </>
          )
        )}
      </nav>
    </header>
  );
}
