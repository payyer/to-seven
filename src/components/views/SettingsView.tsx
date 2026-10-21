"use client";

import Link from "next/link";
import { useRef, useState, type ChangeEvent } from "react";
import { TOPICS } from "@/data/topics";
import { WORDS } from "@/data/words";
import { playWord } from "@/lib/speech";
import { exportSnapshot, importSnapshot, resetAll, updateSettings, useAppState } from "@/lib/store";
import { LEVELS, type TopicId } from "@/lib/types";
import { getAccessCode, setAccessCode } from "@/lib/ai-client";
import { Button, Card, Loading, PageHeader } from "../ui";

/** Mã truy cập AI: chỉ cần khi server đặt APP_ACCESS_CODE (bản deploy công khai). */
function AccessCodeCard() {
  const [code, setCode] = useState(() => getAccessCode());
  const [saved, setSaved] = useState(false);
  return (
    <Card>
      <h2 className="font-semibold">Mã truy cập AI</h2>
      <p className="mt-0.5 text-sm text-ink-2">
        Chỉ cần khi bản deploy có đặt biến <code className="rounded bg-surface-2 px-1">APP_ACCESS_CODE</code> để người lạ không dùng được
        API key của bạn. Mã chỉ lưu trên trình duyệt này.
      </p>
      <form
        className="mt-3 flex gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          setAccessCode(code.trim());
          setSaved(true);
        }}
      >
        <input
          type="password"
          value={code}
          onChange={(e) => {
            setCode(e.target.value);
            setSaved(false);
          }}
          placeholder="Nhập mã…"
          aria-label="Mã truy cập AI"
          autoComplete="off"
          className="flex-1 rounded-lg border border-line bg-surface px-3 py-2 outline-none focus:border-accent focus:ring-2 focus:ring-accent/25"
        />
        <Button type="submit" variant="secondary">
          {saved ? "Đã lưu" : "Lưu"}
        </Button>
      </form>
    </Card>
  );
}

export function SettingsView() {
  const state = useAppState();
  const fileRef = useRef<HTMLInputElement>(null);
  const [message, setMessage] = useState<string | null>(null);

  if (!state) return <Loading />;
  const { settings, placement, today } = state;

  const toggleTopic = (id: TopicId) => {
    const list = settings.preferredTopics;
    updateSettings({ preferredTopics: list.includes(id) ? list.filter((t) => t !== id) : [...list, id] });
  };

  const download = () => {
    const data = exportSnapshot();
    if (!data) return;
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `ielts-vocab-${today}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const upload = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    try {
      await importSnapshot(JSON.parse(await file.text()));
      setMessage("Đã nhập dữ liệu thành công.");
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Không đọc được file.");
    }
  };

  const reset = async () => {
    if (!window.confirm("Xoá toàn bộ tiến độ học, kết quả kiểm tra và cài đặt? Không thể hoàn tác.")) return;
    await resetAll();
    setMessage("Đã xoá toàn bộ dữ liệu.");
  };

  return (
    <div className="space-y-4">
      <PageHeader title="Cài đặt" />

      <Card>
        <label htmlFor="daily" className="flex items-baseline justify-between font-semibold">
          Số từ mới mỗi ngày
          <span className="tabular text-2xl text-accent-strong">{settings.dailyNewWords}</span>
        </label>
        <input
          id="daily"
          type="range"
          min={5}
          max={15}
          value={settings.dailyNewWords}
          onChange={(e) => updateSettings({ dailyNewWords: Number(e.target.value) })}
          className="mt-3 w-full accent-accent"
        />
        <div className="tabular flex justify-between text-xs text-ink-3">
          <span>5</span>
          <span>10</span>
          <span>15</span>
        </div>
        <p className="mt-2 text-sm text-ink-2">
          Mỗi từ mới sẽ quay lại khoảng 4–5 lần trong 3 tuần đầu. Với {settings.dailyNewWords} từ/ngày, mỗi ngày bạn sẽ ôn khoảng{" "}
          {settings.dailyNewWords * 4} thẻ khi đã vào guồng.
        </p>
      </Card>

      <Card>
        <h2 className="font-semibold">Nhóm từ ưu tiên</h2>
        <p className="mt-0.5 text-sm text-ink-2">
          Từ mới được chọn theo nhóm này trước, sau đó đến nhóm khó hơn một bậc.
          {placement && ` Bài kiểm tra gợi ý: ${placement.recommendedLevel}.`}{" "}
          <Link href="/placement" className="font-medium text-accent-strong hover:underline">
            {placement ? "Kiểm tra lại" : "Làm bài kiểm tra"}
          </Link>
        </p>
        <div className="mt-3 grid grid-cols-4 gap-2" role="radiogroup" aria-label="Nhóm từ ưu tiên">
          {LEVELS.map((l) => (
            <button
              key={l}
              type="button"
              role="radio"
              aria-checked={settings.focusLevel === l}
              onClick={() => updateSettings({ focusLevel: l })}
              className={`rounded-xl border py-2.5 text-sm font-semibold ${
                settings.focusLevel === l ? "border-accent bg-accent-soft text-accent-strong" : "border-line hover:bg-surface-2"
              }`}
            >
              {l}
              <span className="tabular block text-xs font-normal text-ink-3">{WORDS.filter((w) => w.level === l).length} từ</span>
            </button>
          ))}
        </div>
      </Card>

      <Card>
        <h2 className="font-semibold">Chủ đề ưu tiên</h2>
        <p className="mt-0.5 text-sm text-ink-2">
          Chọn theo thứ tự muốn học. Không chọn gì thì app đi lần lượt các chủ đề.
        </p>
        <div className="mt-3 flex flex-wrap gap-1.5">
          {TOPICS.map((t) => {
            const order = settings.preferredTopics.indexOf(t.id);
            const on = order >= 0;
            return (
              <button
                key={t.id}
                type="button"
                aria-pressed={on}
                onClick={() => toggleTopic(t.id)}
                className={`flex items-center gap-1.5 rounded-full border px-3 py-1 text-sm ${
                  on ? "border-accent bg-accent-soft font-medium text-accent-strong" : "border-line text-ink-2 hover:bg-surface-2"
                }`}
              >
                {on && (
                  <span className="tabular grid h-4 w-4 place-items-center rounded-full bg-accent text-[10px] text-on-accent">
                    {order + 1}
                  </span>
                )}
                {t.name}
              </button>
            );
          })}
        </div>
      </Card>

      <AccessCodeCard />

      <Card>
        <h2 className="font-semibold">Phát âm</h2>
        <label className="mt-3 flex cursor-pointer items-start gap-3">
          <input
            type="checkbox"
            checked={settings.preferRealAudio}
            onChange={(e) => updateSettings({ preferRealAudio: e.target.checked })}
            className="mt-1 h-4 w-4 accent-accent"
          />
          <span className="text-sm">
            <span className="font-medium">Ưu tiên giọng người thật</span>
            <span className="block text-ink-2">
              Lấy file phát âm từ Free Dictionary API (cần mạng). Nếu không có thì dùng giọng đọc máy của trình duyệt.
            </span>
          </span>
        </label>
        <div className="mt-3">
          <Button variant="secondary" onClick={() => playWord("comfortable", { preferReal: settings.preferRealAudio })}>
            Nghe thử “comfortable”
          </Button>
        </div>
      </Card>

      <Card>
        <h2 className="font-semibold">Dữ liệu</h2>
        <p className="mt-0.5 text-sm text-ink-2">
          Tiến độ đang lưu trong trình duyệt này (localStorage). Nên xuất file sao lưu định kỳ, hoặc trước khi đổi máy/trình duyệt.
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          <Button variant="secondary" onClick={download}>
            Xuất file sao lưu
          </Button>
          <Button variant="secondary" onClick={() => fileRef.current?.click()}>
            Nhập từ file
          </Button>
          <input ref={fileRef} type="file" accept="application/json,.json" onChange={upload} className="hidden" />
          <Button variant="danger" onClick={reset}>
            Xoá toàn bộ dữ liệu
          </Button>
        </div>
        {message && (
          <p role="status" className="mt-3 text-sm text-ink-2">
            {message}
          </p>
        )}
      </Card>
    </div>
  );
}
