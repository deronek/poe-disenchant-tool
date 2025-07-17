import { getItems } from "@/lib/itemData";
import { columns } from "@/components/columns";
import { DataTable } from "@/components/data-table";
import { ModeToggle } from "@/components/ui/mode-toggle";
import LastUpdated from "@/components/last-updated";

export const revalidate = 300; // 5 minutes

export default async function SandboxPage() {
  const items = await getItems();
  const lastUpdated = new Date().toISOString();

  return (
    <div className="p-8">
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
      <div className="container mx-auto py-10">
        <DataTable columns={columns} data={items} />
      </div>
    </div>
  );
}
