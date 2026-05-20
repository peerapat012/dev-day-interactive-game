import type { Metadata } from "next";
import { HomeScreen } from "@/features/home/components/HomeScreen";

export const metadata: Metadata = {
  title: "Word Cloud Game",
  description: "Host a session or join as a guest",
};

export default function HomePage() {
  return <HomeScreen />;
}
