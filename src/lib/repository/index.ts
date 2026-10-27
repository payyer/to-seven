import { SupabaseStudyRepository } from "./cloud";
export type { StudyRepository } from "./types";
const instance = new SupabaseStudyRepository();
export function getRepository() { return instance; }
