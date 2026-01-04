import LastUpdatedClient from "@/components/last-updated";
import { SharedDataView } from "@/components/shared-data-view";
import { BASE_URL, DESCRIPTION, TITLE } from "@/lib/constants";
import { getItems } from "@/lib/itemData";
import { League } from "@/lib/leagues";

interface LeagueContentServerProps {
  league: League;
}

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  name: TITLE,
  url: BASE_URL,
  description: DESCRIPTION,
  applicationCategory: "GameUtility",
  operatingSystem: "All",
  offers: {
    "@type": "Offer",
    price: 0,
  },
  author: {
    "@type": "Person",
    name: "deronek",
    url: "https://github.com/deronek",
  },
};

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
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c"),
        }}
      />
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
