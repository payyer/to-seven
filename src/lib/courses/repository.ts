import { CloudError, cloudRequest } from "../repository/cloud";
import { parseCourseSnapshot } from "./practice";
import type { CoursePracticeSnapshot } from "./types";

/** Each instance owns one level and a revision; never touches the main repository. */
export class CourseRepository {
  revision = 0;
  private pending: {
    mutationId: string;
    revision: number;
    snapshot: CoursePracticeSnapshot;
  } | null = null;
  constructor(readonly levelId: string) {}
  private get path() {
    return `/api/course-progress/${encodeURIComponent(this.levelId)}`;
  }
  async load() {
    if (this.pending)
      throw new Error("Còn bài chưa lưu. Hãy thử lưu lại trước.");
    const data = await cloudRequest(this.path);
    const snapshot = parseCourseSnapshot(data.snapshot);
    this.revision = data.revision;
    return snapshot;
  }
  async save(snapshot: CoursePracticeSnapshot) {
    this.pending ??= {
      mutationId: crypto.randomUUID(),
      revision: this.revision,
      snapshot: structuredClone(snapshot),
    };
    const data = await cloudRequest(this.path, {
      method: "PATCH",
      body: JSON.stringify(this.pending),
    });
    this.revision = data.revision;
    this.pending = null;
  }
}
export { CloudError };
