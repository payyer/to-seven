"use client";
import { useEffect, useState, type ReactNode } from "react";
import { cloudRequest, CloudError } from "@/lib/repository/cloud";
import { Button, Card, Loading } from "./ui";

/** Authentication only: never initializes or reads the legacy study store. */
export function SessionGate({ children }: { children: ReactNode }) {
  const [phase, setPhase] = useState<"loading" | "locked" | "ready" | "error">(
    "loading",
  );
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const check = async () => {
    try {
      await cloudRequest("/api/session");
      setPhase("ready");
      setError("");
    } catch (e) {
      setPhase(
        e instanceof CloudError && e.status === 401 ? "locked" : "error",
      );
      setError(e instanceof Error ? e.message : "Không kết nối được máy chủ.");
    }
  };
  useEffect(() => {
    let active = true;
    void cloudRequest("/api/session").then(
      () => {
        if (active) {
          setPhase("ready");
          setError("");
        }
      },
      (e) => {
        if (active) {
          setPhase(
            e instanceof CloudError && e.status === 401 ? "locked" : "error",
          );
          setError(
            e instanceof Error ? e.message : "Không kết nối được máy chủ.",
          );
        }
      },
    );
    return () => {
      active = false;
    };
  }, []);
  if (phase === "loading") return <Loading />;
  if (phase === "ready") return children;
  return (
    <Card>
      <h1 className="text-xl font-semibold">
        {phase === "locked" ? "Mở khóa góc học tập" : "Chưa kết nối được"}
      </h1>
      <p className="mt-2 text-sm text-ink-2">
        Dùng mã truy cập hiện tại để mở thư viện và đồng bộ bài ôn theo cấp độ.
      </p>
      {phase === "locked" ? (
        <form
          className="mt-4 flex gap-2"
          onSubmit={async (e) => {
            e.preventDefault();
            setBusy(true);
            try {
              await cloudRequest("/api/session", {
                method: "POST",
                body: JSON.stringify({ code }),
              });
              setCode("");
              await check();
            } catch (e) {
              setError(e instanceof Error ? e.message : "Không mở khóa được.");
            } finally {
              setBusy(false);
            }
          }}
        >
          <input
            aria-label="Mã truy cập"
            type="password"
            autoComplete="current-password"
            required
            className="min-w-0 flex-1 rounded-lg border border-line bg-surface px-3 py-2"
            value={code}
            onChange={(e) => setCode(e.target.value)}
          />
          <Button type="submit" disabled={busy}>
            {busy ? "Đang mở…" : "Mở khóa"}
          </Button>
        </form>
      ) : (
        <Button className="mt-4" onClick={() => void check()}>
          Thử lại
        </Button>
      )}
      {error && (
        <p role="alert" className="mt-3 text-sm text-bad">
          {error}
        </p>
      )}
    </Card>
  );
}
