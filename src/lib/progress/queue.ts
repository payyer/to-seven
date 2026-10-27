/** Retain the failed head: no later write may overtake it. */
export class SaveQueue {
  private tasks: (() => Promise<void>)[] = [];
  private running: Promise<void> | null = null;
  error: unknown = null;
  constructor(private changed: () => void = () => {}) {}
  get pending() { return this.tasks.length > 0; }
  enqueue(task: () => Promise<void>) {
    this.tasks.push(task);
    this.changed();
    void this.drain();
  }
  private drain(): Promise<void> {
    if (this.running) return this.running;
    if (this.error || !this.tasks.length) return Promise.resolve();
    this.running = Promise.resolve().then(async () => {
      while (this.tasks.length) {
        try { await this.tasks[0](); this.tasks.shift(); }
        catch (error) { this.error = error; break; }
        this.changed();
      }
    }).finally(() => { this.running = null; this.changed(); });
    return this.running;
  }
  async flush() { await this.drain(); if (this.error) throw this.error; }
  async retry() { this.error = null; this.changed(); await this.flush(); }
}
