import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

export function VehicleCardSkeleton() {
  return (
    <Card className="overflow-hidden rounded-2xl border-border/40 bg-card">
      {/* Image skeleton */}
      <Skeleton className="aspect-[16/10] w-full rounded-none" />

      <CardContent className="p-4 space-y-3">
        {/* Title & Price */}
        <div className="flex items-start justify-between gap-2">
          <div className="space-y-1.5 flex-1">
            <Skeleton className="h-5 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
          </div>
          <div className="space-y-1 text-right">
            <Skeleton className="h-6 w-16 ml-auto" />
            <Skeleton className="h-3 w-12 ml-auto" />
          </div>
        </div>

        {/* Detail chips */}
        <div className="flex gap-1.5">
          <Skeleton className="h-6 w-16 rounded-full" />
          <Skeleton className="h-6 w-14 rounded-full" />
          <Skeleton className="h-6 w-20 rounded-full" />
        </div>

        {/* Apps */}
        <div className="flex gap-1.5 pt-1 border-t border-border/40">
          <Skeleton className="h-5 w-12 rounded-full" />
          <Skeleton className="h-5 w-10 rounded-full" />
        </div>
      </CardContent>
    </Card>
  );
}
