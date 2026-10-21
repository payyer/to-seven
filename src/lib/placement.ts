import { BAND_SIZE, PLACEMENT_BANDS } from "@/data/placement";
import type { Level, PlacementBandScore, PlacementResult } from "./types";

/** null = người dùng chọn "Tôi không biết". */
export type PlacementAnswer = { band: number; correct: boolean | null };

const OPTIONS_PER_ITEM = 4;
const MASTERY_RATIO = 0.8;

/**
 * Chấm bài kiểm tra theo band tần suất.
 * - Hiệu chỉnh đoán mò: điểm = đúng − sai/(số phương án − 1), không âm.
 * - Ước lượng word family = Σ (tỉ lệ band × 1.000).
 */
export function scorePlacement(answers: PlacementAnswer[], takenAt: string): PlacementResult {
  const bands: PlacementBandScore[] = PLACEMENT_BANDS.map((b) => {
    const own = answers.filter((a) => a.band === b.band);
    const correct = own.filter((a) => a.correct === true).length;
    const wrong = own.filter((a) => a.correct === false).length;
    const unknown = own.filter((a) => a.correct === null).length;
    const adjusted = Math.max(0, correct - wrong / (OPTIONS_PER_ITEM - 1));
    const ratio = b.items.length ? adjusted / b.items.length : 0;
    return { band: b.band, label: b.label, correct, wrong, unknown, ratio };
  });

  const estimatedFamilies = Math.round(bands.reduce((sum, b) => sum + b.ratio * BAND_SIZE, 0) / 50) * 50;

  const weakBand = PLACEMENT_BANDS.find((b) => (bands.find((s) => s.band === b.band)?.ratio ?? 0) < MASTERY_RATIO);
  const recommendedLevel: Level = weakBand ? weakBand.bankLevel : "B2";

  return {
    takenAt,
    bands,
    estimatedFamilies,
    level: levelFromFamilies(estimatedFamilies),
    recommendedLevel,
  };
}

/** Ngưỡng tham khảo (Milton & Alexiou, 2009), chỉ mang tính ước lượng. */
export function levelFromFamilies(families: number): Level | "B2+" {
  if (families < 1500) return "A1";
  if (families < 2500) return "A2";
  if (families < 3250) return "B1";
  if (families < 4000) return "B2";
  return "B2+";
}

export const IELTS_HINT: Record<Level | "B2+", string> = {
  A1: "dưới 3.5",
  A2: "khoảng 3.5–4.0",
  B1: "khoảng 4.0–5.0",
  B2: "khoảng 5.5–6.5",
  "B2+": "từ 6.5 trở lên",
};

/** Mốc từ vựng tham khảo cho mục tiêu band 5.5. */
export const TARGET_FAMILIES = 3500;
