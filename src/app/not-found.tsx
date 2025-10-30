import Link from "next/link";

import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="flex h-[91svh] flex-col items-center justify-center gap-4">
      <div className="flex items-center justify-center gap-4">
        <h1 className="border-primary border-r pr-6 text-2xl leading-10">
          404
        </h1>
        <p className="text-sm">This page could not be found.</p>
      </div>

      <Button asChild variant="link">
        <Link href="/">Return to main page</Link>
      </Button>
    </div>
  );
}
