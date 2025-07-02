import { getItems } from "@/lib/itemData";

export default async function SandboxPage() {
  const items = await getItems();

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Unique Item Lines</h1>
      <ul className="space-y-2">
        {items.map((item, idx) => {
          return (
            <li key={idx} className="border rounded p-4">
              <div>
                <strong>Name:</strong> {item.name}
              </div>
              {item.variant && (
                <div>
                  <strong>Variant:</strong> {item.variant}
                </div>
              )}
              <div>
                <strong>Chaos:</strong> {item.chaos}
              </div>
              <div>
                <strong>Graph:</strong>{" "}
                {item.graph && item.graph.length > 0
                  ? item.graph.join(", ")
                  : "No data"}
              </div>
              <div>
                <strong>Dust Value:</strong>{" "}
                {item ? item.dustVal : "No dust data"}
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
