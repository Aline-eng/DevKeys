"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "@/lib/auth-client";

export function AuthGate({ children }: { children: React.ReactNode }) {
  const { data: session, isPending } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (!isPending && !session) {
      router.replace("/sign-in");
    }
  }, [isPending, session, router]);

  if (isPending) {
    return (
      <div className="flex flex-1 items-center justify-center py-32 text-sm text-zinc-500">
        Loading...
      </div>
    );
  }

  if (!session) {
    return null;
  }

  return <>{children}</>;
}
