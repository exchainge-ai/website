import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@exchainge/supabase/database";
import { getSupabaseAdmin } from "./supabase";
import { logger } from "../server/logger";

type UploadSessionRow = Database["public"]["Tables"]["upload_sessions"]["Row"];
type UploadSessionInsert =
  Database["public"]["Tables"]["upload_sessions"]["Insert"];
type UploadSessionUpdate =
  Database["public"]["Tables"]["upload_sessions"]["Update"];

function sanitizeUploadSession(
  session: UploadSessionRow | null,
): UploadSessionRow | null {
  if (!session) {
    return null;
  }

  return {
    ...session,
    metadata: session.metadata ?? {},
    error_message: session.error_message ?? null,
    r2_upload_id: session.r2_upload_id ?? null,
    r2_key: session.r2_key ?? null,
    file_hash: session.file_hash ?? null,
    chunks_total: session.chunks_total ?? null,
    chunks_uploaded: session.chunks_uploaded ?? 0,
    progress_percent: session.progress_percent ?? 0,
    presigned_url_expires_at: session.presigned_url_expires_at ?? null,
    completed_at: session.completed_at ?? null,
    last_activity_at: session.last_activity_at ?? session.started_at,
    updated_at: session.updated_at ?? session.started_at,
  };
}

export async function createUploadSession(
  payload: UploadSessionInsert,
  options?: { client?: SupabaseClient<Database> },
): Promise<UploadSessionRow | null> {
  const supabase = options?.client ?? getSupabaseAdmin();

  const { data, error } = await supabase
    .from("upload_sessions")
    .insert(payload as any)
    .select("*")
    .single();

  if (error) {
    logger.error("Failed to create upload session", {
      datasetId: payload.dataset_id,
      userId: payload.user_id,
      error,
    });
    return null;
  }

  return sanitizeUploadSession(data);
}

export async function updateUploadSession(
  sessionId: string,
  changes: UploadSessionUpdate,
  options?: { client?: SupabaseClient<Database> },
): Promise<UploadSessionRow | null> {
  const supabase = options?.client ?? getSupabaseAdmin();

  const { data, error } = await supabase
    .from("upload_sessions")
    .update({
      ...changes,
      updated_at: new Date().toISOString(),
      last_activity_at: new Date().toISOString(),
    } as any)
    .eq("id", sessionId)
    .select("*")
    .single();

  if (error) {
    logger.error("Failed to update upload session", {
      sessionId,
      error,
    });
    return null;
  }

  return sanitizeUploadSession(data);
}

export async function getUploadSession(
  sessionId: string,
  options?: { client?: SupabaseClient<Database> },
): Promise<UploadSessionRow | null> {
  const supabase = options?.client ?? getSupabaseAdmin();

  const { data, error } = await supabase
    .from("upload_sessions")
    .select("*")
    .eq("id", sessionId)
    .maybeSingle();

  if (error) {
    logger.error("Failed to fetch upload session", {
      sessionId,
      error,
    });
    return null;
  }

  return sanitizeUploadSession(data);
}
