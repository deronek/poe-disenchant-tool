import * as React from "react";
import { X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export interface XButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  size?: "sm" | "default" | "lg";
  variant?: "ghost" | "outline" | "default";
}

const XButton = React.forwardRef<HTMLButtonElement, XButtonProps>(
  ({ className, size = "sm", variant = "ghost", ...props }, ref) => {
    return (
      <Button
        variant={variant}
        size={size}
        className={cn("h-5 px-1", className)}
        ref={ref}
        {...props}
      >
        <X />
      </Button>
    );
  },
);
XButton.displayName = "XButton";

export { XButton };
