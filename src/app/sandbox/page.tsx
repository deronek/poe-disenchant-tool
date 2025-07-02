import { getPriceData } from "@/lib/prices";
import { getDustData } from "@/lib/dust";

export default async function SandboxPage() {
  const lines = await getPriceData();
  const dustItems = getDustData();

  // Create a map for quick lookup
  const dustMap = new Map(dustItems.map((item) => [item.name, item]));

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Unique Item Lines</h1>
      <ul className="space-y-2">
        {lines.map((line, idx) => {
          const dust = dustMap.get(line.name);
          return (
            <li key={idx} className="border rounded p-4">
              <div>
                <strong>Name:</strong> {line.name}
              </div>
              {line.variant && (
                <div>
                  <strong>Variant:</strong> {line.variant}
                </div>
              )}
              <div>
                <strong>Chaos:</strong> {line.chaos}
              </div>
              <div>
                <strong>Graph:</strong>{" "}
                {line.graph && line.graph.length > 0
                  ? line.graph.join(", ")
                  : "No data"}
              </div>
              <div>
                <strong>Dust Value:</strong>{" "}
                {dust ? dust.dustVal : "No dust data"}
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
