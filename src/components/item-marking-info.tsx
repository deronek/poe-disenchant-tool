import { CheckCircle } from "lucide-react";

import { Badge } from "@/components/ui/badge";

export function ItemMarkingInfo() {
  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-2">
        <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
        <h4 className="text-sm font-semibold">Item Marking</h4>
      </div>
      <div className="flex flex-col gap-2">
        <p className="leading-relaxed">Mark items you have traded recently.</p>
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="text-xs">
            Local Storage
          </Badge>
          <Badge variant="outline" className="text-xs">
            Visual Only
          </Badge>
        </div>
        <p className="text-muted-foreground text-xs leading-relaxed">
          Use <strong>Clear Marks</strong> in the toolbar to remove marks from
          all items.
        </p>
      </div>
    </div>
  );
}
