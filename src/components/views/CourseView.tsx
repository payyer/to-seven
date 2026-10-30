"use client";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import {
  COURSE_LEVELS,
  COURSE_QUESTIONS,
  COURSE_QUESTION_BY_ID,
  LESSONS,
} from "@/data/courses";
import { GRAMMAR_BY_ID, GRAMMAR_TOPICS } from "@/data/courses/grammar";
import { getCourseStore, useCourseState } from "@/lib/courses/store";
import {
  checkCourseAnswer,
  createSession,
  emptyCourseSnapshot,
  parseCourseSnapshot,
  recordAnswer,
  submitSession,
} from "@/lib/courses/practice";
import type {
  CoursePracticeSnapshot,
  PracticeQuestion,
} from "@/lib/courses/types";
import {
  Badge,
  Button,
  ButtonLink,
  Card,
  Loading,
  PageHeader,
  ProgressBar,
} from "../ui";
const field =
  "w-full min-w-0 rounded-xl border border-line bg-surface px-3 py-2.5 text-sm outline-none focus:border-accent focus:ring-2 focus:ring-accent/20";
function download(levelId: string, snapshot: CoursePracticeSnapshot) {
  const blob = new Blob(
    [
      JSON.stringify(
        { type: "course-practice-backup", levelId, snapshot },
        null,
        2,
      ),
    ],
    { type: "application/json" },
  );
  const url = URL.createObjectURL(blob),
    link = document.createElement("a");
  link.href = url;
  link.download = `${levelId}-backup.json`;
  link.click();
  URL.revokeObjectURL(url);
}
export function CourseView({ levelId }: { levelId: string }) {
  const params = useSearchParams();
  return (
    <CourseBody
      key={levelId + params.toString()}
      levelId={levelId}
      initialLesson={Number(params.get("lesson"))}
      initialTopic={params.get("topic") ?? "all"}
    />
  );
}
function CourseBody({
  levelId,
  initialLesson,
  initialTopic,
}: {
  levelId: string;
  initialLesson: number;
  initialTopic: string;
}) {
  const store = getCourseStore(levelId),
    state = useCourseState(levelId);
  const [selected, setSelected] = useState<number[]>([
    LESSONS.some((l) => l.levelId === levelId && l.id === initialLesson)
      ? initialLesson
      : 1,
  ]);
  const [topic, setTopic] = useState(
    GRAMMAR_BY_ID[initialTopic] ? initialTopic : "all",
  );
  const [kind, setKind] = useState("all");
  const [source, setSource] = useState("original");
  const [mode, setMode] = useState<"learn" | "test">("learn");
  const [size, setSize] = useState("10");
  const [tab, setTab] = useState<"practice" | "mistakes" | "history">(
    "practice",
  );
  const [message, setMessage] = useState("");
  const [backedUpSnapshot, setBackedUpSnapshot] =
    useState<CoursePracticeSnapshot | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const [showSetup, setShowSetup] = useState(false);
  const level = COURSE_LEVELS.find((l) => l.id === levelId)!;
  useEffect(() => {
    void store.load();
    const visible = () => {
      if (document.visibilityState === "visible") void store.refresh();
      else store.flushDraft();
    };
    const leave = (e: BeforeUnloadEvent) => {
      if (store.getSnapshot().pending) {
        store.flushDraft();
        e.preventDefault();
        e.returnValue = "";
      }
    };
    document.addEventListener("visibilitychange", visible);
    window.addEventListener("beforeunload", leave);
    return () => {
      store.flushDraft();
      document.removeEventListener("visibilitychange", visible);
      window.removeEventListener("beforeunload", leave);
    };
  }, [store]);
  if (!state || state.loading) return <Loading />;
  const snapshot = state.snapshot;
  if (state.error)
    return (
      <Card>
        <h1 className="font-semibold">
          {state.conflict
            ? "Có bài mới trên thiết bị khác"
            : "Chưa lưu hoặc tải được bài ôn"}
        </h1>
        <p role="alert" className="my-3 text-sm text-bad">
          {state.error}
        </p>
        <div className="flex flex-wrap gap-2">
          {!state.conflict && (
            <Button onClick={() => void store.retry()}>Thử lại</Button>
          )}
          {snapshot && (
            <Button
              variant="secondary"
              onClick={() => {
                download(levelId, snapshot);
                setBackedUpSnapshot(snapshot);
              }}
            >
              Tải bản khôi phục
            </Button>
          )}
          {state.conflict && (
            <Button
              variant="secondary"
              disabled={backedUpSnapshot !== snapshot}
              onClick={() => window.location.reload()}
            >
              Tải bản mới từ máy chủ
            </Button>
          )}
        </div>
      </Card>
    );
  if (!snapshot) return <Loading />;
  const questions = COURSE_QUESTIONS.filter((q) => q.levelId === levelId);
  const mistakes = questions.filter(
    (q) =>
      snapshot.questions[q.id] &&
      !snapshot.questions[q.id].lastCorrect &&
      q.scoreable,
  );
  const active = snapshot.session;
  const change = store.change.bind(store);
  const pool = questions.filter(
    (q) =>
      selected.includes(q.lessonId) &&
      (topic === "all" || q.topicId === topic) &&
      (kind === "all" || q.kind === kind) &&
      (source === "all" || q.source === source),
  );
  const start = (items: PracticeQuestion[]) => {
    setMessage("");
    if (!items.length) {
      setMessage("Không có câu phù hợp. Hãy đổi bộ lọc.");
      return;
    }
    change((s) => ({
      ...s,
      session: createSession(
        items,
        mode,
        size === "all" ? items.length : Number(size),
      ),
    }));
  };
  const status = (
    <p role="status" className="mb-3 text-right text-xs text-ink-3">
      {state.pending ? "Đang lưu bài ôn…" : "Đã đồng bộ tiến độ cấp độ"}
    </p>
  );
  if (active && !active.submitted && !showSetup) {
    const q = COURSE_QUESTION_BY_ID[active.questionIds[active.index]];
    if (!q)
      return (
        <Card>
          <p>Bài này đã được cập nhật. Kết quả cũ vẫn được giữ.</p>
          <Button
            className="mt-3"
            onClick={() => change((s) => ({ ...s, session: null }))}
          >
            Về chọn bài
          </Button>
        </Card>
      );
    const checked = active.checked.includes(q.id),
      input = active.answers[q.id] ?? q.answers.map(() => "");
    const visible = active.mode === "learn" && checked;
    const updateInput = (i: number, value: string) =>
      change((s) => {
        if (
          !s.session ||
          s.session.submitted ||
          s.session.checked.includes(q.id)
        )
          return s;
        const values = [
          ...(s.session.answers[q.id] ?? q.answers.map(() => "")),
        ];
        values[i] = value;
        return {
          ...s,
          session: {
            ...s.session,
            answers: { ...s.session.answers, [q.id]: values },
          },
        };
      }, true);
    const blankCount = [...q.prompt.matchAll(/_{3,}/g)].length;
    let blank = 0;
    const prompt = q.prompt.replace(/_{3,}/g, () => `____ [${++blank}]`);
    return (
      <div>
        {status}
        <PageHeader
          title={active.mode === "learn" ? "Luyện học" : "Tự kiểm tra"}
          subtitle={`${level.title} · Câu ${active.index + 1}/${active.questionIds.length}`}
        >
          <Button
            variant="ghost"
            onClick={() => {
              setMessage(
                "Bài đang làm đã được giữ. Bấm Tiếp tục khi muốn quay lại.",
              );
              setTab("practice");
              change((s) => ({
                ...s,
                session: { ...s.session!, submitted: false },
              }));
              setShowSetup(true);
            }}
          >
            Chọn bài khác
          </Button>
        </PageHeader>
        <ProgressBar
          value={active.index + 1}
          max={active.questionIds.length}
          label="Tiến độ lượt làm"
        />
        <Card className="mt-4">
          <div className="mb-4 flex flex-wrap gap-2">
            <Badge tone="accent">Lesson {q.lessonId}</Badge>
            <Badge>
              {q.source === "original" ? "Bài gốc" : "Bài luyện bổ sung"}
            </Badge>
            <Badge>{q.kind === "vocabulary" ? "Từ vựng" : "Ngữ pháp"}</Badge>
            {!q.scoreable && (
              <Badge tone="warn">Tự đối chiếu · không tính điểm</Badge>
            )}
          </div>
          <p className="text-sm text-ink-2">{q.instruction}</p>
          {q.context && (
            <details className="my-4 rounded-xl bg-surface-2 p-3" open>
              <summary className="cursor-pointer text-sm font-medium">
                Ngữ cảnh / bảng lựa chọn
              </summary>
              <p
                lang="en"
                className="mt-3 whitespace-pre-line text-sm leading-7"
              >
                {q.context}
              </p>
            </details>
          )}
          <p
            lang="en"
            className="mt-4 whitespace-pre-line text-lg leading-8 font-medium"
          >
            {prompt}
          </p>
          <form
            className="mt-5 space-y-3"
            onSubmit={(e) => {
              e.preventDefault();
              if (active.mode === "learn" && !checked) {
                change((s) => recordAnswer(s, q));
              } else if (active.index === active.questionIds.length - 1) {
                change((s) => submitSession(s, COURSE_QUESTION_BY_ID));
              } else {
                change((s) => ({
                  ...s,
                  session: { ...s.session!, index: s.session!.index + 1 },
                }));
              }
            }}
          >
            {q.answers.map((options, i) => (
              <label key={`${q.id}-${i}`} className="block text-sm">
                <span className="mb-1 block text-ink-2">
                  {q.answers.length > 1
                    ? `Ô ${i + 1}`
                    : blankCount > 1
                      ? "Gõ các phần thiếu theo hướng dẫn"
                      : "Câu trả lời của bạn"}
                </span>
                {options[0].length > 90 ? (
                  <textarea
                    aria-label={`Đáp án ${i + 1}`}
                    rows={3}
                    className={field}
                    maxLength={2000}
                    value={input[i]}
                    disabled={checked}
                    onChange={(e) => updateInput(i, e.target.value)}
                    autoCapitalize="off"
                    spellCheck={false}
                  />
                ) : (
                  <input
                    aria-label={`Đáp án ${i + 1}`}
                    className={field}
                    maxLength={2000}
                    value={input[i]}
                    disabled={checked}
                    onChange={(e) => updateInput(i, e.target.value)}
                    autoComplete="off"
                    autoCapitalize="off"
                    spellCheck={false}
                  />
                )}
              </label>
            ))}
            {visible && <Feedback question={q} input={input} />}
            <div className="flex flex-wrap items-center justify-between gap-2 pt-2">
              <Button
                variant="secondary"
                disabled={active.index === 0}
                onClick={() =>
                  change((s) => ({
                    ...s,
                    session: { ...s.session!, index: s.session!.index - 1 },
                  }))
                }
              >
                Câu trước
              </Button>
              <Button type="submit">
                {active.mode === "learn" && !checked
                  ? q.scoreable
                    ? "Kiểm tra"
                    : "Xem gợi ý"
                  : active.index === active.questionIds.length - 1
                    ? "Nộp bài"
                    : "Câu tiếp"}
              </Button>
            </div>
          </form>
          {active.mode === "test" && (
            <Button
              className="mt-3"
              variant="ghost"
              onClick={() =>
                change((s) => submitSession(s, COURSE_QUESTION_BY_ID))
              }
            >
              Nộp toàn bộ lượt (
              {
                Object.values(active.answers).filter((a) =>
                  a.every((v) => v.trim()),
                ).length
              }
              /{active.questionIds.length} câu đã nhập)
            </Button>
          )}
        </Card>
      </div>
    );
  }
  if (active?.submitted) {
    const result = snapshot.history.find((h) => h.id === active.id);
    const wrongQuestions = active.questionIds
      .map((id) => COURSE_QUESTION_BY_ID[id])
      .filter(
        (q) =>
          q?.scoreable && !checkCourseAnswer(q, active.answers[q.id] ?? []),
      );
    return (
      <div>
        {status}
        <PageHeader title="Kết quả lượt làm" subtitle={level.title} />
        <Card>
          <p className="text-3xl font-semibold">
            {result?.correct ?? 0}/{result?.total ?? 0}{" "}
            <span className="text-base text-ink-3">câu tính điểm</span>
          </p>
          <p className="mt-2 text-sm text-ink-2">
            Câu tự đối chiếu không tính vào điểm. Câu sai đã vào sổ lỗi riêng.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <Button
              onClick={() => {
                change((s) => ({ ...s, session: null }));
                setShowSetup(false);
              }}
            >
              Chọn bài mới
            </Button>
            <Button
              variant="secondary"
              disabled={!wrongQuestions.length}
              onClick={() => {
                const wrong = active.questionIds
                  .map((id) => COURSE_QUESTION_BY_ID[id])
                  .filter(
                    (q) =>
                      q?.scoreable &&
                      !checkCourseAnswer(q, active.answers[q.id] ?? []),
                  );
                start(wrong);
              }}
            >
              Luyện lại câu sai
            </Button>
          </div>
        </Card>
        <div className="mt-4 space-y-3">
          {active.questionIds.map((id) => {
            const q = COURSE_QUESTION_BY_ID[id];
            return q ? (
              <Card key={id}>
                <p className="mb-2 text-xs text-ink-3">
                  Lesson {q.lessonId} · {q.exercise}
                </p>
                {q.context && (
                  <details className="mb-3 text-sm">
                    <summary>Ngữ cảnh</summary>
                    <p className="whitespace-pre-line">{q.context}</p>
                  </details>
                )}
                <p lang="en" className="mb-3 whitespace-pre-line font-medium">
                  {q.prompt}
                </p>
                <Feedback question={q} input={active.answers[id] ?? []} />
              </Card>
            ) : (
              <Card key={id}>
                Câu đã được cập nhật; lịch sử kết quả được giữ.
              </Card>
            );
          })}
        </div>
      </div>
    );
  }
  // The setup is also shown while a saved run is paused locally.
  return (
    <div>
      {status}
      <PageHeader
        title={level.title}
        subtitle="Luyện từ vựng, ngữ pháp và mẫu câu theo từng lesson."
      />
      {active && !active.submitted && (
        <Card className="mb-4">
          <p className="mb-3 text-sm">
            Bạn có một lượt đang làm: câu {active.index + 1}/
            {active.questionIds.length}. Bắt đầu lượt khác sẽ thay thế bài đang
            làm.
          </p>
          <Button onClick={() => setShowSetup(false)}>
            Tiếp tục bài đang làm
          </Button>
        </Card>
      )}
      <div className="mb-5 flex flex-wrap gap-2">
        {(
          [
            ["practice", "Chọn bài"],
            ["mistakes", `Sổ lỗi (${mistakes.length})`],
            ["history", "Kết quả"],
          ] as const
        ).map(([id, title]) => (
          <Button
            key={id}
            variant={tab === id ? "primary" : "secondary"}
            onClick={() => setTab(id)}
          >
            {title}
          </Button>
        ))}
      </div>
      {message && (
        <p role="status" className="mb-4 text-sm text-accent-strong">
          {message}
        </p>
      )}
      {tab === "practice" && (
        <Card>
          <h2 className="font-semibold">Chọn lesson</h2>
          <div className="my-3 flex flex-wrap gap-2">
            <Button
              variant="ghost"
              onClick={() => {
                setSelected(
                  LESSONS.filter((l) => l.levelId === levelId).map((l) => l.id),
                );
                setTopic("all");
              }}
            >
              Chọn tất cả
            </Button>
            <Button
              variant="ghost"
              onClick={() => {
                setSelected([]);
                setTopic("all");
              }}
            >
              Bỏ chọn
            </Button>
          </div>
          <div className="grid gap-2 sm:grid-cols-2">
            {LESSONS.filter((l) => l.levelId === levelId).map((l) => {
              const done = questions.filter(
                (q) => q.lessonId === l.id && snapshot.questions[q.id],
              ).length;
              return (
                <label
                  key={l.id}
                  className={`flex cursor-pointer items-start gap-3 rounded-xl border p-3 ${selected.includes(l.id) ? "border-accent bg-accent-soft" : "border-line"}`}
                >
                  <input
                    type="checkbox"
                    className="mt-1 accent-accent"
                    checked={selected.includes(l.id)}
                    onChange={() => {
                      setSelected((ids) =>
                        ids.includes(l.id)
                          ? ids.filter((id) => id !== l.id)
                          : [...ids, l.id],
                      );
                      setTopic("all");
                    }}
                  />
                  <span className="text-sm">
                    <span className="font-semibold">Lesson {l.id}</span>
                    <span className="block text-ink-2">{l.title}</span>
                    <span className="mt-1 block text-xs text-ink-3">
                      Đã luyện {done}/
                      {
                        questions.filter(
                          (q) => q.lessonId === l.id && q.scoreable,
                        ).length
                      }{" "}
                      câu tính điểm
                    </span>
                  </span>
                </label>
              );
            })}
          </div>
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            <label className="text-sm">
              Chủ điểm
              <select
                aria-label="Chủ điểm luyện tập"
                className={`${field} mt-1`}
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
              >
                <option value="all">Mọi chủ điểm</option>
                <option value="vocabulary">Từ vựng</option>
                {GRAMMAR_TOPICS.filter((t) =>
                  t.lessonRefs.some(
                    (ref) =>
                      ref.levelId === levelId && selected.includes(ref.lesson),
                  ),
                ).map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.title}
                  </option>
                ))}
              </select>
            </label>
            <label className="text-sm">
              Nội dung
              <select
                className={`${field} mt-1`}
                value={kind}
                onChange={(e) => setKind(e.target.value)}
              >
                <option value="all">Từ vựng và ngữ pháp</option>
                <option value="vocabulary">Từ vựng</option>
                <option value="grammar">Ngữ pháp / mẫu câu</option>
              </select>
            </label>
            <label className="text-sm">
              Nguồn câu hỏi
              <select
                className={`${field} mt-1`}
                value={source}
                onChange={(e) => setSource(e.target.value)}
              >
                <option value="original">Bài gốc</option>
                <option value="additional">Bài luyện bổ sung</option>
                <option value="all">Trộn cả hai nguồn</option>
              </select>
            </label>
            <label className="text-sm">
              Chế độ
              <select
                className={`${field} mt-1`}
                value={mode}
                onChange={(e) => setMode(e.target.value as "learn" | "test")}
              >
                <option value="learn">Luyện học · chấm từng câu</option>
                <option value="test">Tự kiểm tra · chấm cuối lượt</option>
              </select>
            </label>
            <label className="text-sm">
              Số câu
              <select
                className={`${field} mt-1`}
                value={size}
                onChange={(e) => setSize(e.target.value)}
              >
                <option value="10">10 câu</option>
                <option value="20">20 câu</option>
                <option value="all">Toàn bộ bài đã chọn</option>
              </select>
            </label>
          </div>
          <p className="my-4 text-sm text-ink-3">
            {pool.length} nhóm câu phù hợp · không giới hạn thời gian
          </p>
          <Button
            disabled={!pool.length || state.pending}
            onClick={() => {
              setShowSetup(false);
              start(pool);
            }}
          >
            Bắt đầu luyện
          </Button>
        </Card>
      )}
      {tab === "mistakes" && (
        <div className="space-y-3">
          <Card>
            <h2 className="font-semibold">Luyện lại điểm yếu</h2>
            <p className="my-3 text-sm text-ink-2">
              {mistakes.length} câu chưa sửa đúng. Trả lời đúng trong lượt sau
              sẽ đưa câu ra khỏi danh sách này.
            </p>
            <Button
              disabled={!mistakes.length}
              onClick={() => {
                setShowSetup(false);
                start(mistakes);
              }}
            >
              Ôn câu sai
            </Button>
          </Card>
          {mistakes.map((q) => (
            <Card key={q.id}>
              <p className="text-xs text-ink-3">
                Lesson {q.lessonId} ·{" "}
                {q.source === "original" ? "Bài gốc" : "Bổ sung"}
              </p>
              <p className="my-2 font-medium">{q.prompt}</p>
              <p className="text-sm text-bad">
                Bạn đã nhập:{" "}
                {snapshot.questions[q.id].lastAnswer.join(" / ") || "Bỏ trống"}
              </p>
              <Button
                variant="ghost"
                className="mt-2"
                onClick={() => {
                  setShowSetup(false);
                  start([q]);
                }}
              >
                Luyện câu này
              </Button>
            </Card>
          ))}
        </div>
      )}
      {tab === "history" && (
        <Card>
          <h2 className="mb-3 font-semibold">Các lượt gần đây</h2>
          {!snapshot.history.length && (
            <p className="text-sm text-ink-2">Chưa có lượt hoàn tất.</p>
          )}
          <ul className="divide-y divide-line">
            {[...snapshot.history].reverse().map((h) => (
              <li
                key={h.id}
                className="flex justify-between gap-3 py-3 text-sm"
              >
                <span>
                  {new Date(h.date).toLocaleString("vi-VN", {
                    timeZone: "Asia/Ho_Chi_Minh",
                  })}
                  <span className="block text-xs text-ink-3">
                    Lesson {h.lessonIds.join(", ")}
                  </span>
                </span>
                <span className="font-semibold">
                  {h.correct}/{h.total}
                </span>
              </li>
            ))}
          </ul>
        </Card>
      )}
      <Card className="mt-5">
        <h2 className="font-semibold">Dữ liệu của {level.title}</h2>
        <p className="my-3 text-sm text-ink-2">
          Xuất, nhập hoặc xóa riêng kết quả cấp độ này. Thư viện ngữ pháp và từ
          vựng vẫn được giữ.
        </p>
        <div className="flex flex-wrap gap-2">
          <Button
            variant="secondary"
            onClick={() => download(levelId, snapshot)}
          >
            Xuất bản sao lưu
          </Button>
          <Button
            variant="secondary"
            disabled={state.pending}
            onClick={() => fileRef.current?.click()}
          >
            Nhập bản sao lưu
          </Button>
          <Button
            variant="danger"
            disabled={state.pending}
            onClick={() => {
              if (
                window.confirm(
                  `Xóa kết quả ${level.title}? Các cấp độ khác và tiến độ từ vựng gốc được giữ.`,
                )
              ) {
                download(levelId, snapshot);
                change(() => emptyCourseSnapshot());
                setMessage("Đã xóa riêng tiến độ cấp độ này.");
              }
            }}
          >
            Xóa tiến độ cấp độ
          </Button>
        </div>
        <input
          ref={fileRef}
          type="file"
          accept=".json,application/json"
          className="hidden"
          aria-label="Nhập sao lưu cấp độ"
          onChange={async (e) => {
            const f = e.target.files?.[0];
            if (!f) return;
            try {
              if (f.size > 3000000) throw Error("File quá lớn (tối đa 3 MB).");
              const data = JSON.parse(await f.text());
              if (
                data.type !== "course-practice-backup" ||
                data.levelId !== levelId
              )
                throw Error("File không thuộc cấp độ này.");
              const imported = parseCourseSnapshot(data.snapshot);
              if (
                Object.keys(imported.questions).some(
                  (id) => !id.startsWith(`${levelId}-`),
                ) ||
                imported.session?.questionIds.some(
                  (id) => !id.startsWith(`${levelId}-`),
                )
              )
                throw Error("File chứa câu hỏi của cấp độ khác.");
              if (
                window.confirm("Thay thế tiến độ cấp độ này bằng bản sao lưu?")
              ) {
                download(levelId, snapshot);
                change(() => imported);
                setMessage("Đã nhập bản sao lưu cấp độ.");
              }
            } catch (e) {
              setMessage(
                e instanceof Error ? e.message : "Không đọc được file.",
              );
            } finally {
              e.target.value = "";
            }
          }}
        />
      </Card>
      <div className="mt-5">
        <ButtonLink href="/grammar" variant="ghost">
          Xem thư viện ngữ pháp
        </ButtonLink>
      </div>
    </div>
  );
}
function Feedback({
  question: q,
  input,
}: {
  question: PracticeQuestion;
  input: string[];
}) {
  const ok = checkCourseAnswer(q, input);
  return (
    <div
      className={`rounded-xl border p-4 text-sm ${!q.scoreable ? "border-line bg-surface-2" : ok ? "border-good/30 bg-good-soft" : "border-bad/30 bg-bad-soft"}`}
    >
      <p className="font-semibold">
        {!q.scoreable ? "Gợi ý tự đối chiếu" : ok ? "Chính xác" : "Cần sửa lại"}
      </p>
      <p className="mt-2 break-words text-ink-2">
        Bạn nhập: {input.join(" / ") || "Bỏ trống"}
      </p>
      <ol className="mt-2 space-y-1">
        {q.answers.map((a, i) => (
          <li key={i} className="break-words">
            <strong>
              {q.answers.length > 1 ? `Ô ${i + 1}: ` : "Đáp án: "}
            </strong>
            <span lang="en">{a.join(" / ")}</span>
          </li>
        ))}
      </ol>
      <p className="mt-3 leading-6">{q.explanationVi}</p>
      {q.noteVi && (
        <p className="mt-2 leading-6 text-ink-2">Lưu ý tài liệu: {q.noteVi}</p>
      )}
      {GRAMMAR_BY_ID[q.topicId] && (
        <Link
          href={`/grammar#${q.topicId}`}
          className="mt-3 inline-block font-medium text-accent-strong underline"
        >
          Xem chủ điểm: {GRAMMAR_BY_ID[q.topicId].title}
        </Link>
      )}
      <p className="mt-3 break-words text-xs text-ink-3">{q.sourceRef}</p>
    </div>
  );
}
