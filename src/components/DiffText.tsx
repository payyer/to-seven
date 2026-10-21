import type { WordOp } from "@/lib/text";

/**
 * Hiển thị kết quả so sánh theo từ.
 * Chữ đỏ gạch ngang = bạn viết sai/thừa, chữ xanh = đúng ra phải là / còn thiếu.
 */
export function DiffText({ ops, className = "" }: { ops: WordOp[]; className?: string }) {
  return (
    <p className={`leading-loose ${className}`}>
      {ops.map((op, i) => {
        const space = i > 0 ? " " : "";
        switch (op.type) {
          case "equal":
            return <span key={i}>{space + op.input}</span>;
          case "replace":
            return (
              <span key={i}>
                {space}
                <del className="rounded bg-bad-soft px-0.5 text-bad decoration-2">{op.input}</del>{" "}
                <ins className="rounded bg-good-soft px-0.5 font-semibold text-good no-underline">{op.ref}</ins>
              </span>
            );
          case "missing":
            return (
              <span key={i}>
                {space}
                <ins
                  className="rounded border border-dashed border-good/50 bg-good-soft px-0.5 font-semibold text-good no-underline"
                  title="Còn thiếu"
                >
                  {op.ref}
                </ins>
              </span>
            );
          case "extra":
            return (
              <span key={i}>
                {space}
                <del className="rounded bg-bad-soft px-0.5 text-bad decoration-2" title="Thừa">
                  {op.input}
                </del>
              </span>
            );
        }
      })}
    </p>
  );
}

export function DiffLegend() {
  return (
    <p className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-ink-3">
      <span>
        <del className="rounded bg-bad-soft px-1 text-bad">đỏ</del> sai / thừa
      </span>
      <span>
        <ins className="rounded bg-good-soft px-1 font-semibold text-good no-underline">xanh</ins> đáp án đúng
      </span>
      <span>
        <ins className="rounded border border-dashed border-good/50 bg-good-soft px-1 text-good no-underline">khung nét đứt</ins>{" "}
        còn thiếu
      </span>
    </p>
  );
}
