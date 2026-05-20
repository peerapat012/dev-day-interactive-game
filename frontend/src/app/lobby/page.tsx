import { redirect } from "next/navigation";
import { HOME_PATH } from "@/lib/homePaths";

export default function LobbyPage() {
  redirect(HOME_PATH);
}
