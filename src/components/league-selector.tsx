"use client";

import { useEffect, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { CalendarPlus } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  hasNewLeagues,
  isNewLeague,
  League,
  LEAGUE_SLUGS,
  LEAGUES,
} from "@/lib/leagues";
import Spinner from "./ui/spinner";

interface LeagueSelectorProps {
  currentLeague: League;
}

export function LeagueSelector({ currentLeague }: LeagueSelectorProps) {
  const router = useRouter();
  const [selected, setSelected] = useState<League>(currentLeague);
  const [isPending, startTransition] = useTransition();
  const [isSelectOpen, setIsSelectOpen] = useState(false);
  const [showNewLeaguesBadge, setShowNewLeaguesBadge] = useState(() =>
    hasNewLeagues(),
  );

  // On hydration, check whether to display the new badge based on localStorage override
  useEffect(() => {
    if (
      typeof localStorage !== "undefined" &&
      localStorage.getItem("poe-udt:always-show-new-leagues:v1") !== null
    ) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setShowNewLeaguesBadge(true);
    }
  }, []);

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
          <div className="relative">
            <Select
              value={selected}
              onValueChange={(v) => handleLeagueChange(v as League)}
              onOpenChange={setIsSelectOpen}
            >
              <SelectTrigger className="w-[200px]" id="league-selector">
                <SelectValue placeholder="Select league">
                  {LEAGUES[selected].name}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {LEAGUE_SLUGS.map((slug) => (
                  <SelectItem key={slug} value={slug}>
                    <div className="flex items-center gap-3">
                      {LEAGUES[slug].name}
                      {isNewLeague(slug) && (
                        <Badge variant="blue" className="text-xs">
                          New
                        </Badge>
                      )}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {showNewLeaguesBadge && (
              <Badge
                variant="blue"
                className={`absolute -top-3 right-0 border-none px-1.5 py-0.5 text-xs transition-opacity ${
                  isSelectOpen ? "opacity-80" : "opacity-100"
                }`}
                data-testid="new-leagues-info-badge"
              >
                <CalendarPlus className="mr-1" />
                Updated!
              </Badge>
            )}
          </div>
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
