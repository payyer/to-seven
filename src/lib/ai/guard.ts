import "server-only";

import { AiError } from "./client";

const WINDOW_MS = 60_000;
const MAX_PER_WINDOW = 15;
const hits = new Map<string, number[]>();

export function jsonError(message: string, status: number): Response {
  return Response.json({ error: message }, { status });
}

/**
 * Kiểm tra chung cho mọi route AI: mã truy cập (nếu đặt APP_ACCESS_CODE),
 * giới hạn tần suất theo IP, và đọc body JSON. Ném AiError nếu không hợp lệ.
 * Giới hạn tần suất chỉ có hiệu lực trong một instance — đủ chặn bấm liên tục, không thay cho auth thật.
 */
export async function guardRequest(request: Request): Promise<Record<string, unknown>> {
  const accessCode = process.env.APP_ACCESS_CODE;
  if (accessCode && request.headers.get("x-access-code") !== accessCode) {
    throw new AiError("Sai hoặc thiếu mã truy cập. Nhập mã trong Cài đặt.", 401);
  }

  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "local";
  const now = Date.now();
  const recent = (hits.get(ip) ?? []).filter((t) => now - t < WINDOW_MS);
  recent.push(now);
  hits.set(ip, recent);
  if (recent.length > MAX_PER_WINDOW) throw new AiError("Bạn gửi hơi nhanh, đợi một phút rồi thử lại nhé.", 429);

  try {
    const body: unknown = await request.json();
    if (body && typeof body === "object") return body as Record<string, unknown>;
  } catch {
    // rơi xuống lỗi bên dưới
  }
  throw new AiError("Dữ liệu gửi lên không hợp lệ.", 400);
}

/** Lấy chuỗi bắt buộc từ body, cắt khoảng trắng, kiểm tra độ dài. */
export function requireString(body: Record<string, unknown>, key: string, label: string, min: number, max: number): string {
  const value = body[key];
  if (typeof value !== "string" || !value.trim()) throw new AiError(`Thiếu ${label}.`, 400);
  const text = value.trim();
  if (text.length < min) throw new AiError(`${label[0].toUpperCase()}${label.slice(1)} quá ngắn.`, 400);
  if (text.length > max) throw new AiError(`${label[0].toUpperCase()}${label.slice(1)} quá dài (tối đa ${max} ký tự).`, 400);
  return text;
}

export function optionalString(body: Record<string, unknown>, key: string, max: number): string {
  const value = body[key];
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

/** Bọc handler: chuyển AiError thành response JSON, lỗi lạ thành 500. */
export function aiRoute(handler: (body: Record<string, unknown>) => Promise<unknown>) {
  return async (request: Request): Promise<Response> => {
    try {
      const body = await guardRequest(request);
      return Response.json(await handler(body));
    } catch (err) {
      if (err instanceof AiError) return jsonError(err.message, err.status);
      console.error("AI route failed", err);
      return jsonError("Có lỗi không mong muốn, thử lại nhé.", 500);
    }
  };
}

export const isMockMode = () => process.env.AI_MOCK === "1";
