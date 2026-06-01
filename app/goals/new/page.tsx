import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { GoalForm } from "@/components/goal-form";
import { PageHeader } from "@/components/ui";
import { createGoal } from "../actions";

export default function NewGoalPage() {
  return (
    <div className="space-y-6">
      <Link
        href="/goals"
        className="inline-flex items-center gap-1 text-sm text-muted hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" /> 목표로
      </Link>
      <PageHeader title="새 목표" description="이루고 싶은 것을 기록으로 관리해 보세요." />
      <GoalForm action={createGoal} submitLabel="목표 만들기" />
    </div>
  );
}
