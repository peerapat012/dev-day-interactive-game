"use client";

import { HostSummaryContent } from "@/features/host/components/HostSummaryContent";

export function HostSummaryTab({ isActive }: { isActive: boolean }) {
  return <HostSummaryContent isActive={isActive} />;
}
