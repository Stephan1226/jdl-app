import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { GoalForm } from "@/components/goal-form";
import { PageHeader } from "@/components/ui";
import { prisma } from "@/lib/db";
import { toDateInput } from "@/lib/format";
import { getCurrentUserId } from "@/lib/user";
import { updateGoal } from "../../actions";

export default async function EditGoalPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const userId = await getCurrentUserId();
  const goal = await prisma.goal.findFirst({ where: { id, userId } });
  if (!goal) notFound();

  return (
    <div className="space-y-6">
      <Link
        href={`/goals/${goal.id}`}
        className="inline-flex items-center gap-1 text-sm text-muted hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" /> 목표로
      </Link>
      <PageHeader title="목표 수정" />
      <GoalForm
        action={updateGoal.bind(null, goal.id)}
        defaults={{
          title: goal.title,
          description: goal.description ?? "",
          status: goal.status,
          targetValue: goal.targetValue,
          currentValue: goal.currentValue,
          unit: goal.unit ?? "",
          targetDate: goal.targetDate ? toDateInput(goal.targetDate) : "",
        }}
        submitLabel="수정 저장"
      />
    </div>
  );
}
