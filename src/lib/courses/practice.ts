import { z } from "zod";
import type {
  CoursePracticeSnapshot,
  PracticeQuestion,
  PracticeSession,
} from "./types";

const id = z.string().min(1).max(160);
const answer = z.array(z.string().max(2000)).max(50);
const session = z
  .object({
    id,
    mode: z.enum(["learn", "test"]),
    questionIds: z.array(id).max(2000),
    answers: z.record(id, answer),
    checked: z.array(id).max(2000),
    index: z.number().int().nonnegative(),
    submitted: z.boolean(),
    startedAt: z.iso.datetime(),
  })
  .superRefine((s, ctx) => {
    if (
      !s.questionIds.length ||
      new Set(s.questionIds).size !== s.questionIds.length ||
      s.index >= s.questionIds.length ||
      s.checked.some((q) => !s.questionIds.includes(q)) ||
      Object.keys(s.answers).some((q) => !s.questionIds.includes(q))
    ) {
      ctx.addIssue({ code: "custom", message: "Lượt làm không hợp lệ." });
    }
  });
export const courseSnapshotSchema = z.object({
  version: z.literal(1),
  session: session.nullable(),
  questions: z.record(
    id,
    z
      .object({
        attempts: z.number().int().nonnegative(),
        correctAttempts: z.number().int().nonnegative(),
        lastCorrect: z.boolean(),
        lastAnswer: answer,
        lastAttemptAt: z.iso.datetime(),
      })
      .refine((p) => p.correctAttempts <= p.attempts),
  ),
  history: z
    .array(
      z
        .object({
          id,
          date: z.iso.datetime(),
          total: z.number().int().nonnegative(),
          correct: z.number().int().nonnegative(),
          lessonIds: z.array(z.number().int().positive()),
        })
        .refine((h) => h.correct <= h.total),
    )
    .max(100),
});
export function emptyCourseSnapshot(): CoursePracticeSnapshot {
  return { version: 1, session: null, questions: {}, history: [] };
}
export function parseCourseSnapshot(value: unknown): CoursePracticeSnapshot {
  return courseSnapshotSchema.parse(value);
}
export function normalizeCourseAnswer(value: string): string {
  return value
    .normalize("NFKC")
    .toLowerCase()
    .replace(/[‘’`]/g, "'")
    .trim()
    .replace(/[.!?]+$/g, "")
    .replace(/\bwon't\b/g, "will not")
    .replace(/\bcan't\b/g, "can not")
    .replace(/\bcannot\b/g, "can not")
    .replace(/\b([a-z]+)n't\b/g, "$1 not")
    .replace(/\b([a-z]+)'ll\b/g, "$1 will")
    .replace(/\b([a-z]+)'re\b/g, "$1 are")
    .replace(/\b([a-z]+)'ve\b/g, "$1 have")
    .replace(/\bi'm\b/g, "i am")
    .replace(/\bi'd (?=love|like|rather)/g, "i would ")
    .replace(/\s+/g, " ")
    .trim();
}
export function checkCourseAnswer(
  q: PracticeQuestion,
  input: string[],
): boolean {
  return (
    q.scoreable &&
    input.length === q.answers.length &&
    q.answers.every((options, i) =>
      options.some(
        (option) =>
          normalizeCourseAnswer(option) ===
          normalizeCourseAnswer(input[i] ?? ""),
      ),
    )
  );
}
export function createSession(
  questions: PracticeQuestion[],
  mode: PracticeSession["mode"],
  size: number,
  random = Math.random,
): PracticeSession {
  const shuffled = [...questions];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return {
    id: crypto.randomUUID(),
    mode,
    questionIds: shuffled.slice(0, size).map((q) => q.id),
    answers: {},
    checked: [],
    index: 0,
    submitted: false,
    startedAt: new Date().toISOString(),
  };
}
export function recordAnswer(
  snapshot: CoursePracticeSnapshot,
  q: PracticeQuestion,
  now = new Date().toISOString(),
): CoursePracticeSnapshot {
  const s = snapshot.session;
  if (
    !s ||
    s.submitted ||
    s.checked.includes(q.id) ||
    !s.questionIds.includes(q.id)
  )
    return snapshot;
  if (!q.scoreable)
    return { ...snapshot, session: { ...s, checked: [...s.checked, q.id] } };
  const given = s.answers[q.id] ?? q.answers.map(() => "");
  const ok = checkCourseAnswer(q, given),
    previous = snapshot.questions[q.id];
  return {
    ...snapshot,
    session: { ...s, checked: [...s.checked, q.id] },
    questions: {
      ...snapshot.questions,
      [q.id]: {
        attempts: (previous?.attempts ?? 0) + 1,
        correctAttempts: (previous?.correctAttempts ?? 0) + Number(ok),
        lastCorrect: ok,
        lastAnswer: given,
        lastAttemptAt: now,
      },
    },
  };
}
export function submitSession(
  snapshot: CoursePracticeSnapshot,
  byId: Record<string, PracticeQuestion>,
): CoursePracticeSnapshot {
  const s = snapshot.session;
  if (!s || s.submitted) return snapshot;
  let next = snapshot;
  for (const id of s.questionIds)
    if (byId[id]) next = recordAnswer(next, byId[id]);
  const known = s.questionIds.filter((id) => byId[id]?.scoreable);
  return {
    ...next,
    session: { ...next.session!, submitted: true },
    history: [
      ...next.history,
      {
        id: s.id,
        date: new Date().toISOString(),
        total: known.length,
        correct: known.filter((id) =>
          checkCourseAnswer(byId[id], s.answers[id] ?? []),
        ).length,
        lessonIds: [
          ...new Set(
            s.questionIds
              .map((id) => byId[id]?.lessonId)
              .filter((id): id is number => !!id),
          ),
        ],
      },
    ].slice(-100),
  };
}
