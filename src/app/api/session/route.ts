import { NextResponse } from "next/server";
import { createHash } from "node:crypto";
import { supabaseServer } from "@/lib/progress/server";
import { equalSecret, errorResponse, HttpError, issueSession, privateJson, readJson, requireOrigin, requireSession, SESSION_COOKIE, SESSION_SECONDS } from "@/lib/progress/session";

export async function GET(request: Request) {
  try { requireSession(request); return privateJson({ unlocked: true }); }
  catch (error) { return errorResponse(error); }
}

export async function POST(request: Request) {
  try {
    requireOrigin(request);
    const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "local";
    const bucket = createHash("sha256").update(ip).digest("hex");
    const { data: allowed, error } = await supabaseServer().rpc("allow_unlock_attempt", { p_bucket: bucket });
    if (error) throw new Error("Unlock limiter unavailable");
    if (!allowed) throw new HttpError("Đã thử quá nhiều lần. Hãy đợi 10 phút rồi thử lại.", 429);
    const body = await readJson(request, 4096) as { code?: unknown };
    if (!process.env.APP_ACCESS_CODE || !process.env.APP_SESSION_SECRET) throw new HttpError("Chưa cấu hình mã truy cập trên máy chủ.", 503);
    if (!body || typeof body.code !== "string" || !equalSecret(body.code, process.env.APP_ACCESS_CODE)) throw new HttpError("Mã truy cập không đúng.", 401);
    const response = NextResponse.json({ unlocked: true }, { headers: { "Cache-Control": "private, no-store", Vary: "Cookie" } });
    response.cookies.set(SESSION_COOKIE, issueSession(), { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "strict", path: "/", maxAge: SESSION_SECONDS });
    return response;
  } catch (error) { return errorResponse(error); }
}
