"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function createRescheduleRequest(
  attendanceId: string,
  studentId: string,
  targetLessonId: string | null,
  note?: string
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const { data: guardian } = await supabase
    .from("guardians")
    .select("id")
    .eq("auth_id", user.id)
    .single();
  if (!guardian) throw new Error("Not a guardian");

  const { error } = await supabase.from("reschedule_requests").insert({
    attendance_id: attendanceId,
    student_id: studentId,
    guardian_id: guardian.id,
    target_lesson_id: targetLessonId,
    note: note ?? null,
    status: "pending",
  });

  if (error) throw new Error(error.message);
  revalidatePath("/portal/attendance");
  revalidatePath("/attendance");
}

export async function respondToReschedule(
  requestId: string,
  status: "approved" | "rejected"
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const { error } = await supabase
    .from("reschedule_requests")
    .update({ status, responded_at: new Date().toISOString() })
    .eq("id", requestId);

  if (error) throw new Error(error.message);
  revalidatePath("/");
}
