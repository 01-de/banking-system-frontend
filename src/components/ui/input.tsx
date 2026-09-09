import * as React from "react";

import { cn } from "@/lib/utils";

function Input({ className, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      className={cn(
        "h-12 w-full rounded-2xl border border-border bg-card px-4 text-sm outline-none focus:border-accent disabled:opacity-50",
        className
      )}
      {...props}
    />
  );
}

export { Input };
