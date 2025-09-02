"use client";

import { Button } from "@/components/ui/button";

export default function GlobalError({
  error, // eslint-disable-line @typescript-eslint/no-unused-vars
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex h-[91svh] flex-col items-center justify-center gap-4">
      <div className="flex items-center justify-center gap-4">
        <h1 className="border-primary border-r pr-6 text-2xl leading-10">
          Error
        </h1>
        <p className="text-sm">Something went wrong with the application.</p>
      </div>
      <Button onClick={reset}>Refresh</Button>
    </div>
  );
}
