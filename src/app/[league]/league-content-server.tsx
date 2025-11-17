import LastUpdatedClient from "@/components/last-updated";
import { SharedDataView } from "@/components/shared-data-view";
import { getItems } from "@/lib/itemData";
import { League } from "@/lib/leagues";

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
        <LastUpdatedClient timestamp={lastUpdated} />
      </div>
      <section className="py-1">
        <SharedDataView
          items={items}
          league={league}
          lowStockThreshold={lowStockThreshold}
        />
      </section>
    </div>
  );
}
