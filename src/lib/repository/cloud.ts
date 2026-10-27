import type { StudyRepository } from "./types";
import type { StudySnapshot } from "../types";
import { emptySnapshot, parseSnapshot } from "../progress/snapshot";

export class CloudError extends Error {
  constructor(message: string, public status: number) { super(message); }
}

export async function cloudRequest(path: string, init?: RequestInit) {
  const response = await fetch(path, { ...init, cache: "no-store", credentials: "same-origin", headers: { "Content-Type": "application/json", ...init?.headers }, signal: AbortSignal.timeout(30_000) });
  const data = await response.json();
  if (!response.ok) throw new CloudError(data.error ?? "Không kết nối được máy chủ.", response.status);
  return data;
}

/** Calls are serialized by the store. A failed request retains its exact ID/body. */
export class SupabaseStudyRepository implements StudyRepository {
  revision = 0;
  initialized = false;
  private snapshot = emptySnapshot();
  private pending: { mutationId: string; revision: number; snapshot: StudySnapshot; initializeOnly: boolean } | null = null;

  async load() {
    if (this.pending) throw new Error("Còn thay đổi chưa lưu. Hãy thử lưu lại trước.");
    const data = await cloudRequest("/api/progress");
    this.revision = data.revision;
    this.initialized = data.initialized;
    this.snapshot = parseSnapshot(data.snapshot);
    return structuredClone(this.snapshot);
  }

  private async change(update: (s: StudySnapshot) => void, initializeOnly = false) {
    if (!this.pending) {
      const next = structuredClone(this.snapshot);
      update(next);
      this.pending = { mutationId: crypto.randomUUID(), revision: this.revision, snapshot: next, initializeOnly };
    }
    const data = await cloudRequest("/api/progress", { method: "PATCH", body: JSON.stringify(this.pending) });
    this.snapshot = this.pending.snapshot;
    this.revision = data.revision;
    this.initialized = true;
    this.pending = null;
  }

  async initialize(snapshot: StudySnapshot) { await this.change(s => Object.assign(s, snapshot), true); }
  saveSettings: StudyRepository["saveSettings"] = value => this.change(s => { s.settings = value; });
  saveCards: StudyRepository["saveCards"] = cards => this.change(s => { for (const card of cards) s.cards[card.wordId] = card; });
  savePlan: StudyRepository["savePlan"] = value => this.change(s => { s.plan = value; });
  saveActivity: StudyRepository["saveActivity"] = (date, value) => this.change(s => { s.activity[date] = value; });
  savePlacement: StudyRepository["savePlacement"] = value => this.change(s => { s.placement = value; });
  appendSentence: StudyRepository["appendSentence"] = value => this.change(s => { s.sentences.push(value); });
  saveErrors: StudyRepository["saveErrors"] = entries => this.change(s => { const map = new Map(s.errors.map(e => [e.id, e])); for (const entry of entries) map.set(entry.id, entry); s.errors = [...map.values()]; });
  deleteError: StudyRepository["deleteError"] = id => this.change(s => { s.errors = s.errors.filter(e => e.id !== id); });
  appendDictation: StudyRepository["appendDictation"] = value => this.change(s => { s.dictations.push(value); });
  appendSpeaking: StudyRepository["appendSpeaking"] = value => this.change(s => { s.speaking.push(value); });
  appendWriting: StudyRepository["appendWriting"] = value => this.change(s => { s.writings.push(value); });
  saveReport: StudyRepository["saveReport"] = value => this.change(s => { s.reports = [...s.reports.filter(r => r.week !== value.week), value]; });
  saveDraft: StudyRepository["saveDraft"] = (week, text) => this.change(s => { if (text) s.drafts[week] = text; else delete s.drafts[week]; });
  replaceAll: StudyRepository["replaceAll"] = value => this.change(s => Object.assign(s, value));
  clearAll = () => this.replaceAll(emptySnapshot());
}
