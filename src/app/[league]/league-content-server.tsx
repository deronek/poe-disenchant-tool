import { CurrencyDataStatus } from "@/components/currency-data-status";
import LastUpdatedClient from "@/components/last-updated";
import { PriceDataUnavailable } from "@/components/price-data-unavailable";
import { SharedDataView } from "@/components/shared-data-view";
import { BASE_URL, getDescriptionWithLeague, TITLE } from "@/lib/constants";
import { GITHUB_AUTHOR_NAME, GITHUB_AUTHOR_URL } from "@/lib/github";
import { getItems } from "@/lib/item-data";
import { getLeagueDatePublished, getLeagueName, League } from "@/lib/leagues";
import { ExternalApiError } from "@/lib/prices/external-api";
import { isBuildTime } from "@/lib/utils-server";

interface LeagueContentServerProps {
  league: League;
}

const isPriceDataUnavailableError = (error: unknown): boolean => {
  if (error instanceof ExternalApiError) {
    return error.source === "prices";
  }

  return (
    error instanceof AggregateError &&
    error.errors.length > 0 &&
    error.errors.every((cause) => cause instanceof ExternalApiError) &&
    error.errors.some(
      (cause) => cause instanceof ExternalApiError && cause.source === "prices",
    )
  );
};

export default async function LeagueContentServer({
  league,
}: LeagueContentServerProps) {
  let itemData: Awaited<ReturnType<typeof getItems>>;

  try {
    itemData = await getItems(league);
  } catch (error) {
    if (
      isBuildTime &&
      process.env.ALLOW_UNAVAILABLE_PRERENDER === "1" &&
      isPriceDataUnavailableError(error)
    ) {
      return <PriceDataUnavailable league={league} />;
    }

    throw error;
  }

  const {
    items,
    lastUpdated: lastUpdatedTimestamp,
    lowStockThreshold,
    divinePriceThreshold,
    dataStatus,
  } = itemData;
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
        <CurrencyDataStatus status={dataStatus.currency} />
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
