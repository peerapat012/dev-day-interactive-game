import { PageShell } from "@/shared/components/PageShell";
import { CloudPageClient } from "@/features/cloud/components/CloudPageClient";

export default function HomePage() {
  return (
    <PageShell
      title="Live raw cloud"
      description="Submit phrases to the live cloud. Classification runs when you open Summary and press Summarize."
    >
      <CloudPageClient />
    </PageShell>
  );
}
