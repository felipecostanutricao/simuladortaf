import { supabaseAdmin } from "@/integrations/supabase/client.server";

const ADMIN_EMAIL = "felipecostanutricao@gmail.com";

export async function assertAdmin(userId: string) {
  const { data, error } = await supabaseAdmin
    .from("user_roles")
    .select("role")
    .eq("user_id", userId)
    .eq("role", "admin")
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) {
    const { data: u } = await supabaseAdmin.auth.admin.getUserById(userId);
    if (u.user?.email?.toLowerCase() !== ADMIN_EMAIL) {
      throw new Error("Acesso negado: somente Comando.");
    }
  }
}

export async function setUserPassword(targetUserId: string, newPassword: string) {
  const { error } = await supabaseAdmin.auth.admin.updateUserById(targetUserId, {
    password: newPassword,
  });
  if (error) throw new Error(error.message);
  return { ok: true };
}
