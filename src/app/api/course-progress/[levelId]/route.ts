import { z } from "zod";
import { COURSE_LEVELS } from "@/data/courses";
import {
  emptyCourseSnapshot,
  parseCourseSnapshot,
} from "@/lib/courses/practice";
import { supabaseServer } from "@/lib/progress/server";
import {
  errorResponse,
  HttpError,
  privateJson,
  readJson,
  requireOrigin,
  requireSession,
} from "@/lib/progress/session";

type Context = { params: Promise<{ levelId: string }> };
async function level(context: Context) {
  const { levelId } = await context.params;
  if (!COURSE_LEVELS.some((c) => c.id === levelId))
    throw new HttpError("Chưa có cấp độ này.", 404);
  return levelId;
}
export async function GET(request: Request, context: Context) {
  try {
    requireSession(request);
    const levelId = await level(context);
    const { data, error } = await supabaseServer()
      .from("course_progress")
      .select("snapshot, revision")
      .eq("level_id", levelId)
      .maybeSingle();
    if (error)
      throw new Error("Cannot load course_progress; verify course migration");
    return privateJson({
      snapshot: data
        ? parseCourseSnapshot(data.snapshot)
        : emptyCourseSnapshot(),
      revision: data?.revision ?? 0,
    });
  } catch (e) {
    return errorResponse(e);
  }
}
const mutation = z.object({
  revision: z.number().int().nonnegative(),
  mutationId: z.uuid(),
  snapshot: z.unknown(),
});
export async function PATCH(request: Request, context: Context) {
  try {
    requireSession(request);
    requireOrigin(request);
    const levelId = await level(context);
    const parsed = mutation.safeParse(await readJson(request));
    if (!parsed.success) throw new HttpError("Yêu cầu lưu không hợp lệ.", 400);
    const validated = (() => {
      try {
        return parseCourseSnapshot(parsed.data.snapshot);
      } catch {
        throw new HttpError("Dữ liệu ôn theo cấp độ không hợp lệ.", 400);
      }
    })();
    const belongs = (id: string) => id.startsWith(`${levelId}-`);
    if (
      Object.keys(validated.questions).some((id) => !belongs(id)) ||
      validated.session?.questionIds.some((id) => !belongs(id))
    )
      throw new HttpError("Câu hỏi không thuộc cấp độ này.", 400);
    const { data, error } = await supabaseServer().rpc("save_course_progress", {
      p_level_id: levelId,
      p_revision: parsed.data.revision,
      p_mutation_id: parsed.data.mutationId,
      p_snapshot: validated,
    });
    if (error) throw new Error("Cannot save course_progress");
    if (data.conflict)
      throw new HttpError(
        "Có tiến độ mới trên thiết bị khác. Tải bản khôi phục trước khi tải lại.",
        409,
      );
    return privateJson({ revision: data.revision });
  } catch (e) {
    return errorResponse(e);
  }
}
