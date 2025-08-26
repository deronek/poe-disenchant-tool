// src/app/[league]/page.tsx
import LastUpdated from "@/components/last-updated";
import { LeagueSelector } from "@/components/league-selector";
import { SharedDataView } from "@/components/shared-data-view";
import { ModeToggle } from "@/components/ui/mode-toggle";
import { getItems } from "@/lib/itemData";
import { League, LEAGUE_SLUGS } from "@/lib/leagues";
import { revalidateData } from "../actions/revalidate";

type Props = { params: Promise<{ league: League }> };

export const dynamicParams = false;

export default async function LeaguePage({ params }: Props) {
  const { league } = await params;

  // Probably not needed since dynamicParams is false
  // if (!isValidLeague(league )) {
  // console.warn("Invalid league with manual catch", league);
  // notFound();
  // }

  const { items, lastUpdated } = await getItems(league);

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
      <h4 className="font-italic text-muted-foreground text-sm">
        <LastUpdated
          timestamp={lastUpdated}
          league={league}
          revalidateData={revalidateData}
        />
      </h4>
      <div className="pt-2 xl:pt-6 xl:pb-4">
        <SharedDataView items={items} />
      </div>
    </div>
  );
}

// Pre-generate static pages for known leagues
export async function generateStaticParams() {
  return LEAGUE_SLUGS.map((league) => ({ league }));
}
