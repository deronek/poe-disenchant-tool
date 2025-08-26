// src/app/[league]/page.tsx
import { Suspense } from "react";
import { LeagueSelector } from "@/components/league-selector";
import { ModeToggle } from "@/components/ui/mode-toggle";
import LeagueContentServer from "@/app/[league]/league-content-server";
import DataViewSkeleton from "@/components/data-view-skeleton";
import { League, LEAGUE_SLUGS } from "@/lib/leagues";

type Props = { params: Promise<{ league: League }> };

export const dynamicParams = false;

export default async function LeaguePage({ params }: Props) {
  const { league } = await params;

  // Probably not needed since dynamicParams is false
  // if (!isValidLeague(league )) {
  // console.warn("Invalid league with manual catch", league);
  // notFound();
  // }

  return (
    <div className="container mx-auto p-4 pb-0 sm:pt-6 sm:pr-6 sm:pb-0 sm:pl-6 md:px-8 xl:pb-4">
      <div className="flex justify-between">
        <h1 className="mb-4 text-2xl font-bold">
          PoE Unique Disenchanting Tool
        </h1>
        <div className="flex items-center gap-4">
          <LeagueSelector currentLeague={league} />
          <ModeToggle />
        </div>
      </div>
      <h3 className="mb-2 text-lg">
        Calculate the efficiency of disenchanting unique items for Thaumaturgic
        Dust
      </h3>
      <Suspense fallback={<DataViewSkeleton />}>
        <LeagueContentServer key={league} league={league} />
      </Suspense>
    </div>
  );
}

// Pre-generate static pages for known leagues
export async function generateStaticParams() {
  return LEAGUE_SLUGS.map((league: League) => ({ league }));
}
