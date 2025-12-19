import type { Metadata } from "next";
import { Suspense } from "react";

import LeagueContentServer from "@/app/[league]/league-content-server";
import DataViewSkeleton from "@/components/data-view-skeleton";
import { LeagueSelector } from "@/components/league-selector";
import { ModeToggle } from "@/components/ui/mode-toggle";
import { BASE_URL, DESCRIPTION, TITLE } from "@/lib/constants";
import { getLeagueName, League, LEAGUE_SLUGS } from "@/lib/leagues";

type Props = { params: Promise<{ league: League }> };

export const dynamicParams = false;
export const revalidate = 1800; // 30 minutes

export default async function LeaguePage({ params }: Props) {
  const { league } = await params;

  return (
    <div className="container mx-auto flex min-h-0 flex-1 flex-col p-4 pb-0 sm:pt-6 sm:pr-6 sm:pb-0 sm:pl-6 md:px-8">
      <header className="flex flex-col items-start justify-between gap-4 pb-3 sm:flex-row lg:pb-2">
        <div className="">
          <h1
            className="mb-2 text-2xl font-bold sm:mb-4"
            data-testid="page-title"
          >
            {TITLE}
          </h1>
          <p className="text-lg" data-testid="page-description">
            {DESCRIPTION}
          </p>
        </div>
        <nav className="flex w-full justify-between gap-4 sm:ml-auto sm:w-auto">
          <LeagueSelector currentLeague={league} />
          <ModeToggle />
        </nav>
      </header>
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
