import { getItems } from "@/lib/itemData";
import { SharedDataView } from "@/components/shared-data-view";
import LastUpdatedClient from "@/components/last-updated";
import { League } from "@/lib/leagues";
import { revalidateData } from "@/app/actions/revalidate";

interface LeagueContentServerProps {
  league: League;
}

export default async function LeagueContentServer({
  league,
}: LeagueContentServerProps) {
  const { items, lastUpdated } = await getItems(league);

  return (
    <>
      <h4 className="font-italic text-muted-foreground text-sm">
        <LastUpdatedClient
          timestamp={lastUpdated}
          league={league}
          revalidateData={revalidateData}
        />
      </h4>
      <div className="pt-2 xl:pt-6 xl:pb-4">
        <SharedDataView items={items} league={league} />
      </div>
    </>
  );
}
