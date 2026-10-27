import type {
  CardState,
  DailyPlan,
  DayActivity,
  DictationResult,
  ErrorEntry,
  PlacementResult,
  SentenceAttempt,
  Settings,
  SpeakingAttempt,
  StudySnapshot,
  WeeklyReport,
  WritingSubmission,
} from "../types";

/**
 * Ranh giới giữa app và nơi lưu dữ liệu học tập.
 * Mọi phương thức đều async để có thể thay LocalStorage bằng Supabase
 * (mỗi phương thức ứng với một bảng / một upsert) mà không phải sửa UI.
 */
export interface StudyRepository {
  saveDraft(week: string, text: string): Promise<void>;
  load(): Promise<StudySnapshot>;
  saveSettings(settings: Settings): Promise<void>;
  saveCards(cards: CardState[]): Promise<void>;
  savePlan(plan: DailyPlan): Promise<void>;
  saveActivity(date: string, activity: DayActivity): Promise<void>;
  savePlacement(result: PlacementResult): Promise<void>;
  appendSentence(attempt: SentenceAttempt): Promise<void>;
  /** Upsert theo id. */
  saveErrors(entries: ErrorEntry[]): Promise<void>;
  deleteError(id: string): Promise<void>;
  appendDictation(result: DictationResult): Promise<void>;
  appendSpeaking(attempt: SpeakingAttempt): Promise<void>;
  appendWriting(submission: WritingSubmission): Promise<void>;
  /** Upsert theo tuần. */
  saveReport(report: WeeklyReport): Promise<void>;
  /** Ghi đè toàn bộ dữ liệu (dùng khi nhập file sao lưu). */
  replaceAll(snapshot: StudySnapshot): Promise<void>;
  clearAll(): Promise<void>;
}
