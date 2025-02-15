import { Skeleton } from "@/components/ui/skeleton";

interface CategorySkeletonProps {
  level?: number;
  count?: number;
}

export function CategorySkeleton({
  level = 0,
  count = 3,
}: CategorySkeletonProps) {
  return (
    <div className="space-y-2">
      {Array.from({ length: count }).map((_, index) => (
        <div
          key={index}
          className="flex items-center gap-2 py-2"
          style={{ marginLeft: `${level * 1.5}rem` }}
        >
          <Skeleton className="h-4 w-4" />
          <Skeleton className="h-4 flex-1" />
          <div className="flex items-center gap-1">
            <Skeleton className="h-8 w-8" />
            <Skeleton className="h-8 w-8" />
          </div>
        </div>
      ))}
    </div>
  );
}
