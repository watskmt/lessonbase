"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import type { AttendanceStatus } from "@/types";

export async function upsertAttendance(
  lessonId: string,
  studentId: string,
  status: AttendanceStatus
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const { data: studioUser } = await supabase
    .from("studio_users")
    .select("id")
    .eq("auth_id", user.id)
    .single();

  const { error } = await supabase
    .from("attendance")
    .upsert(
      {
        lesson_id: lessonId,
        student_id: studentId,
        status,
        recorded_by: studioUser?.id ?? null,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "lesson_id,student_id" }
    );

  if (error) throw new Error(error.message);
  revalidatePath("/attendance");
}

export async function bulkUpsertAttendance(
  entries: { lessonId: string; studentId: string; status: AttendanceStatus }[]
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const { data: studioUser } = await supabase
    .from("studio_users")
    .select("id")
    .eq("auth_id", user.id)
    .single();

  const rows = entries.map(e => ({
    lesson_id: e.lessonId,
    student_id: e.studentId,
    status: e.status,
    recorded_by: studioUser?.id ?? null,
    updated_at: new Date().toISOString(),
  }));

  const { error } = await supabase
    .from("attendance")
    .upsert(rows, { onConflict: "lesson_id,student_id" });

  if (error) throw new Error(error.message);
  revalidatePath("/attendance");
}

export async function ensureLesson(classId: string, date: string) {
  const supabase = await createClient();

  // クラス情報を取得
  const { data: cls } = await supabase
    .from("classes")
    .select("start_time, end_time")
    .eq("id", classId)
    .single();

  if (!cls) throw new Error("Class not found");

  // lesson が存在しなければ作成
  const { data: lesson, error } = await supabase
    .from("lessons")
    .upsert(
      {
        class_id: classId,
        date,
        start_time: cls.start_time,
        end_time: cls.end_time,
      },
      { onConflict: "class_id,date" }
    )
    .select()
    .single();

  if (error) throw new Error(error.message);
  return lesson;
}
