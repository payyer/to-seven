#!/usr/bin/env node
/**
 * Kiểm tra danh sách từ vựng của lớp (Google Sheet công khai của trung tâm).
 *
 *   npm run class-lists          → báo LIST nào mới / có thay đổi và in các dòng của LIST đó
 *   npm run class-lists -- --all → in mọi LIST
 *
 * Script chỉ đọc sheet và so với src/data/class-words.ts, không sửa file nào.
 * Thẻ từ (IPA, trọng âm, collocation, câu ví dụ) vẫn được soạn tay rồi thêm vào class-words.ts.
 */
import { existsSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

const SHEET_ID = "1rH0Q_ztqDhj3Eqb1GpZiK7v88rTwYLSe9i96AK_2bDU";
const DATA_FILE = fileURLToPath(new URL("../src/data/class-words.ts", import.meta.url));
const showAll = process.argv.includes("--all");

/** Các tab "LIST n" trong sheet: [{ name, list, gid }]. */
async function listTabs() {
  const res = await fetch(`https://docs.google.com/spreadsheets/d/${SHEET_ID}/htmlview`);
  if (!res.ok) throw new Error(`Không mở được sheet (HTTP ${res.status}). Sheet còn công khai không?`);
  const html = await res.text();
  const tabs = [];
  for (const m of html.matchAll(/\{name: "([^"]+)", pageUrl: "[^"]*", gid: "(\d+)"/g)) {
    const list = /^LIST\s*(\d+)/i.exec(m[1].trim());
    if (list) tabs.push({ name: m[1].trim(), list: Number(list[1]), gid: m[2] });
  }
  return tabs.sort((a, b) => a.list - b.list);
}

function parseCsv(text) {
  const rows = [];
  let row = [];
  let field = "";
  let quoted = false;
  const endField = () => {
    row.push(field);
    field = "";
  };
  const endRow = () => {
    endField();
    rows.push(row);
    row = [];
  };
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (quoted) {
      if (c === '"' && text[i + 1] === '"') {
        field += '"';
        i++;
      } else if (c === '"') quoted = false;
      else field += c;
    } else if (c === '"') quoted = true;
    else if (c === ",") endField();
    else if (c === "\n" || c === "\r") {
      if (c === "\r" && text[i + 1] === "\n") i++;
      endRow();
    } else field += c;
  }
  if (field || row.length) endRow();
  return rows;
}

/** Cột A (từ) và B (nghĩa), bỏ dòng tiêu đề "Vocab" và dòng "LIST n (LESSON …)". */
async function readList(tab) {
  const res = await fetch(`https://docs.google.com/spreadsheets/d/${SHEET_ID}/export?format=csv&gid=${tab.gid}`);
  if (!res.ok) throw new Error(`Không tải được ${tab.name} (HTTP ${res.status}).`);
  const rows = parseCsv(await res.text());
  const title = rows.map((r) => (r[0] ?? "").trim()).find((a) => /^LIST\s*\d+/i.test(a)) ?? tab.name;
  const items = rows
    .map((r) => ({ term: (r[0] ?? "").trim(), meaning: (r[1] ?? "").trim() }))
    .filter(({ term }) => term && term.toLowerCase() !== "vocab" && !/^LIST\s*\d+/i.test(term));
  return { title, items };
}

/** LIST đã nhập vào app và số dòng của sheet lúc nhập. */
function importedLists() {
  const map = new Map();
  if (!existsSync(DATA_FILE)) return map;
  const source = readFileSync(DATA_FILE, "utf8");
  for (const m of source.matchAll(/list:\s*(\d+),[^\n]*?sourceRows:\s*(\d+)/g)) map.set(Number(m[1]), Number(m[2]));
  return map;
}

const imported = importedLists();
const tabs = await listTabs();
if (tabs.length === 0) throw new Error("Không thấy tab LIST nào trong sheet.");

let pending = 0;
for (const tab of tabs) {
  const { title, items } = await readList(tab);
  const had = imported.get(tab.list);
  const status = had === undefined ? "MỚI" : had !== items.length ? `THAY ĐỔI (${had} → ${items.length} dòng)` : "đã nhập";
  console.log(`${title.padEnd(28)} ${String(items.length).padStart(3)} dòng  ${status}`);
  if (status === "đã nhập" && !showAll) continue;
  if (status !== "đã nhập") pending++;
  for (const { term, meaning } of items) console.log(`    ${term.replace(/\s*\n\s*/g, " ⏎ ")}  —  ${meaning.replace(/\s*\n\s*/g, " ")}`);
}
console.log(pending ? `\n${pending} LIST cần cập nhật.` : "\nKhông có LIST mới.");
