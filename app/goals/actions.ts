"use server";

import { revalidatePath } from "next/cache";
import { notFound, redirect } from "next/navigation";
import { goalInputSchema } from "@/lib/domain";
import { prisma } from "@/lib/db";
import { getCurrentUserId } from "@/lib/user";

function parseGoalForm(formData: FormData) {
  return goalInputSchema.parse({
    title: formData.get("title"),
    description: formData.get("description"),
    status: formData.get("status"),
    targetValue: formData.get("targetValue"),
    currentValue: formData.get("currentValue"),
    unit: formData.get("unit"),
    targetDate: formData.get("targetDate"),
  });
}

export async function createGoal(formData: FormData) {
  const userId = await getCurrentUserId();
  const d = parseGoalForm(formData);
  const goal = await prisma.goal.create({
    data: {
      userId,
      title: d.title,
      description: d.description ?? null,
      status: d.status,
      targetValue: d.targetValue ?? null,
      currentValue: d.currentValue,
      unit: d.unit ?? null,
      targetDate: d.targetDate ?? null,
    },
  });
  revalidatePath("/goals");
  revalidatePath("/");
  redirect(`/goals/${goal.id}`);
}

export async function updateGoal(id: string, formData: FormData) {
  const userId = await getCurrentUserId();
  const d = parseGoalForm(formData);

  // 소유권 확인 — 남의 목표는 수정 불가(IDOR 방지)
  const owned = await prisma.goal.findFirst({
    where: { id, userId },
    select: { id: true },
  });
  if (!owned) notFound();

  await prisma.goal.update({
    where: { id },
    data: {
      title: d.title,
      description: d.description ?? null,
      status: d.status,
      targetValue: d.targetValue ?? null,
      currentValue: d.currentValue,
      unit: d.unit ?? null,
      targetDate: d.targetDate ?? null,
    },
  });
  revalidatePath("/goals");
  revalidatePath(`/goals/${id}`);
  revalidatePath("/");
  redirect(`/goals/${id}`);
}

export async function deleteGoal(id: string) {
  const userId = await getCurrentUserId();
  // 연결된 기록은 onDelete: SetNull 로 보존된다. userId 스코프로 IDOR 방지.
  await prisma.goal.deleteMany({ where: { id, userId } });
  revalidatePath("/goals");
  revalidatePath("/entries");
  revalidatePath("/");
  redirect("/goals");
}
