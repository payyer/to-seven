"use client";

import { useEffect, useRef, useState } from "react";
import { addDays, formatShort } from "@/lib/date";
import type { WeekPoint } from "@/lib/stats";

type Metric = "newWords" | "reviews" | "masteredTotal";

const METRICS: { id: Metric; label: string; title: string }[] = [
  { id: "newWords", label: "Từ mới", title: "Số từ mới học mỗi tuần" },
  { id: "reviews", label: "Lượt ôn", title: "Số lượt ôn tập mỗi tuần" },
  { id: "masteredTotal", label: "Đã thuộc", title: "Tổng số từ đã thuộc (tính đến cuối tuần)" },
];

const HEIGHT = 200;
const M = { top: 22, right: 8, bottom: 26, left: 34 };

/** Mốc trục Y tròn số: bước 1/2/5 × 10^k, khoảng 4 vạch. */
function niceTicks(max: number): number[] {
  if (max <= 0) return [0, 5];
  const rough = max / 4;
  const pow = 10 ** Math.floor(Math.log10(rough));
  const step = [1, 2, 5, 10].map((s) => s * pow).find((s) => s >= rough) ?? pow * 10;
  const stepInt = Math.max(1, Math.round(step));
  const ticks: number[] = [];
  for (let v = 0; v <= max + stepInt - 1; v += stepInt) ticks.push(v);
  if (ticks[ticks.length - 1] < max) ticks.push(ticks[ticks.length - 1] + stepInt);
  return ticks;
}

/** Thanh có bo góc 4px ở đầu dữ liệu, vuông ở đường nền. */
function barPath(x: number, y: number, w: number, h: number): string {
  const r = Math.min(4, w / 2, h);
  return `M${x},${y + h}V${y + r}Q${x},${y} ${x + r},${y}H${x + w - r}Q${x + w},${y} ${x + w},${y + r}V${y + h}Z`;
}

function weekRange(p: WeekPoint): string {
  return `${formatShort(p.weekStart)}–${formatShort(addDays(p.weekStart, 6))}`;
}

export function WeeklyChart({ data }: { data: WeekPoint[] }) {
  const [metric, setMetric] = useState<Metric>("newWords");
  const [width, setWidth] = useState(0);
  const [hover, setHover] = useState<number | null>(null);
  const [showTable, setShowTable] = useState(false);
  const boxRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = boxRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => setWidth(Math.floor(entry.contentRect.width)));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const meta = METRICS.find((m) => m.id === metric)!;
  const values = data.map((d) => d[metric]);
  const ticks = niceTicks(Math.max(...values));
  const yMax = ticks[ticks.length - 1];
  const plotW = Math.max(0, width - M.left - M.right);
  const plotH = HEIGHT - M.top - M.bottom;
  const band = data.length ? plotW / data.length : 0;
  const barW = Math.min(24, Math.max(4, band * 0.55));
  const y = (v: number) => M.top + plotH - (v / yMax) * plotH;
  const last = data.length - 1;
  const allZero = values.every((v) => v === 0);

  return (
    <div>
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="font-semibold">Tiến bộ theo tuần</h2>
          <p className="text-xs text-ink-3">{meta.title} · 8 tuần gần nhất</p>
        </div>
        <div className="flex rounded-lg bg-surface-2 p-0.5 text-xs" role="tablist" aria-label="Chọn chỉ số">
          {METRICS.map((m) => (
            <button
              key={m.id}
              type="button"
              role="tab"
              aria-selected={metric === m.id}
              onClick={() => setMetric(m.id)}
              className={`rounded-md px-2.5 py-1 font-medium ${
                metric === m.id ? "bg-surface text-ink shadow-sm" : "text-ink-3 hover:text-ink"
              }`}
            >
              {m.label}
            </button>
          ))}
        </div>
      </div>

      <div ref={boxRef} className="relative" style={{ height: HEIGHT }}>
        {width > 0 && (
          <svg width={width} height={HEIGHT} role="img" aria-label={`${meta.title}. Tuần này: ${values[last]}.`}>
            {ticks.map((t) => (
              <g key={t}>
                <line x1={M.left} x2={width - M.right} y1={y(t)} y2={y(t)} stroke="var(--grid)" strokeWidth={1} />
                <text x={M.left - 8} y={y(t)} dy="0.32em" textAnchor="end" className="tabular fill-ink-3 text-[11px]">
                  {t}
                </text>
              </g>
            ))}
            {data.map((d, i) => {
              const v = values[i];
              const cx = M.left + band * i + band / 2;
              const h = (v / yMax) * plotH;
              return (
                <g key={d.weekStart}>
                  {v > 0 && (
                    <path
                      d={barPath(cx - barW / 2, y(v), barW, h)}
                      fill="var(--accent)"
                      opacity={hover === null || hover === i ? 1 : 0.45}
                    />
                  )}
                  {i === last && v > 0 && (
                    <text x={cx} y={y(v) - 6} textAnchor="middle" className="tabular fill-ink text-[11px] font-semibold">
                      {v}
                    </text>
                  )}
                  {/* Màn hẹp: nhãn ngắn hơn và cách một tuần hiện một nhãn để không chồng nhau. */}
                  {(band >= 40 || (last - i) % 2 === 0) && (
                    <text
                      x={cx}
                      y={HEIGHT - 8}
                      textAnchor="middle"
                      className={`tabular text-[10px] ${i === last ? "fill-ink-2 font-semibold" : "fill-ink-3"}`}
                    >
                      {i === last ? (band >= 56 ? "Tuần này" : "Nay") : formatShort(d.weekStart)}
                    </text>
                  )}
                  <rect
                    x={M.left + band * i}
                    y={M.top}
                    width={band}
                    height={plotH}
                    fill="transparent"
                    tabIndex={0}
                    aria-label={`Tuần ${weekRange(d)}: ${v}`}
                    onMouseEnter={() => setHover(i)}
                    onMouseLeave={() => setHover(null)}
                    onFocus={() => setHover(i)}
                    onBlur={() => setHover(null)}
                    className="outline-none"
                  />
                </g>
              );
            })}
          </svg>
        )}

        {hover !== null && width > 0 && (
          <div
            className="pointer-events-none absolute z-10 -translate-x-1/2 -translate-y-full rounded-lg border border-line bg-surface px-2.5 py-1.5 text-xs shadow-md"
            style={{
              left: Math.min(Math.max(M.left + band * hover + band / 2, 70), width - 70),
              top: Math.max(y(values[hover]) - 8, 40),
            }}
          >
            <div className="text-ink-3">Tuần {weekRange(data[hover])}</div>
            <div className="mt-0.5 flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-sm bg-accent" />
              <span className="text-ink-2">{meta.label}:</span>
              <span className="tabular font-semibold text-ink">{values[hover]}</span>
            </div>
          </div>
        )}

        {allZero && width > 0 && (
          <p className="absolute inset-x-0 top-1/2 -translate-y-1/2 text-center text-sm text-ink-3">
            Chưa có dữ liệu. Học vài từ hôm nay để biểu đồ bắt đầu chạy nhé.
          </p>
        )}
      </div>

      <button
        type="button"
        onClick={() => setShowTable((s) => !s)}
        className="mt-2 text-xs font-medium text-ink-3 underline-offset-2 hover:text-ink hover:underline"
        aria-expanded={showTable}
      >
        {showTable ? "Ẩn bảng số liệu" : "Xem dạng bảng"}
      </button>
      {showTable && (
        <table className="tabular mt-2 w-full text-left text-sm">
          <thead className="text-xs text-ink-3">
            <tr>
              <th className="py-1 font-medium">Tuần</th>
              <th className="py-1 text-right font-medium">Từ mới</th>
              <th className="py-1 text-right font-medium">Lượt ôn</th>
              <th className="py-1 text-right font-medium">Đã thuộc</th>
            </tr>
          </thead>
          <tbody>
            {data.map((d) => (
              <tr key={d.weekStart} className="border-t border-line">
                <td className="py-1">{weekRange(d)}</td>
                <td className="py-1 text-right">{d.newWords}</td>
                <td className="py-1 text-right">{d.reviews}</td>
                <td className="py-1 text-right">{d.masteredTotal}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
