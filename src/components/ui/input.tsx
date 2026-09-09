import * as React from "react";

import { cn } from "@/lib/utils";

interface InputProps extends React.ComponentProps<"input"> {
  error?: boolean;
}

function Input({ className, error, ...props }: InputProps) {
  return (
    <input
      aria-invalid={error || undefined}
      className={cn(
        "h-12 w-full rounded-2xl border border-border bg-card px-4 text-sm outline-none focus:border-accent disabled:opacity-50",
        error && "border-danger focus:border-danger",
        className
      )}
      {...props}
    />
  );
}

export { Input };
