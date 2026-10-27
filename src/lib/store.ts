"use client";

import { useEffect, useSyncExternalStore } from "react";
import { WORDS } from "@/data/words";
import { toDateKey } from "./date";
import { samePlan, syncPlan } from "./planner";
import { getRepository } from "./repository";
import { addErrors, makeErrorEntries, makeTextErrorEntries, reviewError as reviewErrorEntry } from "./mistakes";
import { recordSpell } from "./spelling";
import { knownCard, newCard, schedule } from "./srs";
import type {
  CardState,
  DailyPlan,
  DayActivity,
  ErrorEntry,
  Grade,
  PlacementResult,
  SentenceAttempt,
  SentenceFeedback,
  Settings,
  SpeakingAttempt,
  StudySnapshot,
  WeeklyReport,
  WritingSubmission,
} from "./types";
import { DEFAULT_SETTINGS } from "./types";
import { emptySnapshot, parseSnapshot } from "./progress/snapshot";
import { SaveQueue } from "./progress/queue";
import { CloudError } from "./repository/cloud";
import { LocalStudyRepository } from "./repository/local";

const EMPTY_SNAPSHOT: StudySnapshot = {
  drafts: {},
  settings: DEFAULT_SETTINGS,
  cards: {},
  plan: null,
  activity: {},
  placement: null,
  sentences: [],
  errors: [],
  dictations: [],
  speaking: [],
  writings: [],
  reports: [],
};

function newId(): string {
  return typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

/**
 * Store phía client cho toàn bộ dữ liệu học tập.
 * - UI đọc qua `useAppState()` (null khi chưa tải xong / khi render trên server).
 * - Mọi thay đổi đi qua các action bên dưới: cập nhật state ngay, rồi ghi xuống repository theo thứ tự.
 */
export interface AppState extends StudySnapshot {
  today: string;
  plan: DailyPlan;
}

let state: AppState | null = null;
let loading: Promise<void> | null = null;
const listeners = new Set<() => void>();
export interface CloudState {
  phase: "loading" | "ready" | "locked" | "error" | "migration";
  message: string;
  pending: boolean;
  conflict: boolean;
}
let cloud: CloudState = { phase: "loading", message: "Đang tải tiến độ…", pending: false, conflict: false };
const cloudListeners = new Set<() => void>();
function updateCloud(patch: Partial<CloudState>) {
  cloud = { ...cloud, ...patch };
  cloudListeners.forEach(l => l());
}
function reportError(error: unknown) {
  const locked = error instanceof CloudError && error.status === 401;
  updateCloud({ phase: locked ? "locked" : "error", message: error instanceof Error ? error.message : "Không kết nối được máy chủ.", conflict: error instanceof CloudError && error.status === 409 });
}
const writeQueue = new SaveQueue(() => {
  updateCloud({ pending: writeQueue.pending || draftTimers.size > 0 });
  if (writeQueue.error) reportError(writeQueue.error);
});
const draftTimers = new Map<string, ReturnType<typeof setTimeout>>();

export function useCloudState() {
  return useSyncExternalStore(l => { cloudListeners.add(l); return () => cloudListeners.delete(l); }, () => cloud, () => cloud);
}

export async function retryCloud() {
  try {
    if (cloud.conflict) return;
    updateCloud({ phase: "loading", message: "" });
    await writeQueue.retry();
    if (!state) await ensureLoaded();
    else {
      updateCloud({ phase: "ready" });
      await refreshCloud();
    }
  } catch (error) { reportError(error); }
}

function setState(next: AppState) {
  state = next;
  listeners.forEach((l) => l());
}

function persist(task: () => Promise<void>) {
  writeQueue.enqueue(task);
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function withPlan(snapshot: StudySnapshot, today: string): AppState {
  const plan = syncPlan(snapshot.plan, today, WORDS, snapshot.cards, snapshot.settings);
  if (!samePlan(plan, snapshot.plan)) persist(() => getRepository().savePlan(plan));
  return { ...snapshot, today, plan };
}

export function ensureLoaded(): Promise<void> {
  if (state) return Promise.resolve();
  loading ??= getRepository()
    .load()
    .then((snapshot) => {
      if (!getRepository().initialized && hasLocalProgress()) {
        updateCloud({ phase: "migration", message: "Trình duyệt này có tiến độ cũ. Bạn muốn chuyển lên Supabase?" });
        return;
      }
      setState(withPlan(snapshot, toDateKey()));
      updateCloud({ phase: "ready", message: "", conflict: false });
    })
    .catch(reportError)
    .finally(() => {
      loading = null;
    });
  return loading;
}

/** Sang ngày mới khi app vẫn đang mở: lập kế hoạch mới. */
function refreshDay() {
  if (!state) return;
  const today = toDateKey();
  if (today !== state.today) setState(withPlan(state, today));
}

export function useAppState(): AppState | null {
  const snapshot = useSyncExternalStore(
    subscribe,
    () => state,
    () => null,
  );
  useEffect(() => {
    refreshDay();
  }, []);
  return snapshot;
}

function bumpActivity(s: AppState, delta: Partial<DayActivity>): Record<string, DayActivity> {
  const prev = s.activity[s.today] ?? { newWords: 0, reviews: 0, forgot: 0 };
  const day: DayActivity = { ...prev };
  for (const [key, value] of Object.entries(delta) as [keyof DayActivity, number][]) {
    day[key] = (prev[key] ?? 0) + value;
  }
  const today = s.today;
  persist(() => getRepository().saveActivity(today, day));
  return { ...s.activity, [today]: day };
}

function putCard(s: AppState, card: CardState): Record<string, CardState> {
  persist(() => getRepository().saveCards([card]));
  return { ...s.cards, [card.wordId]: card };
}

/** Học xong một từ mới: tạo thẻ, lần ôn đầu là ngày mai. */
export function learnWord(wordId: string) {
  if (!state || state.cards[wordId]) return;
  const card = newCard(wordId, state.today);
  setState({ ...state, cards: putCard(state, card), activity: bumpActivity(state, { newWords: 1 }) });
}

/** Người dùng đã biết từ này: hẹn kiểm tra lại sau 14 ngày và bù một từ mới khác vào hôm nay. */
export function markKnown(wordId: string) {
  if (!state || state.cards[wordId]) return;
  const card = knownCard(wordId, state.today);
  const cards = putCard(state, card);
  setState(withPlan({ ...state, cards }, state.today));
}

/** `spelledOk`: lần gõ đầu có đúng chính tả không (bỏ trống khi người học bấm "Không nhớ"). */
export function gradeCard(wordId: string, grade: Grade, spelledOk?: boolean) {
  if (!state) return;
  const card = state.cards[wordId];
  if (!card) return;
  const spelled = spelledOk === undefined ? card : recordSpell(card, spelledOk, state.today);
  const next = schedule(spelled, grade, state.today);
  setState({
    ...state,
    cards: putCard(state, next),
    activity: bumpActivity(state, { reviews: 1, forgot: grade === "again" ? 1 : 0 }),
  });
}

/** Ôn lại thẻ vừa quên trong cùng phiên: chỉ tính là một lượt ôn, không đổi lịch. */
export function logPractice() {
  if (!state) return;
  setState({ ...state, activity: bumpActivity(state, { reviews: 1 }) });
}

/** Kết quả lần gõ đầu trong bài kiểm tra / luyện chính tả. Không đổi lịch ôn. */
export function recordSpelling(wordId: string, ok: boolean) {
  if (!state) return;
  const card = state.cards[wordId];
  const cards = card ? putCard(state, recordSpell(card, ok, state.today)) : state.cards;
  setState({ ...state, cards, activity: bumpActivity(state, { spelling: 1 }) });
}

export function learnMore(count: number) {
  if (!state) return;
  const plan = { ...state.plan, extra: state.plan.extra + count };
  setState(withPlan({ ...state, plan }, state.today));
}

export function updateSettings(patch: Partial<Settings>) {
  if (!state) return;
  const settings = { ...state.settings, ...patch };
  persist(() => getRepository().saveSettings(settings));
  setState(withPlan({ ...state, settings }, state.today));
}

export function savePlacement(result: PlacementResult) {
  const s = state;
  if (!s) return;
  const settings = { ...s.settings, focusLevel: result.recommendedLevel };
  persist(() => getRepository().savePlacement(result));
  persist(() => getRepository().saveSettings(settings));
  // Kế hoạch hôm nay giữ các từ đã học, phần chưa học được chọn lại theo level mới.
  const plan = { ...s.plan, wordIds: s.plan.wordIds.filter((id) => s.cards[id]) };
  setState(withPlan({ ...s, placement: result, settings, plan }, s.today));
}

// ---- Giai đoạn 2: đặt câu, sổ lỗi, dictation ----

/** Lưu một câu đã được AI chữa; mọi lỗi được ghi vào sổ lỗi sai. */
export function recordSentence(wordId: string | null, targetWord: string, feedback: SentenceFeedback) {
  const s = state;
  if (!s) return;
  const attempt: SentenceAttempt = { id: newId(), wordId, targetWord, createdAt: s.today, feedback };
  const added = makeErrorEntries(feedback, wordId, s.today, newId);
  const errors = addErrors(s.errors, added, s.today);
  const changed = errors.filter((e, i) => e !== s.errors[i] || i >= s.errors.length);
  persist(() => getRepository().appendSentence(attempt));
  if (changed.length) persist(() => getRepository().saveErrors(changed));
  setState({
    ...s,
    sentences: [...s.sentences, attempt],
    errors,
    activity: bumpActivity(s, { sentences: 1 }),
  });
}

export function reviewError(id: string, correct: boolean) {
  const s = state;
  if (!s) return;
  const entry = s.errors.find((e) => e.id === id);
  if (!entry) return;
  const next: ErrorEntry = reviewErrorEntry(entry, correct, s.today);
  persist(() => getRepository().saveErrors([next]));
  setState({
    ...s,
    errors: s.errors.map((e) => (e.id === id ? next : e)),
    activity: bumpActivity(s, { errorReviews: 1 }),
  });
}

/** Xoá một lỗi (ví dụ AI chấm nhầm). */
export function deleteError(id: string) {
  const s = state;
  if (!s) return;
  persist(() => getRepository().deleteError(id));
  setState({ ...s, errors: s.errors.filter((e) => e.id !== id) });
}

export function recordDictation(itemId: string, accuracy: number) {
  const s = state;
  if (!s) return;
  const result = { itemId, date: s.today, accuracy };
  persist(() => getRepository().appendDictation(result));
  setState({ ...s, dictations: [...s.dictations, result], activity: bumpActivity(s, { dictations: 1 }) });
}

// ---- Giai đoạn 3: Speaking, Writing, báo cáo tuần ----

/** Thêm lỗi từ bài nói / bài viết vào sổ và trả về danh sách lỗi mới. */
function withTextErrors(s: AppState, text: string, attempt: { issues: SentenceFeedback["issues"]; practice: { en: string; vi: string } }, source: "speaking" | "writing") {
  const added = makeTextErrorEntries(text, attempt.issues, source, attempt.practice, s.today, newId);
  const errors = addErrors(s.errors, added, s.today);
  const changed = errors.filter((e, i) => e !== s.errors[i] || i >= s.errors.length);
  if (changed.length) persist(() => getRepository().saveErrors(changed));
  return errors;
}

export function recordSpeaking(attempt: Omit<SpeakingAttempt, "id" | "createdAt">) {
  const s = state;
  if (!s) return;
  const full: SpeakingAttempt = { ...attempt, id: newId(), createdAt: s.today };
  persist(() => getRepository().appendSpeaking(full));
  setState({
    ...s,
    speaking: [...s.speaking, full],
    errors: withTextErrors(s, full.feedback.answer, full.feedback, "speaking"),
    activity: bumpActivity(s, { speaking: 1 }),
  });
}

export function recordWriting(submission: Omit<WritingSubmission, "id" | "createdAt">) {
  const s = state;
  if (!s) return;
  const full: WritingSubmission = { ...submission, id: newId(), createdAt: s.today };
  persist(() => getRepository().appendWriting(full));
  setState({
    ...s,
    writings: [...s.writings, full],
    errors: withTextErrors(s, full.text, full.feedback, "writing"),
    activity: bumpActivity(s, { writing: 1 }),
  });
}

export function saveReport(report: WeeklyReport) {
  const s = state;
  if (!s) return;
  persist(() => getRepository().saveReport(report));
  setState({ ...s, reports: [...s.reports.filter((r) => r.week !== report.week), report] });
}

export function exportSnapshot(): StudySnapshot | null {
  if (!state) return null;
  const { settings, cards, plan, activity, placement, sentences, errors, dictations, speaking, writings, reports, drafts } = state;
  return { settings, cards, plan, activity, placement, sentences, errors, dictations, speaking, writings, reports, drafts };
}

export async function importSnapshot(value: unknown): Promise<void> {
  const snapshot = parseSnapshot(value);
  flushDrafts();
  await writeQueue.flush();
  persist(async () => {
    await getRepository().replaceAll(snapshot);
    setState(withPlan(snapshot, toDateKey()));
  });
  await writeQueue.flush();
}

export async function resetAll(): Promise<void> {
  flushDrafts();
  await writeQueue.flush();
  persist(async () => {
    await getRepository().clearAll();
    setState(withPlan(EMPTY_SNAPSHOT, toDateKey()));
  });
  await writeQueue.flush();
}

export function saveDraft(week: string, text: string) {
  if (!state) return;
  setState({ ...state, drafts: { ...state.drafts, [week]: text } });
  const previous = draftTimers.get(week);
  if (previous) clearTimeout(previous);
  draftTimers.set(week, setTimeout(() => flushDraft(week), 500));
  updateCloud({ pending: true });
}

export function flushDraft(week: string) {
  const timer = draftTimers.get(week);
  if (!timer) return;
  clearTimeout(timer);
  draftTimers.delete(week);
  const text = state?.drafts[week] ?? "";
  persist(() => getRepository().saveDraft(week, text));
}

export function flushDrafts() { for (const week of draftTimers.keys()) flushDraft(week); }

export async function refreshCloud() {
  if (!state || cloud.phase !== "ready") return;
  updateCloud({ phase: "loading" });
  try {
    flushDrafts();
    await writeQueue.flush();
    const snapshot = await getRepository().load();
    setState(withPlan(snapshot, toDateKey()));
    updateCloud({ phase: "ready" });
  } catch (error) { reportError(error); }
}

export function hasLocalProgress() {
  try {
    return Object.keys(window.localStorage).some(key => key.startsWith("ielts-vocab:v1:") || key.startsWith("ielts-vocab:writing-draft:"));
  } catch { return false; }
}

export async function localSnapshot() { return parseSnapshot(await new LocalStudyRepository().load()); }

export function downloadSnapshot(snapshot: StudySnapshot, name = "ielts-vocab-backup") {
  const url = URL.createObjectURL(new Blob([JSON.stringify(snapshot, null, 2)], { type: "application/json" }));
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = name + "-" + toDateKey() + ".json";
  anchor.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export async function finishMigration(importLocal: boolean) {
  try {
    const snapshot = importLocal ? await localSnapshot() : emptySnapshot();
    if (importLocal) downloadSnapshot(snapshot, "ielts-vocab-before-migration");
    persist(async () => {
      await getRepository().initialize(snapshot);
      setState(withPlan(snapshot, toDateKey()));
      updateCloud({ phase: "ready", message: "" });
    });
    await writeQueue.flush();
  } catch (error) { reportError(error); }
}
