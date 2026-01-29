"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { League, LEAGUE_SLUGS, LEAGUES } from "@/lib/leagues";
import Spinner from "./ui/spinner";

interface LeagueSelectorProps {
  currentLeague: League;
}

export function LeagueSelector({ currentLeague }: LeagueSelectorProps) {
  const router = useRouter();
  const [selected, setSelected] = useState<League>(currentLeague);
  const [isPending, startTransition] = useTransition();

  const handleLeagueChange = (newLeague: League) => {
    setSelected(newLeague);
    startTransition(() => {
      router.push(`/${newLeague}`);
    });
  };

  return (
    <div className="flex flex-col gap-2 lg:flex-row lg:items-end lg:gap-3">
      <LeagueSelectorSpinner isPending={isPending} variant="desktop" />

      <div className="order-2 lg:order-1 lg:pb-2">
        <Badge variant="blue" className="text-xs">
          Phrecia 2.0 Leagues Available!
        </Badge>
      </div>

      <div className="order-1 flex flex-col gap-2 lg:order-2">
        <Label className="text-muted-foreground" htmlFor="league-selector">
          League
        </Label>

        <div
          className="flex items-center gap-4"
          aria-busy={isPending || undefined}
        >
          <Select
            value={selected}
            onValueChange={(v) => handleLeagueChange(v as League)}
          >
            <SelectTrigger className="w-[200px]" id="league-selector">
              <SelectValue placeholder="Select league">
                {LEAGUES[selected].name}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              {LEAGUE_SLUGS.map((slug) => (
                <SelectItem key={slug} value={slug}>
                  <div className="flex items-center gap-2">
                    {LEAGUES[slug].name}
                    {(slug === "phrecia2.0" || slug === "phrecia2.0hc") && (
                      <Badge variant="blue" className="text-xs">
                        New
                      </Badge>
                    )}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <LeagueSelectorSpinner isPending={isPending} variant="mobile" />
        </div>
      </div>
      {/* Static list of all leagues for SEO and accessibility */}
      <div className="sr-only">
        <ul className="flex flex-col gap-1">
          {LEAGUE_SLUGS.map((slug) => (
            <li key={slug}>
              <Link href={`/${slug}`} className="hover:underline">
                {LEAGUES[slug].name}
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

interface LeagueSelectorSpinnerProps {
  isPending: boolean;
  variant: "desktop" | "mobile";
}

function LeagueSelectorSpinner({
  isPending,
  variant,
}: LeagueSelectorSpinnerProps) {
  if (!isPending) return null;

  return (
    <>
      <Spinner
        className={variant === "desktop" ? "mb-2 hidden lg:block" : "lg:hidden"}
        data-testid={`league-selector-spinner`}
      />
      {/* Render only for mobile variant */}
      {variant === "mobile" && (
        <span className="sr-only" role="status" aria-live="polite">
          Switching league…
        </span>
      )}
    </>
  );
}
