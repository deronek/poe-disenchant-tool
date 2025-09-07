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
  const {
    items,
    lastUpdated: lastUpdatedTimestamp,
    lowStockThreshold,
  } = await getItems(league);
  const lastUpdated = new Date(lastUpdatedTimestamp);

  return (
    <>
      <h4 className="font-italic text-muted-foreground text-sm">
        <LastUpdatedClient
          timestamp={lastUpdated}
          league={league}
          revalidateData={revalidateData}
        />
      </h4>
      <div className="xl:py-4">
        <SharedDataView
          items={items}
          league={league}
          lowStockThreshold={lowStockThreshold}
        />
      </div>
    </>
  );
}
