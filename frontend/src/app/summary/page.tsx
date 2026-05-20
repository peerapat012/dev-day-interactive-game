import { redirect } from "next/navigation";
import { HOST_PATH } from "@/lib/hostPaths";

export default function SummaryPage() {
  redirect(HOST_PATH);
}
