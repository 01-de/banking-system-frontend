import { Skeleton } from "@/components/ui/skeleton";

export function AuthBootScreen() {
  return (
    <div className="mx-auto flex min-h-svh w-full max-w-md flex-col justify-center gap-4 px-4">
      <Skeleton className="h-6 w-1/2" />
      <Skeleton className="h-12 w-full rounded-2xl" />
      <Skeleton className="h-12 w-full rounded-2xl" />
    </div>
  );
}
