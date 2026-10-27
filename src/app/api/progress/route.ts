import { z } from "zod";
import { supabaseServer } from "@/lib/progress/server";
import { emptySnapshot, parseSnapshot } from "@/lib/progress/snapshot";
import { errorResponse, HttpError, privateJson, readJson, requireOrigin, requireSession } from "@/lib/progress/session";

export async function GET(request: Request) {
  try {
    requireSession(request);
    const { data, error } = await supabaseServer().from("study_progress").select("snapshot, revision").eq("id", 1).single();
    if (error) throw new Error("Cannot load study_progress; verify migration and environment");
    return privateJson({ snapshot: data.snapshot === null ? emptySnapshot() : parseSnapshot(data.snapshot), revision: data.revision, initialized: data.snapshot !== null });
  } catch (error) { return errorResponse(error); }
}

const mutation = z.object({ mutationId: z.uuid(), revision: z.number().int().nonnegative(), snapshot: z.unknown(), initializeOnly: z.boolean().default(false) });

export async function PATCH(request: Request) {
  try {
    requireSession(request);
    requireOrigin(request);
    const parsed = mutation.safeParse(await readJson(request));
    if (!parsed.success) throw new HttpError("Yêu cầu lưu không hợp lệ.", 400);
    let snapshot;
    try { snapshot = parseSnapshot(parsed.data.snapshot); }
    catch { throw new HttpError("Dữ liệu học không hợp lệ.", 400); }
    const { data, error } = await supabaseServer().rpc("save_study_progress", {
      p_revision: parsed.data.revision, p_mutation_id: parsed.data.mutationId,
      p_snapshot: snapshot, p_initialize_only: parsed.data.initializeOnly,
    });
    if (error) throw new Error("Cannot save study_progress");
    if (data.conflict) throw new HttpError("Tiến độ đã thay đổi trên thiết bị khác. Tải bản khôi phục trước khi tải lại dữ liệu đám mây.", 409);
    return privateJson({ revision: data.revision });
  } catch (error) { return errorResponse(error); }
}
