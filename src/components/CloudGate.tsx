"use client";

import { useEffect, useState, type ReactNode } from "react";
import { cloudRequest } from "@/lib/repository/cloud";
import { downloadSnapshot, ensureLoaded, exportSnapshot, finishMigration, flushDrafts, refreshCloud, retryCloud, useCloudState } from "@/lib/store";
import { Button, Card, Loading } from "./ui";

export function CloudGate({ children }: { children: ReactNode }) {
  const cloud = useCloudState();
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [backedUp, setBackedUp] = useState(false);

  useEffect(() => {
    void ensureLoaded();
    const visible = () => {
      if (document.visibilityState === "visible") void refreshCloud();
      else flushDrafts();
    };
    document.addEventListener("visibilitychange", visible);
    return () => document.removeEventListener("visibilitychange", visible);
  }, []);

  useEffect(() => {
    const beforeUnload = (event: BeforeUnloadEvent) => {
      if (cloud.pending) { flushDrafts(); event.preventDefault(); event.returnValue = ""; }
    };
    window.addEventListener("beforeunload", beforeUnload);
    return () => window.removeEventListener("beforeunload", beforeUnload);
  }, [cloud.pending]);

  const unlock = async () => {
    setBusy(true); setError("");
    try {
      await cloudRequest("/api/session", { method: "POST", body: JSON.stringify({ code }) });
      setCode("");
      await retryCloud();
    } catch (error) { setError(error instanceof Error ? error.message : "Không mở khóa được."); }
    finally { setBusy(false); }
  };

  if (cloud.phase === "locked") return (
    <Card>
      <h1 className="text-xl font-semibold">Mở khóa góc học tập</h1>
      <p className="mt-2 text-sm text-ink-2">Nhập mã một lần trên trình duyệt này để lưu và đồng bộ tiến độ của bạn.</p>
      <form className="mt-4 flex gap-2" onSubmit={e => { e.preventDefault(); void unlock(); }}>
        <input type="password" autoComplete="current-password" aria-label="Mã truy cập" required value={code} onChange={e => setCode(e.target.value)} className="min-w-0 flex-1 rounded-lg border border-line bg-surface px-3 py-2" />
        <Button type="submit" disabled={busy}>{busy ? "Đang mở…" : "Mở khóa"}</Button>
      </form>
      {error && <p role="alert" className="mt-3 text-bad">{error}</p>}
    </Card>
  );

  if (cloud.phase === "migration") return (
    <Card>
      <h1 className="text-xl font-semibold">Chuyển tiến độ lên Supabase</h1>
      <p className="mt-2 text-sm text-ink-2">{cloud.message} Bản sao lưu sẽ được tải xuống trước khi chuyển. Dữ liệu cũ trên máy vẫn được giữ lại.</p>
      <div className="mt-4 flex flex-wrap gap-2">
        <Button disabled={busy} onClick={async () => { setBusy(true); await finishMigration(true); setBusy(false); }}>Sao lưu và chuyển tiến độ</Button>
        <Button variant="secondary" disabled={busy} onClick={async () => { setBusy(true); await finishMigration(false); setBusy(false); }}>Bắt đầu mới trên đám mây</Button>
      </div>
    </Card>
  );

  if (cloud.phase === "loading") return <Loading />;

  if (cloud.phase === "error") return (
    <Card>
      <h1 className="font-semibold">{cloud.conflict ? "Có tiến độ mới trên đám mây" : "Chưa lưu hoặc tải được tiến độ"}</h1>
      <p role="alert" className="mt-2 text-sm text-bad">{cloud.message}</p>
      <p className="mt-2 text-sm text-ink-2">Giữ tab này mở để bảo toàn thay đổi chưa lưu.</p>
      <div className="mt-4 flex flex-wrap gap-2">
        {!cloud.conflict && <Button onClick={() => void retryCloud()}>Thử lại</Button>}
        {exportSnapshot() && <Button variant="secondary" onClick={() => { const snapshot = exportSnapshot(); if (snapshot) { downloadSnapshot(snapshot, "ielts-vocab-recovery"); setBackedUp(true); } }}>Tải bản khôi phục</Button>}
        {cloud.conflict && <Button variant="secondary" disabled={!!exportSnapshot() && !backedUp} onClick={() => { if (window.confirm("Bỏ thay đổi trong tab này và tải tiến độ đám mây? Bạn có thể nhập lại file khôi phục trong Cài đặt.")) window.location.reload(); }}>Tải lại từ đám mây</Button>}
      </div>
    </Card>
  );

  return <>
    <p role="status" aria-live="polite" className="mb-3 text-right text-xs text-ink-3">{cloud.pending ? "Đang lưu lên Supabase…" : "Đã lưu trên Supabase"}</p>
    {children}
  </>;
}
