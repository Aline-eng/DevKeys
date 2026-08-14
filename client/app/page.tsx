import Link from "next/link";

export default function Home() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center bg-zinc-50 px-6 py-32 text-center dark:bg-black">
      <h1 className="max-w-2xl text-4xl font-semibold tracking-tight text-zinc-950 dark:text-zinc-50">
        Typing practice built for developers.
      </h1>
      <p className="mt-4 max-w-xl text-lg text-zinc-600 dark:text-zinc-400">
        Track your speed and accuracy, see exactly which keys are holding you back, and drill the ones that matter.
      </p>
      <div className="mt-8 flex gap-4">
        <Link
          href="/practice"
          className="rounded-full bg-foreground px-6 py-3 text-sm font-medium text-background transition-colors hover:bg-[#383838] dark:hover:bg-[#ccc]"
        >
          Start practicing
        </Link>
        <Link
          href="/sign-up"
          className="rounded-full border border-zinc-300 px-6 py-3 text-sm font-medium transition-colors hover:bg-black/[.04] dark:border-zinc-700 dark:hover:bg-white/[.06]"
        >
          Create an account
        </Link>
      </div>
    </div>
  );
}
