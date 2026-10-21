// Tiện ích xử lý chữ: so khớp đáp án, tìm từ trong câu ví dụ, so sánh từng ký tự, tách trọng âm.

export function normalizeAnswer(text: string): string {
  return text
    .toLowerCase()
    .replace(/[’‘`]/g, "'")
    .replace(/[.,!?;:]+$/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

export function levenshtein(a: string, b: string): number {
  const prev = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    let diag = prev[0];
    prev[0] = i;
    for (let j = 1; j <= b.length; j++) {
      const tmp = prev[j];
      prev[j] = Math.min(prev[j] + 1, prev[j - 1] + 1, diag + (a[i - 1] === b[j - 1] ? 0 : 1));
      diag = tmp;
    }
  }
  return prev[b.length];
}

export type AnswerVerdict = "correct" | "close" | "wrong" | "empty";

/**
 * So sánh câu trả lời với đáp án.
 * "close" = sai chính tả nhẹ (1 ký tự với từ ngắn, 2 ký tự với từ từ 8 chữ cái).
 */
export function checkAnswer(input: string, answer: string, alternatives: string[] = []): AnswerVerdict {
  const given = normalizeAnswer(input);
  if (!given) return "empty";
  const targets = [answer, ...alternatives].map(normalizeAnswer);
  if (targets.includes(given)) return "correct";
  const target = targets[0];
  const tolerance = target.length >= 8 ? 2 : target.length >= 4 ? 1 : 0;
  return levenshtein(given, target) <= tolerance ? "close" : "wrong";
}

function escapeRegExp(text: string): string {
  return text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/** Mẫu cho phép biến thể đuôi: -s, -ed, -ing, y → i, bỏ e câm. */
function tokenPattern(token: string): string {
  const t = token.toLowerCase();
  if (t.length > 3 && t.endsWith("e")) return `${escapeRegExp(t.slice(0, -1))}\\w*`;
  if (t.length > 3 && t.endsWith("y")) return `${escapeRegExp(t.slice(0, -1))}(?:y|i)\\w*`;
  return `${escapeRegExp(t)}\\w*`;
}

/** Vị trí [bắt đầu, kết thúc) của từ (kể cả dạng chia) trong câu, hoặc null. */
export function findWordInSentence(sentence: string, word: string): [number, number] | null {
  const pattern = word.split(/\s+/).map(tokenPattern).join("\\s+");
  const match = new RegExp(`\\b${pattern}`, "i").exec(sentence);
  return match ? [match.index, match.index + match[0].length] : null;
}

/**
 * Vị trí của đoạn `fragment` trong câu, ưu tiên khớp nguyên từ
 * (để "i" không bị tô vào giữa "it"). -1 nếu không có.
 */
export function findFragment(sentence: string, fragment: string): number {
  if (!fragment) return -1;
  const whole = new RegExp(`(?<![A-Za-z])${escapeRegExp(fragment)}(?![A-Za-z])`).exec(sentence);
  return whole ? whole.index : sentence.indexOf(fragment);
}

/** Thay từ trong câu bằng "_____" để làm gợi ý mà không lộ đáp án. */
export function maskWord(sentence: string, word: string): string | null {
  const range = findWordInSentence(sentence, word);
  if (!range) return null;
  return `${sentence.slice(0, range[0])}_____${sentence.slice(range[1])}`;
}

export type DiffPart = { text: string; kind: "same" | "extra" | "missing" };

/**
 * So sánh từng ký tự (LCS) giữa chữ người dùng gõ và đáp án.
 * Trả về hai dãy: `given` (ký tự thừa/sai đánh dấu "extra") và `answer` (ký tự thiếu đánh dấu "missing").
 */
export function charDiff(given: string, answer: string): { given: DiffPart[]; answer: DiffPart[] } {
  const a = given;
  const b = answer;
  const dp = Array.from({ length: a.length + 1 }, () => new Array<number>(b.length + 1).fill(0));
  for (let i = a.length - 1; i >= 0; i--) {
    for (let j = b.length - 1; j >= 0; j--) {
      dp[i][j] = a[i].toLowerCase() === b[j].toLowerCase() ? dp[i + 1][j + 1] + 1 : Math.max(dp[i + 1][j], dp[i][j + 1]);
    }
  }
  const givenParts: DiffPart[] = [];
  const answerParts: DiffPart[] = [];
  const push = (list: DiffPart[], text: string, kind: DiffPart["kind"]) => {
    const last = list[list.length - 1];
    if (last && last.kind === kind) last.text += text;
    else list.push({ text, kind });
  };
  let i = 0;
  let j = 0;
  while (i < a.length && j < b.length) {
    if (a[i].toLowerCase() === b[j].toLowerCase()) {
      push(givenParts, a[i++], "same");
      push(answerParts, b[j++], "same");
    } else if (dp[i + 1][j] >= dp[i][j + 1]) {
      push(givenParts, a[i++], "extra");
    } else {
      push(answerParts, b[j++], "missing");
    }
  }
  while (i < a.length) push(givenParts, a[i++], "extra");
  while (j < b.length) push(answerParts, b[j++], "missing");
  return { given: givenParts, answer: answerParts };
}

// ---- So sánh theo từ (dictation, câu đã sửa) ----

export type WordOp =
  | { type: "equal"; ref: string; input: string }
  | { type: "replace"; ref: string; input: string }
  | { type: "missing"; ref: string }
  | { type: "extra"; input: string };

/** Chuẩn hoá một từ để so sánh: chữ thường, bỏ dấu câu ở hai đầu, thống nhất dấu nháy. */
export function normalizeToken(token: string, strict = false): string {
  const t = token.replace(/[’‘`]/g, "'");
  if (strict) return t;
  return t.toLowerCase().replace(/^[^a-z0-9']+|[^a-z0-9']+$/gi, "");
}

export function tokenize(text: string): string[] {
  return text.split(/\s+/).filter(Boolean);
}

/**
 * Căn hai đoạn văn theo từ (LCS). `strict` = phân biệt hoa thường và dấu câu.
 * Cặp "thiếu + thừa" liền nhau được gộp thành "replace" để hiển thị gọn.
 */
export function wordDiff(reference: string, input: string, strict = false): WordOp[] {
  const ref = tokenize(reference);
  const inp = tokenize(input);
  const r = ref.map((t) => normalizeToken(t, strict));
  const s = inp.map((t) => normalizeToken(t, strict));
  const dp = Array.from({ length: r.length + 1 }, () => new Array<number>(s.length + 1).fill(0));
  for (let i = r.length - 1; i >= 0; i--) {
    for (let j = s.length - 1; j >= 0; j--) {
      dp[i][j] = r[i] === s[j] ? dp[i + 1][j + 1] + 1 : Math.max(dp[i + 1][j], dp[i][j + 1]);
    }
  }
  const raw: WordOp[] = [];
  let i = 0;
  let j = 0;
  while (i < r.length && j < s.length) {
    if (r[i] === s[j]) raw.push({ type: "equal", ref: ref[i++], input: inp[j++] });
    else if (dp[i + 1][j] >= dp[i][j + 1]) raw.push({ type: "missing", ref: ref[i++] });
    else raw.push({ type: "extra", input: inp[j++] });
  }
  while (i < r.length) raw.push({ type: "missing", ref: ref[i++] });
  while (j < s.length) raw.push({ type: "extra", input: inp[j++] });

  // Trong mỗi đoạn nằm giữa hai từ khớp: ghép lần lượt từ thiếu với từ thừa thành "replace".
  const ops: WordOp[] = [];
  let missing: string[] = [];
  let extra: string[] = [];
  const flush = () => {
    const n = Math.max(missing.length, extra.length);
    for (let k = 0; k < n; k++) {
      if (k < missing.length && k < extra.length) ops.push({ type: "replace", ref: missing[k], input: extra[k] });
      else if (k < missing.length) ops.push({ type: "missing", ref: missing[k] });
      else ops.push({ type: "extra", input: extra[k] });
    }
    missing = [];
    extra = [];
  };
  for (const op of raw) {
    if (op.type === "missing") missing.push(op.ref);
    else if (op.type === "extra") extra.push(op.input);
    else {
      flush();
      ops.push(op);
    }
  }
  flush();
  return ops;
}

/** Tỉ lệ đúng = số từ khớp / số từ của bản gốc. */
export function diffAccuracy(ops: WordOp[]): number {
  const refCount = ops.filter((o) => o.type !== "extra").length;
  if (refCount === 0) return 0;
  return ops.filter((o) => o.type === "equal").length / refCount;
}

/** Tách đoạn văn thành câu. */
export function splitSentences(text: string): string[] {
  return text
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter(Boolean);
}

export type StressPart ={ text: string; stressed: boolean; separator: boolean };

/** "ex·PE·ri·ence" → các âm tiết, âm tiết viết HOA là trọng âm. Dấu cách và gạch nối giữ lại làm separator. */
export function parseStress(stress: string): StressPart[] {
  const parts: StressPart[] = [];
  for (const piece of stress.split(/(·|\s+|-)/)) {
    if (!piece) continue;
    if (piece === "·") continue;
    if (/^\s+$/.test(piece) || piece === "-") {
      parts.push({ text: piece === "-" ? "-" : " ", stressed: false, separator: true });
      continue;
    }
    const stressed = /[A-Z]/.test(piece) && piece === piece.toUpperCase();
    parts.push({ text: piece.toLowerCase(), stressed, separator: false });
  }
  return parts;
}

/** Vị trí âm tiết trọng âm (bắt đầu từ 1) với từ đơn; null với cụm từ. */
export function stressedSyllableIndex(stress: string): { index: number; total: number } | null {
  if (/[\s-]/.test(stress)) return null;
  const syllables = stress.split("·");
  if (syllables.length < 2) return null;
  const index = syllables.findIndex((s) => s === s.toUpperCase());
  return index >= 0 ? { index: index + 1, total: syllables.length } : null;
}
