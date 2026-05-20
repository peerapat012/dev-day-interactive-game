import type { Metadata } from "next";
import { HostScreen } from "@/features/host/components/HostScreen";

export const metadata: Metadata = {
  title: "Host — Word Cloud Game",
  description: "Host dashboard for classifying groups and viewing summaries",
};

export default function HostPage() {
  return <HostScreen />;
}
