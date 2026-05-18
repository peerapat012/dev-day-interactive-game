import { PageShell } from "@/shared/components/PageShell";
import { GroupWordCloud } from "@/features/groups/components/GroupWordCloud";

export default function GroupsPage() {
  return (
    <PageShell
      title="Grouped categories"
      description="Semantic groups emerge from classification. Click a bubble to inspect related inputs."
    >
      <GroupWordCloud />
    </PageShell>
  );
}
