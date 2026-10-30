"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { GRAMMAR_TOPICS } from "@/data/courses/grammar";
import { COURSE_LEVELS, LESSONS } from "@/data/courses";
import { Badge, PageHeader } from "../ui";
const field =
  "min-w-0 rounded-xl border border-line bg-surface px-3 py-2.5 text-sm";
export function GrammarView() {
  const [query, setQuery] = useState("");
  const [lesson, setLesson] = useState("all");
  const [level, setLevel] = useState("pre-intermediate");
  useEffect(() => {
    const reveal = () => {
      const element = document.getElementById(window.location.hash.slice(1));
      if (element instanceof HTMLDetailsElement) element.open = true;
    };
    reveal();
    window.addEventListener("hashchange", reveal);
    return () => window.removeEventListener("hashchange", reveal);
  }, []);
  const topics = GRAMMAR_TOPICS.filter(
    (t) =>
      t.lessonRefs.some(
        (ref) =>
          ref.levelId === level &&
          (lesson === "all" || ref.lesson === Number(lesson)),
      ) &&
      `${t.title} ${t.useVi} ${t.forms.join(" ")}`
        .toLocaleLowerCase("vi")
        .includes(query.toLocaleLowerCase("vi")),
  );
  return (
    <div>
      <PageHeader
        title="Ngữ pháp"
        subtitle="Hiểu cách dùng, xem ví dụ và quay lại ôn bất cứ lúc nào."
      />
      <div className="mb-5 grid gap-2 sm:grid-cols-[1fr_auto_auto]">
        <input
          type="search"
          aria-label="Tìm chủ điểm ngữ pháp"
          placeholder="Tìm thì, câu hỏi, lời mời…"
          className={field}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <select
          aria-label="Cấp độ ngữ pháp"
          className={field}
          value={level}
          onChange={(e) => {
            setLevel(e.target.value);
            setLesson("all");
          }}
        >
          {COURSE_LEVELS.map((l) => (
            <option key={l.id} value={l.id}>
              {l.title}
            </option>
          ))}
        </select>
        <select
          aria-label="Lesson ngữ pháp"
          className={field}
          value={lesson}
          onChange={(e) => setLesson(e.target.value)}
        >
          <option value="all">Mọi lesson</option>
          {LESSONS.filter((l) => l.levelId === level).map((l) => (
            <option key={l.id} value={l.id}>
              Lesson {l.id}
            </option>
          ))}
        </select>
      </div>
      <p className="mb-3 text-sm text-ink-3">{topics.length} chủ điểm</p>
      <div className="space-y-3">
        {topics.map((t) => (
          <details
            id={t.id}
            key={t.id}
            className="scroll-mt-20 rounded-2xl border border-line bg-surface p-5"
            open={undefined}
          >
            <summary className="cursor-pointer font-semibold">
              {t.title}
              <span className="mt-2 block text-xs font-normal text-ink-3">
                Lesson{" "}
                {t.lessonRefs
                  .filter((ref) => ref.levelId === level)
                  .map((ref) => ref.lesson)
                  .join(", ")}
              </span>
            </summary>
            <div className="mt-5 space-y-5 text-sm leading-7">
              <section>
                <h2 className="font-semibold">Khi nào dùng?</h2>
                <p className="text-ink-2">{t.useVi}</p>
              </section>
              <section>
                <h2 className="font-semibold">Cấu trúc cần nhớ</h2>
                <ul className="list-disc space-y-1 pl-5">
                  {t.forms.map((f) => (
                    <li key={f}>{f}</li>
                  ))}
                </ul>
              </section>
              <section>
                <h2 className="font-semibold">Ví dụ</h2>
                <div className="mt-2 space-y-2">
                  {t.examples.map((ex) => (
                    <div
                      key={ex.en}
                      className="rounded-xl bg-surface-2 px-4 py-3"
                    >
                      <p lang="en" className="font-medium">
                        {ex.en}
                      </p>
                      <p className="text-ink-2">{ex.vi}</p>
                    </div>
                  ))}
                </div>
              </section>
              <section>
                <h2 className="font-semibold">Lỗi thường gặp</h2>
                {t.mistakes.map((m) => (
                  <div
                    key={m.wrong}
                    className="mt-2 rounded-xl border border-line px-4 py-3"
                  >
                    <p className="text-bad">
                      Sai: <span lang="en">{m.wrong}</span>
                    </p>
                    <p className="text-good">
                      Đúng: <span lang="en">{m.correct}</span>
                    </p>
                    <p className="text-ink-2">{m.why}</p>
                  </div>
                ))}
              </section>
              <section>
                <h2 className="font-semibold">Phân biệt và lưu ý</h2>
                <p className="text-ink-2">{t.compareVi}</p>
              </section>
              <div className="flex flex-wrap gap-2">
                {t.lessonRefs
                  .filter((ref) => ref.levelId === level)
                  .map(({ lesson: id }) => (
                    <Link
                      key={id}
                      href={`/courses/${level}?lesson=${id}&topic=${t.id}`}
                    >
                      <Badge tone="accent">Luyện Lesson {id}</Badge>
                    </Link>
                  ))}
              </div>
              <p className="text-xs text-ink-3">
                Tham khảo:{" "}
                {t.sources.map((s) => (
                  <a
                    key={s.url}
                    href={s.url}
                    target="_blank"
                    rel="noreferrer"
                    className="mr-2 underline"
                  >
                    {s.title}
                  </a>
                ))}
              </p>
            </div>
          </details>
        ))}
      </div>
      {!topics.length && (
        <p className="py-8 text-center text-ink-2">
          Không có chủ điểm phù hợp. Thử đổi bộ lọc.
        </p>
      )}
    </div>
  );
}
