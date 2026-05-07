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

export async function createUser(email: string, password: string, expiryDate: string | null) {
  const { data, error } = await supabaseAdmin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });
  if (error) throw new Error(error.message);
  if (!data.user) throw new Error("Falha ao criar usuário");

  // The handle_new_user trigger creates profile/roles automatically.
  // Now activate and set expiry if provided.
  const profileUpdate: { is_active: boolean; hiring_date?: string; expiry_date?: string } = { is_active: true };
  if (expiryDate) {
    profileUpdate.hiring_date = new Date().toISOString();
    profileUpdate.expiry_date = new Date(expiryDate + "T23:59:59").toISOString();
  }
  await supabaseAdmin.from("profiles").update(profileUpdate).eq("id", data.user.id);

  return { userId: data.user.id };
}
