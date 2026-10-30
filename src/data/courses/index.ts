import original from "./original.json";
import { ADDITIONAL_QUESTIONS } from "./additional";
import { GRAMMAR_TOPICS } from "./grammar";
import type {
  CourseLevel,
  Lesson,
  PracticeQuestion,
} from "@/lib/courses/types";
export const COURSE_LEVELS: CourseLevel[] = [
  {
    id: "pre-intermediate",
    title: "Pre-intermediate",
    description:
      "12 lesson · Communicating, Travel, Money, Social Life và Work",
  },
];
const titles = [
  "Giao tiếp và câu hỏi",
  "Chào hỏi và giữ liên lạc",
  "Du lịch và các thì quá khứ",
  "Hỏi thông tin du lịch",
  "Ôn tập Unit 1–2",
  "Tiền bạc và hiện tại hoàn thành",
  "Mua sắm và từ thiện",
  "Trang phục và kế hoạch tương lai",
  "Lời mời và sắp xếp lịch",
  "Ôn tập Unit 3–4",
  "Công việc và nội quy",
  "Ứng tuyển, đề nghị và gợi ý",
];
export const LESSONS: Lesson[] = titles.map((title, i) => ({
  id: i + 1,
  levelId: "pre-intermediate",
  title,
  grammarIds: GRAMMAR_TOPICS.filter((t) =>
    t.lessonRefs.some(
      (ref) => ref.levelId === "pre-intermediate" && ref.lesson === i + 1,
    ),
  ).map((t) => t.id),
}));
export const COURSE_QUESTIONS: PracticeQuestion[] = [
  ...(original as PracticeQuestion[]),
  ...ADDITIONAL_QUESTIONS,
];
export const COURSE_QUESTION_BY_ID = Object.fromEntries(
  COURSE_QUESTIONS.map((q) => [q.id, q]),
);
