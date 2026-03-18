"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { generateInviteToken } from "@/lib/utils";

export async function createStudent(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const { data: studioUser } = await supabase
    .from("studio_users")
    .select("studio_id")
    .eq("auth_id", user.id)
    .single();
  if (!studioUser) throw new Error("Not a studio user");

  const name = formData.get("name") as string;
  const kana = formData.get("kana") as string;
  const birthDate = formData.get("birth_date") as string;
  const notes = formData.get("notes") as string;
  const guardianName = formData.get("guardian_name") as string;
  const guardianEmail = formData.get("guardian_email") as string;
  const guardianPhone = formData.get("guardian_phone") as string;
  const relationship = formData.get("relationship") as string;
  const classIds = formData.getAll("class_ids") as string[];

  // 1. 生徒を作成
  const { data: student, error: studentError } = await supabase
    .from("students")
    .insert({
      studio_id: studioUser.studio_id,
      name,
      kana,
      birth_date: birthDate || null,
      notes,
      status: "active",
    })
    .select()
    .single();

  if (studentError || !student) throw new Error(studentError?.message);

  // 2. 保護者を作成（招待トークン付き）
  const inviteToken = generateInviteToken();
  const { error: guardianError } = await supabase
    .from("guardians")
    .insert({
      student_id: student.id,
      name: guardianName,
      email: guardianEmail,
      phone: guardianPhone || null,
      relationship: relationship || "保護者",
      invite_token: inviteToken,
    });

  if (guardianError) throw new Error(guardianError.message);

  // 3. クラスに登録
  if (classIds.length > 0) {
    const enrollments = classIds.map(classId => ({
      class_id: classId,
      student_id: student.id,
    }));
    await supabase.from("class_enrollments").insert(enrollments);
  }

  // 4. 招待メールを送信
  await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/guardians/invite`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      guardianEmail,
      guardianName,
      studentName: name,
      inviteToken,
    }),
  });

  revalidatePath("/students");
  return { studentId: student.id };
}

export async function updateStudent(studentId: string, formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const { error } = await supabase
    .from("students")
    .update({
      name: formData.get("name"),
      kana: formData.get("kana"),
      birth_date: formData.get("birth_date") || null,
      notes: formData.get("notes"),
    })
    .eq("id", studentId);

  if (error) throw new Error(error.message);
  revalidatePath("/students");
}

export async function updateStudentStatus(
  studentId: string,
  status: "active" | "suspended" | "withdrawn"
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const { error } = await supabase
    .from("students")
    .update({ status })
    .eq("id", studentId);

  if (error) throw new Error(error.message);
  revalidatePath("/students");
}
