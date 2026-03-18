"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function createClass(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const { data: studioUser } = await supabase
    .from("studio_users")
    .select("studio_id")
    .eq("auth_id", user.id)
    .single();
  if (!studioUser) throw new Error("Not a studio user");

  const { error } = await supabase.from("classes").insert({
    studio_id: studioUser.studio_id,
    name: formData.get("name"),
    day_of_week: Number(formData.get("day_of_week")),
    start_time: formData.get("start_time"),
    end_time: formData.get("end_time"),
    capacity: Number(formData.get("capacity")),
    monthly_fee: Number(formData.get("monthly_fee")),
    color: formData.get("color") ?? "indigo",
  });

  if (error) throw new Error(error.message);
  revalidatePath("/classes");
}

export async function updateClass(classId: string, formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const { error } = await supabase
    .from("classes")
    .update({
      name: formData.get("name"),
      day_of_week: Number(formData.get("day_of_week")),
      start_time: formData.get("start_time"),
      end_time: formData.get("end_time"),
      capacity: Number(formData.get("capacity")),
      monthly_fee: Number(formData.get("monthly_fee")),
    })
    .eq("id", classId);

  if (error) throw new Error(error.message);
  revalidatePath("/classes");
}

export async function deleteClass(classId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const { error } = await supabase.from("classes").delete().eq("id", classId);
  if (error) throw new Error(error.message);
  revalidatePath("/classes");
}
