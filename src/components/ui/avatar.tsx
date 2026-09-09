import * as React from "react";

import { cn } from "@/lib/utils";

function initialsFromName(name: string): string {
  const parts = name.trim().split(/\s+/);
  const first = parts[0]?.[0] ?? "";
  const last = parts.length > 1 ? parts[parts.length - 1]?.[0] ?? "" : "";
  return (first + last).toUpperCase();
}

interface AvatarProps extends React.ComponentProps<"div"> {
  name: string;
}

function Avatar({ name, className, ...props }: AvatarProps) {
  return (
    <div
      className={cn(
        "flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-accent/15 text-sm font-semibold text-accent",
        className
      )}
      {...props}
    >
      {initialsFromName(name)}
    </div>
  );
}

export { Avatar };
