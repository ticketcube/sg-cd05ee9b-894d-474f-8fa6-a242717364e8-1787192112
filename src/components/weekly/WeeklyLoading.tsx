// src/components/weekly/WeeklyLoading.tsx
import { Skeleton } from "@/components/ui/skeleton";

export function WeeklyLoading() {
    return (
        <div className="space-y-4">
            <Skeleton className="h-8 w-1/4 mb-6" />
            <div className="border border-dashed rounded-lg p-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-3">
                        <Skeleton className="h-[125px] w-full rounded-xl" />
                        <div className="space-y-2">
                            <Skeleton className="h-4 w-4/5" />
                            <Skeleton className="h-4 w-3/5" />
                        </div>
                    </div>
                    <div className="space-y-3">
                        <Skeleton className="h-[125px] w-full rounded-xl" />
                        <div className="space-y-2">
                            <Skeleton className="h-4 w-4/5" />
                            <Skeleton className="h-4 w-3/5" />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}