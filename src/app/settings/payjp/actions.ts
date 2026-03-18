"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export async function savePayjpKeys(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const secretKey = (formData.get("secret_key") as string).trim();
  const publicKey = (formData.get("public_key") as string).trim();

  if (!secretKey.startsWith("sk_") || !publicKey.startsWith("pk_")) {
    throw new Error("Invalid PAY.JP key format");
  }

  const { data: studioUser } = await supabase
    .from("studio_users")
    .select("studio_id")
    .eq("auth_id", user.id)
    .single();

  if (!studioUser) throw new Error("Not a studio user");

  const { error } = await supabase
    .from("studios")
    .update({
      payjp_secret_key: secretKey,
      payjp_public_key: publicKey,
    })
    .eq("id", studioUser.studio_id);

  if (error) throw new Error(error.message);

  redirect("/settings/payjp?saved=1");
}
