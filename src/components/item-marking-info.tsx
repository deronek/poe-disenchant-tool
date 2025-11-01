import { CheckCircle } from "lucide-react";

import { Badge } from "@/components/ui/badge";

interface ItemMarkingInfoProps {
  itemName?: string;
}

export function ItemMarkingInfo({ itemName }: ItemMarkingInfoProps) {
  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-2">
        <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
        <h4 className="text-sm font-semibold">Item Marking</h4>
      </div>
      <div className="flex flex-col gap-2">
        <p className="leading-relaxed">
          {itemName
            ? `Mark ${itemName} as traded recently.`
            : "Mark items you've traded recently."}
        </p>
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="text-xs">
            Local Storage
          </Badge>
          <Badge variant="outline" className="text-xs">
            Visual Only
          </Badge>
        </div>
        <p className="text-muted-foreground text-xs leading-relaxed">
          Use &quot;Clear marks&quot; in the toolbar to remove marks from all
          items.
        </p>
      </div>
    </div>
  );
}
