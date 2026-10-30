import { describe, expect, it } from "vitest";
import {
  COURSE_QUESTIONS,
  COURSE_QUESTION_BY_ID,
  LESSONS,
} from "@/data/courses";
import { GRAMMAR_BY_ID } from "@/data/courses/grammar";
import { BASE_WORDS, WORDS } from "@/data/words";
import refs from "@/data/lesson-word-refs.json";
import {
  checkCourseAnswer,
  createSession,
  emptyCourseSnapshot,
  parseCourseSnapshot,
  recordAnswer,
  submitSession,
} from "./practice";
import type { PracticeQuestion } from "./types";
const question: PracticeQuestion = {
  id: "pre-intermediate-test-v1",
  levelId: "pre-intermediate",
  lessonId: 1,
  topicId: "present",
  kind: "grammar",
  source: "original",
  exercise: "test",
  prompt: "She ____ to school.",
  instruction: "Fill",
  answers: [["doesn't go", "does not go"]],
  explanationVi: "",
  sourceRef: "test",
  scoreable: true,
};
describe("course bank and preservation", () => {
  it("covers all 12 lessons, with exactly five vocabulary and five grammar additions each", () => {
    expect(LESSONS).toHaveLength(12);
    expect(new Set(COURSE_QUESTIONS.map((q) => q.id)).size).toBe(
      COURSE_QUESTIONS.length,
    );
    for (const l of LESSONS) {
      const extra = COURSE_QUESTIONS.filter(
        (q) => q.lessonId === l.id && q.source === "additional",
      );
      expect(extra.filter((q) => q.kind === "vocabulary")).toHaveLength(5);
      expect(extra.filter((q) => q.kind === "grammar")).toHaveLength(5);
      expect(
        COURSE_QUESTIONS.some(
          (q) => q.lessonId === l.id && q.source === "original",
        ),
      ).toBe(true);
    }
    for (const q of COURSE_QUESTIONS) {
      expect(q.answers.every((a) => a.length && a.every((s) => s.trim()))).toBe(
        true,
      );
      expect(q.sourceRef).toBeTruthy();
      if (q.kind === "grammar") expect(GRAMMAR_BY_ID[q.topicId]).toBeTruthy();
    }
  });
  it("retains every original word ID and contents, including the distinction between experience senses", () => {
    for (const w of BASE_WORDS)
      expect(WORDS.find((x) => x.id === w.id)).toEqual({
        ...w,
        lessonRefs: (refs as Record<string, unknown>)[w.id],
      });
    expect(WORDS.find((w) => w.id === "experience")?.vi).toBe("kinh nghiệm");
    expect(WORDS.find((w) => w.id === "experience-event")?.vi).toContain(
      "trải nghiệm",
    );
    for (const id of Object.keys(refs))
      expect(WORDS.some((w) => w.id === id)).toBe(true);
  });
});
describe("course marking", () => {
  it("normalizes presentation differences while rejecting wrong tense, missing auxiliaries and endings", () => {
    expect(checkCourseAnswer(question, ["  DOESN’T   go.  "])).toBe(true);
    expect(checkCourseAnswer(question, ["does not go"])).toBe(true);
    for (const input of [
      "don't go",
      "doesn't goes",
      "doesnt go",
      "didn't go",
      "go",
      "",
    ])
      expect(checkCourseAnswer(question, [input])).toBe(false);
  });
  it("requires every blank to be correct", () => {
    const q = { ...question, answers: [["Did"], ["visit"]] };
    expect(checkCourseAnswer(q, ["did", "visit"])).toBe(true);
    expect(checkCourseAnswer(q, ["did", "visited"])).toBe(false);
    expect(checkCourseAnswer(q, ["did"])).toBe(false);
  });
  it("does not score ambiguous open responses or add them to mistakes", () => {
    const q = { ...question, scoreable: false };
    let s = emptyCourseSnapshot();
    s.session = createSession([q], "learn", 1);
    s = recordAnswer(s, q);
    expect(s.questions).toEqual({});
    s = submitSession(s, { [q.id]: q });
    expect(s.history[0].total).toBe(0);
  });
  it("records first answers once, then removes a repaired mistake on the next run", () => {
    let s = emptyCourseSnapshot();
    s.session = createSession([question], "learn", 1);
    s = recordAnswer(s, question);
    s = recordAnswer(s, question);
    s = submitSession(s, { [question.id]: question });
    s = submitSession(s, { [question.id]: question });
    expect(s.questions[question.id].attempts).toBe(1);
    expect(s.history).toHaveLength(1);
    expect(s.questions[question.id].lastCorrect).toBe(false);
    s.session = createSession([question], "test", 1);
    s.session.answers[question.id] = ["does not go"];
    s = submitSession(s, { [question.id]: question });
    expect(s.questions[question.id].attempts).toBe(2);
    expect(s.questions[question.id].lastCorrect).toBe(true);
  });
  it("keeps answers across reload and tolerates later lessons/levels without discarding older question IDs", () => {
    const q = {
      ...question,
      id: "intermediate-l13-e1-q1-v1",
      levelId: "intermediate",
      lessonId: 13,
    };
    let s = emptyCourseSnapshot();
    s.session = createSession([q], "test", 1);
    s.session.answers[q.id] = ["does not go"];
    s = recordAnswer(s, q);
    expect(parseCourseSnapshot(JSON.parse(JSON.stringify(s)))).toEqual(s);
    const current = emptyCourseSnapshot();
    current.session = createSession(
      COURSE_QUESTIONS.slice(0, 20),
      "test",
      10,
      () => 0.5,
    );
    expect(new Set(current.session.questionIds).size).toBe(10);
    expect(
      current.session.questionIds.every((id) => COURSE_QUESTION_BY_ID[id]),
    ).toBe(true);
  });
});
