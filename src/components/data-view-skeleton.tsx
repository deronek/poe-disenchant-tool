import { Skeleton } from "@/components/ui/skeleton";

export default function DataViewSkeleton() {
  return (
    <div>
      {/* Last Updated */}
      <Skeleton className="h-[32px] w-[200px]" />
      <div className="xl:pt-6 xl:pb-4">
        <div className="mx-auto w-full max-w-md rounded-md border pt-2 md:max-w-4xl lg:max-w-screen-xl">
          {/* Desktop Toolbar */}
          <div className="hidden lg:block">
            <div className="flex gap-3 border-b p-2">
              <div className="w-full">
                <div className="grid grid-cols-[minmax(0,theme(maxWidth.3xs))_1fr] items-start gap-3 xl:flex xl:flex-nowrap xl:items-center">
                  <div className="w-full min-w-0 xl:w-3xs xl:flex-none">
                    <Skeleton className="h-10 w-full min-w-0 xl:w-3xs xl:flex-none" />
                  </div>
                </div>
              </div>
            </div>
          </div>
          {/* TODO: add rest */}
          {/* Mobile Toolbar */}
          {/* <div className="lg:hidden">
            <div className="flex gap-3 border-b p-3">
              <div className="w-full">
                <div className="grid grid-cols-[minmax(0,theme(maxWidth.3xs))_1fr] items-start gap-3 xl:flex xl:flex-nowrap xl:items-center">
                  <div className="w-full min-w-0 xl:w-3xs xl:flex-none">
                    <div className="h-10 rounded bg-gray-300" />
                  </div>
                  <div className="w-full min-w-0 xl:w-auto xl:shrink-0">
                    <div className="h-10 rounded bg-gray-300" />
                  </div>
                </div>
              </div>
              <div className="flex flex-col items-center gap-2 md:ml-auto xl:flex-row">
                <div className="h-10 w-full rounded bg-gray-300 xl:w-auto" />
                <div className="h-10 w-full rounded bg-gray-300 xl:w-auto" />
              </div>
            </div>
          </div> */}

          {/* Mobile Card Layout */}
          {/* <div className="lg:hidden">
            <div className="space-y-2 p-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="h-20 rounded bg-gray-300" />
              ))}
            </div>
          </div> */}

          {/* Desktop Table Layout */}
          <div className="hidden overflow-x-auto px-1 lg:block">
            <div className="w-full text-sm">
              <div className="border-b">
                <div className="flex gap-4 p-2">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <Skeleton key={i} className="h-10 w-full" />
                  ))}
                </div>
              </div>
              <div className="divide-y">
                {Array.from({ length: 10 }).map((_, i) => (
                  <div key={i} className="flex gap-4 p-2">
                    {Array.from({ length: 6 }).map((_, cellIndex) => (
                      <Skeleton key={cellIndex} className="h-[40px] w-full" />
                    ))}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Pagination */}
          <div className="border-t p-4">
            <div className="flex items-center justify-between">
              <Skeleton className="h-8 w-24" />
              <div className="flex gap-2">
                <Skeleton className="h-8 w-24" />
                <Skeleton className="h-8 w-24" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
