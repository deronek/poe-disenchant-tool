import LeagueContentServer from "@/app/[league]/league-content-server";
import DataViewSkeleton from "@/components/data-view-skeleton";
import { LeagueSelector } from "@/components/league-selector";
import { ModeToggle } from "@/components/ui/mode-toggle";
import { League, LEAGUE_SLUGS } from "@/lib/leagues";
import { Suspense } from "react";

type Props = { params: Promise<{ league: League }> };

export const dynamicParams = false;
export const revalidate = 300; // 5 minutes

export default async function LeaguePage({ params }: Props) {
  const { league } = await params;

  return (
    <div className="container mx-auto space-y-3 p-4 pb-0 sm:pt-6 sm:pr-6 sm:pb-0 sm:pl-6 md:px-8 lg:space-y-2 xl:pb-4">
      <div className="flex flex-col items-start justify-between gap-4 sm:flex-row">
        <div className="">
          <h1 className="mb-2 text-2xl font-bold sm:mb-4">
            PoE Unique Disenchanting Tool
          </h1>
          <h3 className="text-lg">
            Calculate the efficiency of disenchanting unique items for
            Thaumaturgic Dust
          </h3>
        </div>
        <div className="flex w-full justify-between gap-4 sm:ml-auto sm:w-auto">
          <LeagueSelector currentLeague={league} />
          <ModeToggle />
        </div>
      </div>
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
