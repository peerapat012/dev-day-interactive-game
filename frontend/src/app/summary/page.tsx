import type { Metadata } from "next";
import { HostScreen } from "@/features/host/components/HostScreen";

export const metadata: Metadata = {
  title: "Summary — Word Cloud Game",
  description: "Host summary of guest submissions",
};

export default function SummaryPage() {
  return <HostScreen initialTab="summary" />;
}
