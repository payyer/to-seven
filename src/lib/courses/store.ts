"use client";
import { useSyncExternalStore } from "react";
import { SaveQueue } from "../progress/queue";
import { CourseRepository, CloudError } from "./repository";
import type { CoursePracticeSnapshot } from "./types";

interface CourseState {
  snapshot: CoursePracticeSnapshot | null;
  pending: boolean;
  error: string;
  conflict: boolean;
  loading: boolean;
}
export class CourseStore {
  private state: CourseState = {
    snapshot: null,
    pending: false,
    error: "",
    conflict: false,
    loading: true,
  };
  private listeners = new Set<() => void>();
  private loading: Promise<void> | null = null;
  private draftTimer: ReturnType<typeof setTimeout> | null = null;
  readonly queue = new SaveQueue(() =>
    this.update({ pending: this.queue.pending || this.draftTimer !== null }),
  );
  constructor(readonly repository: CourseRepository) {}
  getSnapshot = () => this.state;
  subscribe = (fn: () => void) => {
    this.listeners.add(fn);
    return () => {
      this.listeners.delete(fn);
    };
  };
  private update(patch: Partial<CourseState>) {
    this.state = { ...this.state, ...patch };
    this.listeners.forEach((fn) => fn());
  }
  private fail(error: unknown) {
    this.update({
      error: error instanceof Error ? error.message : "Không lưu được bài.",
      conflict: error instanceof CloudError && error.status === 409,
      loading: false,
    });
  }
  load() {
    if (this.state.snapshot) return Promise.resolve();
    return (this.loading ??= this.repository
      .load()
      .then((snapshot) => {
        this.update({ snapshot, loading: false, error: "", conflict: false });
      })
      .catch((e) => this.fail(e))
      .finally(() => {
        this.loading = null;
      }));
  }
  change(
    update: (snapshot: CoursePracticeSnapshot) => CoursePracticeSnapshot,
    draft = false,
  ) {
    if (!this.state.snapshot || this.state.error || this.state.loading) return;
    const next = update(this.state.snapshot);
    if (next === this.state.snapshot) return;
    this.update({ snapshot: next });
    if (this.draftTimer) {
      clearTimeout(this.draftTimer);
      this.draftTimer = null;
    }
    if (draft) {
      this.draftTimer = setTimeout(() => this.flushDraft(), 500);
      this.update({ pending: true });
    } else this.enqueue(next);
  }
  private enqueue(snapshot: CoursePracticeSnapshot) {
    this.queue.enqueue(async () => {
      try {
        await this.repository.save(snapshot);
      } catch (error) {
        this.fail(error);
        throw error;
      }
    });
  }
  flushDraft() {
    if (!this.draftTimer) return;
    clearTimeout(this.draftTimer);
    this.draftTimer = null;
    if (this.state.snapshot) this.enqueue(this.state.snapshot);
  }
  async retry() {
    if (!this.state.snapshot) return this.load();
    try {
      this.update({ error: "", conflict: false });
      if (this.queue.pending) await this.queue.retry();
      else await this.refresh();
    } catch (e) {
      this.fail(e);
    }
  }
  async refresh() {
    if (this.state.pending || this.state.error || this.state.loading) return;
    this.update({ loading: true });
    try {
      const snapshot = await this.repository.load();
      this.update({ snapshot, error: "", conflict: false, loading: false });
    } catch (e) {
      this.fail(e);
    }
  }
}
const stores = new Map<string, CourseStore>();
export function getCourseStore(levelId: string) {
  let store = stores.get(levelId);
  if (!store) {
    store = new CourseStore(new CourseRepository(levelId));
    stores.set(levelId, store);
  }
  return store;
}
export function useCourseState(levelId: string) {
  const store = getCourseStore(levelId);
  return useSyncExternalStore(store.subscribe, store.getSnapshot, () => null);
}
export function courseWritesPending() {
  return [...stores.values()].some((store) => store.getSnapshot().pending);
}
export function flushCourseDrafts() {
  for (const store of stores.values()) store.flushDraft();
}
