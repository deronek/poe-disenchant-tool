import { redirect } from "next/navigation";

import { DEFAULT_LEAGUE } from "@/lib/leagues";

export default function Home() {
  // Redirect to default league
  redirect(`/${DEFAULT_LEAGUE}`);
}
