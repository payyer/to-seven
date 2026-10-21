import "server-only";

import Anthropic from "@anthropic-ai/sdk";
import { betaZodOutputFormat } from "@anthropic-ai/sdk/helpers/beta/zod";
import type * as z from "zod/v4";

const MODEL = process.env.ANTHROPIC_MODEL || "claude-opus-5-5";
/** Mặc định "low": chữa bài ngắn không cần suy luận sâu. Tăng lên nếu thấy AI bỏ sót lỗi. */
const EFFORT = (process.env.ANTHROPIC_EFFORT || "low") as "low" | "medium" | "high";

export class AiError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
  }
}

let client: Anthropic | null = null;

/**
 * Gọi Claude với output bị ràng buộc theo schema Zod và trả về object đã parse.
 * Lỗi được chuyển thành AiError có thông báo tiếng Việt để hiện cho người dùng.
 */
export async function callStructured<S extends z.ZodType>(options: {
  schema: S;
  system: string;
  user: string;
  maxTokens: number;
}): Promise<z.infer<S>> {
  if (!process.env.ANTHROPIC_API_KEY) {
    throw new AiError("Server chưa cấu hình ANTHROPIC_API_KEY.", 503);
  }
  client ??= new Anthropic();

  let response;
  try {
    response = await client.beta.messages.parse({
      model: MODEL,
      max_tokens: options.maxTokens,
      output_config: { effort: EFFORT, format: betaZodOutputFormat(options.schema) },
      // Nếu model từ chối vì bộ lọc an toàn, server tự chạy lại trên model dự phòng.
      betas: ["server-side-fallback-2026-07-01"],
      fallbacks: "default",
      system: [{ type: "text", text: options.system, cache_control: { type: "ephemeral" } }],
      messages: [{ role: "user", content: options.user }],
    });
  } catch (err) {
    if (err instanceof Anthropic.AuthenticationError) throw new AiError("API key không hợp lệ.", 500);
    if (err instanceof Anthropic.RateLimitError) throw new AiError("AI đang quá tải, thử lại sau ít phút.", 429);
    if (err instanceof Anthropic.APIError) throw new AiError(`Lỗi từ Claude API (${err.status ?? "mạng"}).`, 502);
    throw err;
  }

  if (response.stop_reason === "refusal") {
    throw new AiError("AI từ chối chấm nội dung này. Hãy thử viết lại.", 422);
  }
  if (response.stop_reason === "max_tokens") {
    throw new AiError("Bài quá dài để chấm trong một lần, hãy rút gọn rồi thử lại.", 422);
  }
  if (!response.parsed_output) throw new AiError("AI trả về kết quả không đọc được, thử lại nhé.", 502);
  return response.parsed_output;
}

/** Đặt dữ liệu người học trong thẻ XML, bỏ ký tự có thể đóng thẻ sớm. */
export function tag(name: string, value: string): string {
  return `<${name}>${value.replace(/<\/?[a-z_]+>/gi, "")}</${name}>`;
}
