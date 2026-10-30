export interface CourseLevel {
  id: string;
  title: string;
  description: string;
}
export interface Lesson {
  id: number;
  levelId: string;
  title: string;
  grammarIds: string[];
}
export interface GrammarTopic {
  id: string;
  title: string;
  lessonRefs: { levelId: string; lesson: number }[];
  useVi: string;
  forms: string[];
  examples: { en: string; vi: string }[];
  mistakes: { wrong: string; correct: string; why: string }[];
  compareVi: string;
  sources: { title: string; url: string }[];
}
export interface PracticeQuestion {
  id: string;
  levelId: string;
  lessonId: number;
  topicId: string;
  kind: "vocabulary" | "grammar";
  source: "original" | "additional";
  exercise: string;
  prompt: string;
  context?: string;
  instruction: string;
  answers: string[][];
  explanationVi: string;
  sourceRef: string;
  scoreable: boolean;
  noteVi?: string;
}
export interface PracticeSession {
  id: string;
  mode: "learn" | "test";
  questionIds: string[];
  answers: Record<string, string[]>;
  checked: string[];
  index: number;
  submitted: boolean;
  startedAt: string;
}
export interface QuestionProgress {
  attempts: number;
  correctAttempts: number;
  lastCorrect: boolean;
  lastAnswer: string[];
  lastAttemptAt: string;
}
export interface CoursePracticeSnapshot {
  version: 1;
  session: PracticeSession | null;
  questions: Record<string, QuestionProgress>;
  history: {
    id: string;
    date: string;
    total: number;
    correct: number;
    lessonIds: number[];
  }[];
}
