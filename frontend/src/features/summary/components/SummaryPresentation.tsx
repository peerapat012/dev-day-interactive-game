"use client";

import { SummaryContent } from "@/features/summary/components/SummaryContent";
import { PageShell } from "@/shared/components/PageShell";

export function SummaryPresentation() {
  return (
    <PageShell
      title="Summary"
      description="Classify submissions and view the top groups with AI-generated summaries."
    >
      <SummaryContent />
    </PageShell>
  );
}
