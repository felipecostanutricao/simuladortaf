import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

const ADMIN_EMAIL = "felipecostanutricao@gmail.com";

async function assertAdmin(userId: string) {
  // Verifica via tabela user_roles (RLS-friendly) usando admin client
  const { data, error } = await supabaseAdmin
    .from("user_roles")
    .select("role")
    .eq("user_id", userId)
    .eq("role", "admin")
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) {
    // fallback por email
    const { data: u } = await supabaseAdmin.auth.admin.getUserById(userId);
    if (u.user?.email?.toLowerCase() !== ADMIN_EMAIL) {
      throw new Error("Acesso negado: somente Comando.");
    }
  }
}

export const adminSetPassword = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z
      .object({
        targetUserId: z.string().uuid(),
        newPassword: z.string().min(8).max(72),
      })
      .parse(input)
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context.userId);
    const { error } = await supabaseAdmin.auth.admin.updateUserById(
      data.targetUserId,
      { password: data.newPassword }
    );
    if (error) throw new Error(error.message);
    return { ok: true };
  });
