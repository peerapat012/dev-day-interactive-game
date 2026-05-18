"use client";

import { Modal } from "@/shared/ui/Modal";
import { useEntriesStore } from "@/store/entriesStore";
import { useGroupStats } from "@/features/groups/hooks/useGroupStats";

export function GroupDetailPanel() {
  const selectedGroup = useEntriesStore((s) => s.selectedGroup);
  const setSelectedGroup = useEntriesStore((s) => s.setSelectedGroup);
  const { stats } = useGroupStats();

  const stat = stats.find((s) => s.group === selectedGroup);
  const open = Boolean(selectedGroup && stat);

  return (
    <Modal
      open={open}
      onClose={() => setSelectedGroup(null)}
      title={selectedGroup ?? ""}
    >
      <p className="mb-4 text-sm text-zinc-400">
        {stat?.count ?? 0} inputs in this group
      </p>
      <ul className="flex max-h-[70vh] flex-col gap-2 overflow-y-auto">
        {stat?.inputs.map((input, i) => (
          <li
            key={`${input}-${i}`}
            className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-zinc-200"
          >
            {input}
          </li>
        ))}
      </ul>
    </Modal>
  );
}
