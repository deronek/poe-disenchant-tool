import LastUpdated from "@/components/last-updated";
import { SharedDataView } from "@/components/shared-data-view";
import { ModeToggle } from "@/components/ui/mode-toggle";
import { getItems } from "@/lib/itemData";
import { revalidateData } from "./actions/revalidate";

export const revalidate = 300; // 5 minutes

export default async function SandboxPage() {
  const { items, lastUpdatedDate } = await getItems();
  const lastUpdated = lastUpdatedDate.toISOString();

  return (
    <div className="container mx-auto p-4 pb-0 sm:pt-6 sm:pr-6 sm:pb-0 sm:pl-6 md:px-8 xl:pb-4">
      <div className="flex justify-between">
        <h1 className="mb-4 text-2xl font-bold">
          PoE Unique Disenchanting Tool
        </h1>
        <ModeToggle />
      </div>
      <h3 className="mb-2 text-lg">
        Calculate the efficiency of disenchanting unique items for Thaumaturgic
        Dust in Kingsmarch
      </h3>
      <h4 className="font-italic text-muted-foreground text-sm">
        <LastUpdated timestamp={lastUpdated} revalidateData={revalidateData} />
      </h4>
      <div className="pt-2 xl:pt-6 xl:pb-4">
        <SharedDataView items={items} />
      </div>
    </div>
  );
}
