import { CurrencyDataStatus } from "@/components/currency-data-status";
import LastUpdatedClient from "@/components/last-updated";
import { SharedDataView } from "@/components/shared-data-view";
import { BASE_URL, getDescriptionWithLeague, TITLE } from "@/lib/constants";
import { GITHUB_AUTHOR_NAME, GITHUB_AUTHOR_URL } from "@/lib/github";
import { getItems } from "@/lib/item-data";
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
    dataStatus,
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
      name: GITHUB_AUTHOR_NAME,
      url: GITHUB_AUTHOR_URL,
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
      <div className="font-italic text-muted-foreground inline-flex flex-wrap items-center gap-x-2 text-sm">
        <LastUpdatedClient timestamp={lastUpdated} />
        <CurrencyDataStatus
          status={dataStatus.currency}
          divinePriceThreshold={divinePriceThreshold}
        />
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
