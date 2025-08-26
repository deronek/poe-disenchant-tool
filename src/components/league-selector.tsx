"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { LEAGUES, LEAGUE_SLUGS, League } from "@/lib/leagues";

interface LeagueSelectorProps {
  currentLeague: League;
}

export function LeagueSelector({ currentLeague }: LeagueSelectorProps) {
  const router = useRouter();
  const [selected, setSelected] = useState<League>(currentLeague);
  const [, startTransition] = useTransition();

  const handleLeagueChange = (newLeague: League) => {
    setSelected(newLeague);
    try {
      // TODO: check if prefetch is beneficial at all
      router.prefetch(`/${newLeague}`);
    } catch {}
    startTransition(() => {
      router.push(`/${newLeague}`);
    });
  };

  return (
    <Select
      value={selected}
      onValueChange={(v) => handleLeagueChange(v as League)}
    >
      <SelectTrigger className="w-[200px]">
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
  );
}
