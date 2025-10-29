import { getItems } from "@/lib/itemData";
import { SharedDataView } from "@/components/shared-data-view";
import LastUpdatedClient from "@/components/last-updated";
import { League } from "@/lib/leagues";
import { revalidateDataAction } from "@/app/actions/revalidate";

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
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="font-italic text-muted-foreground text-sm">
        <LastUpdatedClient
          timestamp={lastUpdated}
          league={league}
          revalidateDataAction={revalidateDataAction}
        />
      </div>
      <section className="flex flex-1 flex-col justify-center">
        <SharedDataView
          items={items}
          league={league}
          lowStockThreshold={lowStockThreshold}
        />
      </section>
    </div>
  );
}
