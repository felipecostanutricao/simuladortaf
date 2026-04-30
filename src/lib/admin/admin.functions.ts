import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

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
    const { assertAdmin, setUserPassword } = await import("./admin.server");
    await assertAdmin(context.userId);
    return setUserPassword(data.targetUserId, data.newPassword);
  });
