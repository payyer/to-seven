"use client";

import Link from "next/link";
import { useRef, useState, type ChangeEvent } from "react";
import { TOPICS } from "@/data/topics";
import { WORDS } from "@/data/words";
import { playWord } from "@/lib/speech";
import { downloadSnapshot, exportSnapshot, hasLocalProgress, importSnapshot, localSnapshot, resetAll, updateSettings, useAppState } from "@/lib/store";
import { LEVELS, type TopicId } from "@/lib/types";
import { Button, Card, Loading, PageHeader } from "../ui";

export function SettingsView() {
  const state = useAppState();
  const fileRef = useRef<HTMLInputElement>(null);
  const [message, setMessage] = useState<string | null>(null);

  if (!state) return <Loading />;
  const { settings, placement } = state;

  const toggleTopic = (id: TopicId) => {
    const list = settings.preferredTopics;
    updateSettings({ preferredTopics: list.includes(id) ? list.filter((t) => t !== id) : [...list, id] });
  };

  const download = () => {
    const data = exportSnapshot();
    if (!data) return;
    downloadSnapshot(data);
  };

  const upload = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    try {
      if (!window.confirm("Thay thế toàn bộ tiến độ đám mây bằng file này?")) return;
      const current = exportSnapshot();
      if (current) downloadSnapshot(current, "ielts-vocab-before-import");
      await importSnapshot(JSON.parse(await file.text()));
      setMessage("Đã nhập dữ liệu thành công.");
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Không đọc được file.");
    }
  };

  const reset = async () => {
    if (!window.confirm("Xoá toàn bộ tiến độ học, kết quả kiểm tra và cài đặt? Không thể hoàn tác.")) return;
    try { await resetAll(); setMessage("Đã xoá toàn bộ dữ liệu."); }
    catch (error) { setMessage(error instanceof Error ? error.message : "Không xóa được dữ liệu."); }
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
          Tiến độ và bản nháp đang lưu trên Supabase, đồng bộ giữa các thiết bị. Bạn vẫn có thể xuất file sao lưu.
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          <Button variant="secondary" onClick={download}>
            Xuất file sao lưu
          </Button>
          <Button variant="secondary" onClick={() => fileRef.current?.click()}>
            Nhập từ file
          </Button>
          {hasLocalProgress() && <Button variant="secondary" onClick={async () => {
            if (!window.confirm("Thay thế tiến độ đám mây bằng tiến độ cũ trên máy này?")) return;
            try {
              const current = exportSnapshot();
              if (current) downloadSnapshot(current, "ielts-vocab-before-local-import");
              const local = await localSnapshot();
              downloadSnapshot(local, "ielts-vocab-local-backup");
              await importSnapshot(local);
              setMessage("Đã chuyển tiến độ cũ lên Supabase.");
            } catch (error) { setMessage(error instanceof Error ? error.message : "Không chuyển được dữ liệu."); }
          }}>Nhập tiến độ cũ trên máy</Button>}
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
