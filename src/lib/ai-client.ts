import type { SentenceFeedback, SpeakingFeedback, WeeklyPlan, WeekStats, WritingFeedback } from "./types";

// Mã truy cập là thông tin của thiết bị, không nằm trong dữ liệu học (không xuất ra file sao lưu).
const ACCESS_KEY = "ielts-vocab:access-code";

export function getAccessCode(): string {
  try {
    return window.localStorage.getItem(ACCESS_KEY) ?? "";
  } catch {
    return "";
  }
}

export function setAccessCode(code: string): void {
  try {
    if (code) window.localStorage.setItem(ACCESS_KEY, code);
    else window.localStorage.removeItem(ACCESS_KEY);
  } catch {
    // localStorage bị chặn: bỏ qua.
  }
}

/** Gọi một route AI; lỗi được ném ra với thông báo tiếng Việt từ server. */
async function postAi<T>(path: string, body: unknown, field: string): Promise<T> {
  let res: Response;
  try {
    res = await fetch(path, {
      method: "POST",
      headers: { "content-type": "application/json", "x-access-code": getAccessCode() },
      body: JSON.stringify(body),
    });
  } catch {
    throw new Error("Không kết nối được máy chủ. Kiểm tra mạng rồi thử lại.");
  }
  const data = (await res.json().catch(() => null)) as Record<string, unknown> | null;
  if (!res.ok || !data?.[field]) {
    throw new Error(typeof data?.error === "string" ? data.error : `Lỗi máy chủ (${res.status}).`);
  }
  return data[field] as T;
}

export function requestSentenceFeedback(input: { word: string; meaningVi: string; sentence: string }) {
  return postAi<SentenceFeedback>("/api/sentence-feedback", input, "feedback");
}

export function requestSpeakingFeedback(input: {
  question: string;
  answer: string;
  inputMode: "voice" | "text";
  recentWords: { word: string; vi: string }[];
}) {
  return postAi<SpeakingFeedback>("/api/speaking-feedback", input, "feedback");
}

export function requestWritingFeedback(input: { taskType: string; prompt: string; text: string }) {
  return postAi<WritingFeedback>("/api/writing-feedback", input, "feedback");
}

export function requestWeeklyPlan(input: { stats: WeekStats; previous: WeekStats | null; dailyNewWords: number }) {
  return postAi<WeeklyPlan>("/api/weekly-plan", input, "plan");
}
