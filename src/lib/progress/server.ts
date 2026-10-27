import "server-only";
import { createClient } from "@supabase/supabase-js";
import { HttpError } from "./session";

export function supabaseServer() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SECRET_KEY;
  if (!url || !key) throw new HttpError("Chưa cấu hình kết nối Supabase trên máy chủ.", 503);
  if (process.env.VERCEL_ENV === "preview" && process.env.ALLOW_PREVIEW_DATABASE !== "1") {
    throw new HttpError("Bản xem trước chưa được cấu hình cơ sở dữ liệu riêng.", 503);
  }
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false } });
}
