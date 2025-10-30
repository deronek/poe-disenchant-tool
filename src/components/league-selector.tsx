"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

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
    <div className="flex flex-row-reverse gap-3 sm:flex-row">
      {isPending && (
        <>
          <Spinner
            className="mb-1 place-self-end"
            data-testid="league-selector-spinner"
          />
          <span className="sr-only" role="status" aria-live="polite">
            Switching league…
          </span>
        </>
      )}

      <div className="flex flex-col gap-2">
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
                  {LEAGUES[slug].name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
}
