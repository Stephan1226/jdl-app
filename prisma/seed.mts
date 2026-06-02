import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { createClient } from "@supabase/supabase-js";
import { PrismaClient } from "../app/generated/prisma/client";

// 데모 로그인 계정 (시연용). 시드는 이 유저를 Supabase Auth에 만들고(이메일 확인됨),
// 같은 UUID로 Prisma 데이터를 주입한다 → 바로 로그인해서 데모 데이터를 볼 수 있다.
const DEMO_EMAIL = "me@jdl.app";
const DEMO_PASSWORD = "jdl-demo-1234";

const adapter = new PrismaPg({
  connectionString: process.env.DIRECT_URL ?? process.env.DATABASE_URL,
});
const prisma = new PrismaClient({ adapter });

/** Supabase Auth에 확인된 데모 유저를 보장하고 그 id(UUID)를 반환한다. */
async function ensureDemoAuthUser(): Promise<string> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error(
      "시드에는 NEXT_PUBLIC_SUPABASE_URL 과 SUPABASE_SERVICE_ROLE_KEY 가 .env에 필요합니다.",
    );
  }

  const admin = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const { data: created } = await admin.auth.admin.createUser({
    email: DEMO_EMAIL,
    password: DEMO_PASSWORD,
    email_confirm: true,
    user_metadata: { name: "나" },
  });
  if (created?.user) return created.user.id;

  // 이미 존재하면 비밀번호·확인 상태를 데모 기본값으로 보정 후 재사용(재실행 시 항상 로그인 가능).
  const { data: list } = await admin.auth.admin.listUsers({ perPage: 1000 });
  const existing = list?.users.find((u) => u.email === DEMO_EMAIL);
  if (existing) {
    await admin.auth.admin.updateUserById(existing.id, {
      password: DEMO_PASSWORD,
      email_confirm: true,
    });
    return existing.id;
  }

  throw new Error("데모 Auth 유저를 생성하거나 찾지 못했습니다.");
}

async function main() {
  console.log("🌱 시드 시작...");

  const userId = await ensureDemoAuthUser();

  // 데모 유저의 기존 데이터만 정리(다른 유저 데이터는 건드리지 않는다).
  await prisma.tagsOnEntries.deleteMany({ where: { entry: { userId } } });
  await prisma.entry.deleteMany({ where: { userId } });
  await prisma.tag.deleteMany({ where: { userId } });
  await prisma.book.deleteMany({ where: { userId } });
  await prisma.goal.deleteMany({ where: { userId } });

  // Supabase auth.users ↔ Prisma User 브리지(같은 id).
  const user = await prisma.user.upsert({
    where: { id: userId },
    update: { email: DEMO_EMAIL, name: "나" },
    create: { id: userId, email: DEMO_EMAIL, name: "나" },
  });

  // 태그
  const tagDefs = [
    { name: "성장", color: "#6366f1" },
    { name: "회고", color: "#10b981" },
    { name: "기술", color: "#f59e0b" },
    { name: "에세이", color: "#ec4899" },
    { name: "영감", color: "#8b5cf6" },
  ];
  const tags: Record<string, string> = {};
  for (const t of tagDefs) {
    const created = await prisma.tag.create({ data: { ...t, userId: user.id } });
    tags[t.name] = created.id;
  }

  // 책
  const [dollargut, cleanCode, courage] = await Promise.all([
    prisma.book.create({
      data: { userId: user.id, title: "달러구트 꿈 백화점", author: "이미예", totalPages: 300 },
    }),
    prisma.book.create({
      data: { userId: user.id, title: "클린 코드", author: "로버트 C. 마틴", totalPages: 584 },
    }),
    prisma.book.create({
      data: { userId: user.id, title: "미움받을 용기", author: "기시미 이치로", totalPages: 336 },
    }),
  ]);

  // 목표
  const [readingGoal, blogGoal, retroGoal] = await Promise.all([
    prisma.goal.create({
      data: {
        userId: user.id,
        title: "2026년 책 12권 읽기",
        description: "한 달에 한 권씩, 다양한 장르로.",
        status: "ACTIVE",
        targetValue: 12,
        currentValue: 3,
        unit: "권",
        startDate: new Date("2026-01-01"),
        targetDate: new Date("2026-12-31"),
      },
    }),
    prisma.goal.create({
      data: {
        userId: user.id,
        title: "기술 블로그 10편 쓰기",
        description: "배운 걸 글로 정리해 남기기.",
        status: "ACTIVE",
        targetValue: 10,
        currentValue: 4,
        unit: "편",
        startDate: new Date("2026-02-01"),
        targetDate: new Date("2026-08-31"),
      },
    }),
    prisma.goal.create({
      data: {
        userId: user.id,
        title: "매주 일요일 회고 쓰기",
        description: "한 주를 돌아보는 습관.",
        status: "ACTIVE",
        unit: "회",
        currentValue: 7,
        startDate: new Date("2026-03-01"),
      },
    }),
  ]);

  // 기록 생성 헬퍼 — 태그 이름 배열을 조인으로 연결
  async function entry(data: {
    type: string;
    title?: string;
    content: string;
    source?: string;
    sourceRef?: string;
    mood?: number;
    occurredAt: string;
    bookId?: string;
    goalId?: string;
    tags?: string[];
  }) {
    const { tags: tagNames = [], occurredAt, ...rest } = data;
    return prisma.entry.create({
      data: {
        ...rest,
        userId: user.id,
        occurredAt: new Date(occurredAt),
        tags: {
          create: tagNames.map((n) => ({ tag: { connect: { id: tags[n] } } })),
        },
      },
    });
  }

  await entry({ type: "THOUGHT", content: "새해 목표를 너무 많이 잡았나? 그래도 기록으로 남기니 덜 불안하다.", source: "MANUAL", mood: 0, occurredAt: "2026-01-03", tags: ["회고"] });
  await entry({ type: "BOOK", title: "『달러구트 꿈 백화점』을 읽고", content: "꿈을 사고파는 상점이라는 설정이 따뜻했다. 잠들기 전 마음이 한결 가벼워지는 책.", source: "PAPER", mood: 2, occurredAt: "2026-01-12", bookId: dollargut.id, goalId: readingGoal.id, tags: ["에세이", "영감"] });
  await entry({ type: "BOOK", title: "클린 코드 1~3장", content: "의미 있는 이름, 함수는 작게. 머리로는 알지만 실제 코드에 적용이 어렵다.", source: "NOTE_APP", sourceRef: "notion://page/clean-code", mood: 1, occurredAt: "2026-02-08", bookId: cleanCode.id, goalId: readingGoal.id, tags: ["기술", "성장"] });
  await entry({ type: "GOAL_LOG", title: "블로그 1편 발행", content: "Prisma 마이그레이션 경험을 글로 정리했다. 막상 쓰니 머릿속이 정리된다.", source: "EXTERNAL", sourceRef: "https://blog.example.com/prisma", mood: 1, occurredAt: "2026-02-20", goalId: blogGoal.id, tags: ["기술"] });
  await entry({ type: "THOUGHT", content: "요즘 집중이 잘 안 된다. 알림을 꺼봐야겠다.", source: "MANUAL", mood: -1, occurredAt: "2026-03-05", tags: ["회고"] });
  await entry({ type: "BOOK", title: "『미움받을 용기』 — 과제의 분리", content: "타인의 기대를 만족시키려 살지 않아도 된다. '과제의 분리' 개념이 인상 깊다.", source: "MANUAL", mood: 2, occurredAt: "2026-03-18", bookId: courage.id, goalId: readingGoal.id, tags: ["에세이", "성장", "영감"] });
  await entry({ type: "GOAL_LOG", title: "회고 7주차", content: "이번 주는 운동을 3번 했다. 작은 성취가 쌓인다.", source: "MANUAL", mood: 1, occurredAt: "2026-03-29", goalId: retroGoal.id, tags: ["회고"] });
  await entry({ type: "NOTE", title: "아이디어: 기록 통합 앱", content: "종이·노트앱·외부서비스에 흩어진 기록을 한 곳에서. 이게 jdl의 시작이었다.", source: "PAPER", mood: 2, occurredAt: "2026-04-02", tags: ["영감", "성장"] });
  await entry({ type: "BOOK", title: "클린 코드 — 함수", content: "한 가지만 하는 함수. 리팩터링하면서 테스트의 중요성을 다시 느낀다.", source: "NOTE_APP", mood: 0, occurredAt: "2026-04-15", bookId: cleanCode.id, goalId: readingGoal.id, tags: ["기술"] });
  await entry({ type: "THOUGHT", content: "조금 지친다. 잠시 쉬어가도 괜찮다고 스스로에게 말해준다.", source: "MANUAL", mood: -2, occurredAt: "2026-04-28", tags: ["회고"] });
  await entry({ type: "GOAL_LOG", title: "블로그 4편째", content: "꾸준함이 어렵지만 4편을 채웠다.", source: "EXTERNAL", sourceRef: "https://blog.example.com/4", mood: 1, occurredAt: "2026-05-10", goalId: blogGoal.id, tags: ["기술", "성장"] });
  await entry({ type: "THOUGHT", content: "다시 기록을 시작했다. 흐름을 시각화해보니 내 감정의 곡선이 보인다.", source: "MANUAL", mood: 1, occurredAt: "2026-05-25", tags: ["회고", "영감"] });

  const counts = {
    users: await prisma.user.count(),
    books: await prisma.book.count(),
    entries: await prisma.entry.count(),
    tags: await prisma.tag.count(),
    goals: await prisma.goal.count(),
  };
  console.log("✅ 시드 완료:", counts);
  console.log(`🔑 데모 로그인: ${DEMO_EMAIL} / ${DEMO_PASSWORD}`);
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error("❌ 시드 실패:", e);
    await prisma.$disconnect();
    process.exit(1);
  });
