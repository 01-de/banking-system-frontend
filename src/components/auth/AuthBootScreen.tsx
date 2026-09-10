import { Skeleton } from "@/components/ui/skeleton";

export function AuthBootScreen() {
  return (
    <div className="mx-auto flex min-h-svh w-full max-w-md flex-col justify-center gap-4 px-4 md:max-w-2xl">
      <div className="flex flex-col gap-4 md:rounded-card md:border md:border-border md:bg-card md:p-10 md:shadow-sm">
        <Skeleton className="h-6 w-1/2" />
        <Skeleton className="h-12 w-full rounded-2xl" />
        <Skeleton className="h-12 w-full rounded-2xl" />
      </div>
    </div>
  );
}
