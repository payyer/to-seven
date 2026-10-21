import { LocalStudyRepository } from "./local";
import type { StudyRepository } from "./types";

export type { StudyRepository } from "./types";

let instance: StudyRepository | null = null;

/**
 * Điểm duy nhất chọn nơi lưu trữ. Khi chuyển sang Supabase,
 * chỉ cần viết `SupabaseStudyRepository implements StudyRepository` và trả về ở đây.
 */
export function getRepository(): StudyRepository {
  instance ??= new LocalStudyRepository();
  return instance;
}
