import { PageShell } from "@/shared/components/PageShell";
import { CloudPageClient } from "@/features/cloud/components/CloudPageClient";

export default function HomePage() {
  return (
    <PageShell
      title="Live raw cloud"
      description="Submit short phrases. They appear as animated bubbles sized by frequency, synced in real time."
      showGameNav={false}
    >
      <CloudPageClient />
    </PageShell>
  );
}
