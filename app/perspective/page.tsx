import { getThinkingProfile } from "@/lib/data/perspective";
import { getCurrentUserId } from "@/lib/user";
import { PerspectiveView } from "./perspective-view";

export const dynamic = "force-dynamic";

export default async function PerspectivePage() {
  const userId = await getCurrentUserId();
  const { total, axes } = await getThinkingProfile(userId);

  return <PerspectiveView entryCount={total} axes={axes} />;
}
