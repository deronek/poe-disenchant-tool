"use client";
import { useRouter } from "next/navigation";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { LEAGUES, LEAGUE_SLUGS, League } from "@/lib/leagues";

interface LeagueSelectorProps {
  currentLeague: League;
}

export function LeagueSelector({ currentLeague }: LeagueSelectorProps) {
  const router = useRouter();

  const handleLeagueChange = (newLeague: League) => {
    router.push(`/${newLeague}`);
  };

  return (
    <Select value={currentLeague} onValueChange={handleLeagueChange}>
      <SelectTrigger className="w-[200px]">
        <SelectValue placeholder="Select league">
          {LEAGUES[currentLeague].name}
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
