"use client";

import { CloudInput } from "@/features/cloud/components/CloudInput";
import { RawWordCloud } from "@/features/cloud/components/RawWordCloud";

export function CloudPageClient() {
  return (
    <div className="flex min-h-0 flex-1 flex-col gap-3 sm:gap-4">
      <div className="sticky top-0 z-20 -mx-1 bg-zinc-950/90 px-1 pb-2 pt-0 backdrop-blur-md md:static md:bg-transparent md:backdrop-blur-none">
        <CloudInput />
      </div>
      <div className="min-h-[min(50dvh,420px)] flex-1">
        <RawWordCloud />
      </div>
    </div>
  );
}
