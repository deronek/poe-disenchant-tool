import LastUpdated from "@/components/last-updated";
import { SharedDataView } from "@/components/shared-data-view";
import { ModeToggle } from "@/components/ui/mode-toggle";
import { getItems } from "@/lib/itemData";

export const revalidate = 300; // 5 minutes

export default async function SandboxPage() {
  const items = await getItems();
  const lastUpdated = new Date().toISOString();

  return (
    <div className="container mx-auto p-6 pb-4 md:px-8 md:pt-8">
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
        <LastUpdated timestamp={lastUpdated} />
      </h4>
      <div className="pt-6 pb-4">
        <SharedDataView items={items} />
      </div>
    </div>
  );
}
