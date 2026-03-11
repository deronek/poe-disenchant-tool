import LastUpdatedClient from "@/components/last-updated";
import { SharedDataView } from "@/components/shared-data-view";
import { BASE_URL, getDescriptionWithLeague, TITLE } from "@/lib/constants";
import { getItems } from "@/lib/itemData";
import { getLeagueDatePublished, getLeagueName, League } from "@/lib/leagues";

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
    divinePriceThreshold,
  } = await getItems(league);
  const lastUpdated = new Date(lastUpdatedTimestamp);
  const leagueName = getLeagueName(league);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: `${leagueName} | ${TITLE}`,
    url: `${BASE_URL}/${league}`,
    description: getDescriptionWithLeague(leagueName),
    applicationCategory: "GameUtility",
    operatingSystem: "All",
    datePublished: getLeagueDatePublished(league).toISOString(),
    dateModified: lastUpdated.toISOString(),
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
          divinePriceThreshold={divinePriceThreshold}
        />
      </section>
    </div>
  );
}
