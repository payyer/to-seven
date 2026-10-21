export type Level = "A1" | "A2" | "B1" | "B2";
export const LEVELS: Level[] = ["A1", "A2", "B1", "B2"];

/** n: danh từ, v: động từ, adj: tính từ, adv: trạng từ, phr: cụm từ, phrv: cụm động từ */
export type PartOfSpeech = "n" | "v" | "adj" | "adv" | "phr" | "phrv";

export type TopicId =
  | "work"
  | "study"
  | "home"
  | "hometown"
  | "routine"
  | "hobbies"
  | "food"
  | "travel"
  | "technology"
  | "health"
  | "weather"
  | "shopping"
  | "people"
  | "entertainment"
  /** Từ người học tự thêm. */
  | "mylist"
  /** Từ vựng trên lớp (các LIST của trung tâm). */
  | "class";

export interface Topic {
  id: TopicId;
  name: string;
  /** Câu hỏi Part 1 mẫu cho chủ đề, dùng để gợi ý ngữ cảnh. */
  sampleQuestion: string;
}

export interface Word {
  id: string;
  word: string;
  pos: PartOfSpeech;
  vi: string;
  /** Phiên âm IPA (giọng Anh-Anh). */
  ipa: string;
  /**
   * Âm tiết ngăn bởi "·", âm tiết mang trọng âm viết HOA.
   * Ví dụ: "COL·league", "ex·PE·ri·ence". Cụm từ giữ nguyên dấu cách/gạch nối: "part-TIME".
   */
  stress: string;
  level: Level;
  topic: TopicId;
  collocations: [string, string];
  example: string;
  exampleVi: string;
  /** Cách viết khác được chấp nhận khi gõ (ví dụ chính tả Anh-Mỹ). */
  altSpellings?: string[];
  /** Các LIST trên lớp có từ này (LIST 1, 2…). */
  classLists?: number[];
}

export type Grade = "again" | "hard" | "good" | "easy";

export interface CardState {
  wordId: string;
  /** Số lần nhớ liên tiếp (bậc trong lịch 1-3-7-14). */
  reps: number;
  ease: number;
  /** Khoảng cách ôn hiện tại (ngày). */
  interval: number;
  /** Ngày đến hạn ôn, dạng YYYY-MM-DD. */
  due: string;
  lapses: number;
  learnedAt: string;
  lastReviewedAt?: string;
  /** Ngày từ đạt mốc "đã thuộc" (interval >= 14). Bị xoá khi quên. */
  masteredAt?: string;
  /** Người dùng bấm "Tôi đã biết từ này" khi học mới. */
  known?: boolean;
}

export interface DailyPlan {
  date: string;
  wordIds: string[];
  /** Số từ học thêm ngoài chỉ tiêu trong ngày. */
  extra: number;
}

export interface DayActivity {
  newWords: number;
  reviews: number;
  forgot: number;
  /** Các trường dưới thêm từ giai đoạn 2, có thể vắng trong dữ liệu cũ. */
  sentences?: number;
  dictations?: number;
  errorReviews?: number;
  speaking?: number;
  writing?: number;
}

export interface Settings {
  dailyNewWords: number;
  focusLevel: Level;
  preferredTopics: TopicId[];
  preferRealAudio: boolean;
}

export interface PlacementBandScore {
  band: number;
  label: string;
  correct: number;
  wrong: number;
  unknown: number;
  /** Tỉ lệ đã hiệu chỉnh đoán mò, 0..1 */
  ratio: number;
}

export interface PlacementResult {
  takenAt: string;
  bands: PlacementBandScore[];
  estimatedFamilies: number;
  level: Level | "B2+";
  recommendedLevel: Level;
}

// ---- Giai đoạn 2: dùng từ (output) ----

export type ErrorCategory = "tense" | "agreement" | "article" | "spelling" | "word-choice" | "other";

/** Một lỗi AI chỉ ra trong câu người học viết. */
export interface SentenceIssue {
  /** Mã quy tắc ngữ pháp, xem `RULES` trong lib/mistakes.ts */
  rule: string;
  /** Đoạn sai, chép nguyên văn từ câu gốc. */
  wrong: string;
  /** Đoạn thay thế đúng. */
  correction: string;
  /** Gợi ý KHÔNG lộ đáp án — hiện trước để người học tự sửa. Dữ liệu cũ (giai đoạn 2) có thể thiếu. */
  hintVi?: string;
  /** Giải thích kèm đáp án — chỉ hiện sau khi người học đã thử. */
  explanationVi: string;
}

export type ErrorSource = "sentence" | "speaking" | "writing";

export interface SentenceFeedback {
  original: string;
  corrected: string;
  isCorrect: boolean;
  usesTargetWord: boolean;
  issues: SentenceIssue[];
  commentVi: string;
  /** Câu tương tự để luyện lại. */
  similar: { en: string; vi: string };
}

export interface SentenceAttempt {
  id: string;
  wordId: string | null;
  targetWord: string;
  createdAt: string;
  feedback: SentenceFeedback;
}

/** Một lỗi trong sổ lỗi sai, kèm trạng thái ôn (Leitner 5 hộp). */
export interface ErrorEntry {
  id: string;
  /** Khoá gom lỗi lặp lại: theo quy tắc (chính tả thì theo từ đúng). */
  pattern: string;
  category: ErrorCategory;
  rule: string;
  wrong: string;
  correction: string;
  explanationVi: string;
  hintVi?: string;
  /** Lỗi đến từ đâu; dữ liệu giai đoạn 2 không có trường này (= "sentence"). */
  source?: ErrorSource;
  sentence: string;
  corrected: string;
  similar: { en: string; vi: string };
  wordId: string | null;
  createdAt: string;
  box: number;
  due: string;
  lastReviewedAt?: string;
  fixedAt?: string;
}

export interface DictationResult {
  itemId: string;
  date: string;
  /** 0..1 */
  accuracy: number;
}

// ---- Giai đoạn 3: Speaking, Writing, báo cáo tuần ----

export type PeerStatus = "good" | "weak" | "missing";
export interface PeerPart {
  status: PeerStatus;
  commentVi: string;
}

export interface SpeakingFeedback {
  answer: string;
  peer: { point: PeerPart; explain: PeerPart; example: PeerPart; result: PeerPart };
  issues: SentenceIssue[];
  vocabUpgrades: { original: string; better: string; whyVi: string }[];
  /** Cách đưa từ mới học gần đây vào câu trả lời. */
  recentWordIdeas: { word: string; sentence: string }[];
  improvedAnswer: string;
  commentVi: string;
  practice: { en: string; vi: string };
}

export interface SpeakingAttempt {
  id: string;
  questionId: string;
  question: string;
  inputMode: "voice" | "text";
  durationSec: number | null;
  createdAt: string;
  feedback: SpeakingFeedback;
}

export interface WritingFeedback {
  text: string;
  issues: SentenceIssue[];
  /** Đổi từ văn nói / quá suồng sã sang giọng văn hợp với đề. */
  registerSuggestions: { original: string; better: string; whyVi: string }[];
  correctedText: string;
  /** Bài có trả lời đủ yêu cầu của đề không (đủ các gạch đầu dòng, đúng giọng văn). */
  taskCommentVi: string;
  commentVi: string;
  practice: { en: string; vi: string };
}

export interface WritingSubmission {
  id: string;
  /** Tuần ISO, ví dụ "2026-W42". */
  week: string;
  promptId: string;
  text: string;
  wordCount: number;
  createdAt: string;
  feedback: WritingFeedback;
}

export interface WeekStats {
  week: string;
  start: string;
  end: string;
  activeDays: number;
  newWords: number;
  mastered: number;
  reviews: number;
  forgot: number;
  /** Tỉ lệ nhớ khi ôn (lượt không chấm Quên / tổng lượt), null nếu chưa ôn. */
  reviewAccuracy: number | null;
  sentences: number;
  speaking: number;
  writing: number;
  dictations: number;
  dictationAvg: number | null;
  errorReviews: number;
  newErrors: number;
  topErrors: { pattern: string; label: string; count: number; wrong: string; correction: string }[];
}

export interface WeeklyPlan {
  summaryVi: string;
  focusAreas: { titleVi: string; whyVi: string; actionVi: string }[];
  days: { dayVi: string; tasksVi: string[] }[];
  suggestedDailyNewWords: number;
}

export interface WeeklyReport {
  week: string;
  createdAt: string;
  stats: WeekStats;
  plan: WeeklyPlan;
  /** "ai" = Claude soạn, "rule" = gợi ý theo luật khi không gọi được AI. */
  source: "ai" | "rule";
}

/** Toàn bộ dữ liệu cá nhân của người học. Đây là ranh giới giữa app và nơi lưu trữ. */
export interface StudySnapshot {
  settings: Settings;
  cards: Record<string, CardState>;
  plan: DailyPlan | null;
  activity: Record<string, DayActivity>;
  placement: PlacementResult | null;
  sentences: SentenceAttempt[];
  errors: ErrorEntry[];
  dictations: DictationResult[];
  speaking: SpeakingAttempt[];
  writings: WritingSubmission[];
  reports: WeeklyReport[];
}

export const DEFAULT_SETTINGS: Settings = {
  dailyNewWords: 10,
  focusLevel: "A2",
  preferredTopics: [],
  preferRealAudio: true,
};

export const POS_LABEL: Record<PartOfSpeech, string> = {
  n: "danh từ",
  v: "động từ",
  adj: "tính từ",
  adv: "trạng từ",
  phr: "cụm từ",
  phrv: "cụm động từ",
};
