import { DEFAULT_SETTINGS } from "../types";
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
import type { StudyRepository } from "./types";

const PREFIX = "ielts-vocab:v1:";
const KEYS = {
  settings: `${PREFIX}settings`,
  cards: `${PREFIX}cards`,
  plan: `${PREFIX}plan`,
  activity: `${PREFIX}activity`,
  placement: `${PREFIX}placement`,
  sentences: `${PREFIX}sentences`,
  errors: `${PREFIX}errors`,
  dictations: `${PREFIX}dictations`,
  speaking: `${PREFIX}speaking`,
  writings: `${PREFIX}writings`,
  reports: `${PREFIX}reports`,
} as const;

/** Giữ lịch sử ở mức vừa phải để không chạm giới hạn ~5MB của localStorage. */
const MAX_SENTENCES = 500;
const MAX_DICTATIONS = 1000;
const MAX_SPEAKING = 300;
const MAX_WRITINGS = 100;

function read<T>(key: string, fallback: T): T {
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function write(key: string, value: unknown): void {
  window.localStorage.setItem(key, JSON.stringify(value));
}

export class LocalStudyRepository implements StudyRepository {
  async saveDraft(week: string, text: string): Promise<void> {
    write(`ielts-vocab:writing-draft:${week}`, text);
  }
  async load(): Promise<StudySnapshot> {
    const drafts: Record<string, string> = {};
    for (let i = 0; i < window.localStorage.length; i++) {
      const key = window.localStorage.key(i);
      if (key?.startsWith("ielts-vocab:writing-draft:")) {
        drafts[key.slice("ielts-vocab:writing-draft:".length)] = window.localStorage.getItem(key) ?? "";
      }
    }
    return {
      drafts,
      settings: { ...DEFAULT_SETTINGS, ...read<Partial<Settings>>(KEYS.settings, {}) },
      cards: read<Record<string, CardState>>(KEYS.cards, {}),
      plan: read<DailyPlan | null>(KEYS.plan, null),
      activity: read<Record<string, DayActivity>>(KEYS.activity, {}),
      placement: read<PlacementResult | null>(KEYS.placement, null),
      sentences: read<SentenceAttempt[]>(KEYS.sentences, []),
      errors: read<ErrorEntry[]>(KEYS.errors, []),
      dictations: read<DictationResult[]>(KEYS.dictations, []),
      speaking: read<SpeakingAttempt[]>(KEYS.speaking, []),
      writings: read<WritingSubmission[]>(KEYS.writings, []),
      reports: read<WeeklyReport[]>(KEYS.reports, []),
    };
  }

  async saveSettings(settings: Settings): Promise<void> {
    write(KEYS.settings, settings);
  }

  async saveCards(cards: CardState[]): Promise<void> {
    const all = read<Record<string, CardState>>(KEYS.cards, {});
    for (const card of cards) all[card.wordId] = card;
    write(KEYS.cards, all);
  }

  async savePlan(plan: DailyPlan): Promise<void> {
    write(KEYS.plan, plan);
  }

  async saveActivity(date: string, activity: DayActivity): Promise<void> {
    const all = read<Record<string, DayActivity>>(KEYS.activity, {});
    all[date] = activity;
    write(KEYS.activity, all);
  }

  async savePlacement(result: PlacementResult): Promise<void> {
    write(KEYS.placement, result);
  }

  async appendSentence(attempt: SentenceAttempt): Promise<void> {
    const all = read<SentenceAttempt[]>(KEYS.sentences, []);
    write(KEYS.sentences, [...all, attempt].slice(-MAX_SENTENCES));
  }

  async saveErrors(entries: ErrorEntry[]): Promise<void> {
    const all = read<ErrorEntry[]>(KEYS.errors, []);
    const byId = new Map(all.map((e) => [e.id, e]));
    for (const e of entries) byId.set(e.id, e);
    write(KEYS.errors, [...byId.values()]);
  }

  async deleteError(id: string): Promise<void> {
    write(
      KEYS.errors,
      read<ErrorEntry[]>(KEYS.errors, []).filter((e) => e.id !== id),
    );
  }

  async appendDictation(result: DictationResult): Promise<void> {
    const all = read<DictationResult[]>(KEYS.dictations, []);
    write(KEYS.dictations, [...all, result].slice(-MAX_DICTATIONS));
  }

  async appendSpeaking(attempt: SpeakingAttempt): Promise<void> {
    const all = read<SpeakingAttempt[]>(KEYS.speaking, []);
    write(KEYS.speaking, [...all, attempt].slice(-MAX_SPEAKING));
  }

  async appendWriting(submission: WritingSubmission): Promise<void> {
    const all = read<WritingSubmission[]>(KEYS.writings, []);
    write(KEYS.writings, [...all, submission].slice(-MAX_WRITINGS));
  }

  async saveReport(report: WeeklyReport): Promise<void> {
    const all = read<WeeklyReport[]>(KEYS.reports, []).filter((r) => r.week !== report.week);
    write(KEYS.reports, [...all, report]);
  }

  async replaceAll(snapshot: StudySnapshot): Promise<void> {
    for (const [week, text] of Object.entries(snapshot.drafts)) await this.saveDraft(week, text);
    write(KEYS.settings, snapshot.settings);
    write(KEYS.cards, snapshot.cards);
    write(KEYS.activity, snapshot.activity);
    write(KEYS.sentences, snapshot.sentences);
    write(KEYS.errors, snapshot.errors);
    write(KEYS.dictations, snapshot.dictations);
    write(KEYS.speaking, snapshot.speaking);
    write(KEYS.writings, snapshot.writings);
    write(KEYS.reports, snapshot.reports);
    if (snapshot.plan) write(KEYS.plan, snapshot.plan);
    else window.localStorage.removeItem(KEYS.plan);
    if (snapshot.placement) write(KEYS.placement, snapshot.placement);
    else window.localStorage.removeItem(KEYS.placement);
  }

  async clearAll(): Promise<void> {
    for (const key of Object.values(KEYS)) window.localStorage.removeItem(key);
  }
}
