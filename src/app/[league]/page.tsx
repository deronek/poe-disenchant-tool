import LeagueContentServer from "@/app/[league]/league-content-server";
import DataViewSkeleton from "@/components/data-view-skeleton";
import { LeagueSelector } from "@/components/league-selector";
import { ModeToggle } from "@/components/ui/mode-toggle";
import { BASE_URL, DESCRIPTION, TITLE } from "@/lib/constants";
import { getLeagueName, League, LEAGUE_SLUGS } from "@/lib/leagues";
import type { Metadata } from "next";
import { Suspense } from "react";

type Props = { params: Promise<{ league: League }> };

export const dynamicParams = false;
export const revalidate = 900; // 15 minutes

export default async function LeaguePage({ params }: Props) {
  const { league } = await params;

  return (
    <div className="container mx-auto space-y-3 p-4 pb-0 sm:pt-6 sm:pr-6 sm:pb-0 sm:pl-6 md:px-8 lg:space-y-2 xl:pb-4">
      <div className="flex flex-col items-start justify-between gap-4 sm:flex-row">
        <div className="">
          <h1 className="mb-2 text-2xl font-bold sm:mb-4">{TITLE}</h1>
          <h3 className="text-lg">{DESCRIPTION}</h3>
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

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { league } = await params;
  const leagueName = getLeagueName(league);

  return {
    title: leagueName,
    alternates: { canonical: `${BASE_URL}/${league}` },
  };
}

// Pre-generate static pages for known leagues
export async function generateStaticParams() {
  return LEAGUE_SLUGS.map((league: League) => ({ league }));
}
