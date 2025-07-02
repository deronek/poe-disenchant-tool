import { getItems } from "@/lib/itemData";
import { columns } from "@/components/columns";
import { DataTable } from "@/components/data-table";

export default async function SandboxPage() {
  const items = await getItems();

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">PoE Unique Disenchanting Tool</h1>
      <h3 className="text-lg mb-2">
        Calculate the efficiency of disenchanting unique items for Thaumaturgic
        Dust in Kingsmarch
      </h3>
      <h4 className="text-sm font-italic">
        Last updated: {new Date().toLocaleString()}
      </h4>
      <div className="container mx-auto py-10">
        <DataTable columns={columns} data={items} />
      </div>
      ;
    </div>
  );
}
