import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";

export const SESSION_COOKIE = "myenglish_session";
export const SESSION_SECONDS = 365 * 24 * 60 * 60;

export class HttpError extends Error {
  constructor(message: string, public status: number) { super(message); }
}

function config() {
  const code = process.env.APP_ACCESS_CODE;
  const secret = process.env.APP_SESSION_SECRET;
  if (!code || !secret || secret.length < 32) throw new HttpError("Chưa cấu hình mã truy cập và khóa phiên trên máy chủ.", 503);
  return { code, secret };
}

export function equalSecret(a: string, b: string) {
  const digest = (v: string) => createHmac("sha256", "myenglish-compare").update(v).digest();
  return timingSafeEqual(digest(a), digest(b));
}

function signature(payload: string) {
  const { code, secret } = config();
  return createHmac("sha256", secret).update(JSON.stringify([code, payload])).digest("base64url");
}

export function issueSession(now = Date.now()) {
  const expires = String(Math.floor(now / 1000) + SESSION_SECONDS);
  return `${expires}.${signature(expires)}`;
}

export function validSession(token: string, now = Date.now()) {
  const [expires, sig, extra] = token.split(".");
  if (!expires || !sig || extra || !/^\d+$/.test(expires)) return false;
  const remaining = Number(expires) - Math.floor(now / 1000);
  return remaining > 0 && remaining <= SESSION_SECONDS && equalSecret(sig, signature(expires));
}

export function requireSession(request: Request) {
  config();
  const token = request.headers.get("cookie")?.split(";").map(c => c.trim()).find(c => c.startsWith(`${SESSION_COOKIE}=`))?.slice(SESSION_COOKIE.length + 1) ?? "";
  if (!validSession(token)) throw new HttpError("Nhập mã để mở khóa trên trình duyệt này.", 401);
}

export function requireOrigin(request: Request) {
  if (request.headers.get("origin") !== new URL(request.url).origin) {
    throw new HttpError("Nguồn yêu cầu không hợp lệ.", 403);
  }
}

export function privateJson(data: unknown, status = 200) {
  return Response.json(data, { status, headers: { "Cache-Control": "private, no-store, max-age=0", Vary: "Cookie" } });
}

export function errorResponse(error: unknown) {
  if (error instanceof HttpError) return privateJson({ error: error.message }, error.status);
  console.error("Cloud request failed", error instanceof Error ? error.message : "Unknown failure");
  return privateJson({ error: "Không lưu hoặc tải được dữ liệu. Kiểm tra kết nối và cấu hình máy chủ rồi thử lại." }, 503);
}

export async function readJson(request: Request, limit = 3_000_000): Promise<unknown> {
  if (!request.headers.get("content-type")?.includes("application/json")) throw new HttpError("Cần dữ liệu JSON.", 400);
  const reader = request.body?.getReader();
  if (!reader) throw new HttpError("Thiếu dữ liệu.", 400);
  const chunks: Uint8Array[] = [];
  let size = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    size += value.byteLength;
    if (size > limit) { await reader.cancel(); throw new HttpError("Dữ liệu quá lớn (tối đa 3 MB).", 413); }
    chunks.push(value);
  }
  try { return JSON.parse(Buffer.concat(chunks).toString("utf8")); }
  catch { throw new HttpError("Dữ liệu JSON không hợp lệ.", 400); }
}
