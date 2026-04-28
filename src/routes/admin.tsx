import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import { Shield, LogOut, Users } from "lucide-react";

export const Route = createFileRoute("/admin")({
  component: AdminPage,
  head: () => ({
    meta: [
      { title: "Comando — Painel Admin Central T.A.F" },
      { name: "description", content: "Painel administrativo de operadores." },
    ],
  }),
});

const ADMIN_EMAIL = "felipecostanutricao@gmail.com";
type Role = "admin" | "operador" | "recruta";

interface Operator {
  id: string;
  email: string | null;
  full_name: string | null;
  is_active: boolean;
  created_at: string;
  role: Role;
}

function AdminPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [operators, setOperators] = useState<Operator[]>([]);

  useEffect(() => {
    (async () => {
      const { data: sess } = await supabase.auth.getSession();
      const email = sess.session?.user.email?.toLowerCase();
      if (!sess.session || email !== ADMIN_EMAIL) {
        navigate({ to: "/auth" });
        return;
      }
      await loadOperators();
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadOperators = async () => {
    setLoading(true);
    const [profilesRes, rolesRes] = await Promise.all([
      supabase
        .from("profiles")
        .select("id, email, full_name, is_active, created_at")
        .order("created_at", { ascending: false }),
      supabase.from("user_roles").select("user_id, role"),
    ]);

    if (profilesRes.error) {
      toast.error("Falha ao carregar operadores", { description: profilesRes.error.message });
      setLoading(false);
      return;
    }

    const roleMap = new Map<string, Role>();
    (rolesRes.data ?? []).forEach((r) => roleMap.set(r.user_id, r.role as Role));

    setOperators(
      (profilesRes.data ?? []).map((p) => ({
        id: p.id,
        email: p.email,
        full_name: p.full_name,
        is_active: p.is_active,
        created_at: p.created_at,
        role: roleMap.get(p.id) ?? "recruta",
      }))
    );
    setLoading(false);
  };

  const toggleActive = async (op: Operator) => {
    const next = !op.is_active;
    setOperators((prev) => prev.map((o) => (o.id === op.id ? { ...o, is_active: next } : o)));
    const { error } = await supabase
      .from("profiles")
      .update({ is_active: next })
      .eq("id", op.id);
    if (error) {
      toast.error("Falha ao atualizar status", { description: error.message });
      setOperators((prev) => prev.map((o) => (o.id === op.id ? { ...o, is_active: !next } : o)));
    } else {
      toast.success(next ? "Operador ativado" : "Operador desativado");
    }
  };

  const changeRole = async (op: Operator, role: Role) => {
    const prevRole = op.role;
    setOperators((prev) => prev.map((o) => (o.id === op.id ? { ...o, role } : o)));
    // Apaga roles antigas e insere a nova (1 role por usuário neste app)
    const { error: delErr } = await supabase
      .from("user_roles")
      .delete()
      .eq("user_id", op.id);
    if (delErr) {
      toast.error("Falha ao alterar função", { description: delErr.message });
      setOperators((prev) => prev.map((o) => (o.id === op.id ? { ...o, role: prevRole } : o)));
      return;
    }
    const { error: insErr } = await supabase
      .from("user_roles")
      .insert({ user_id: op.id, role });
    if (insErr) {
      toast.error("Falha ao definir nova função", { description: insErr.message });
      setOperators((prev) => prev.map((o) => (o.id === op.id ? { ...o, role: prevRole } : o)));
    } else {
      toast.success(`Função atualizada para ${role}`);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate({ to: "/auth" });
  };

  return (
    <div className="min-h-screen text-foreground">
      <header className="border-b border-border bg-card/40">
        <div className="container mx-auto max-w-6xl px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-md panel panel-neon flex items-center justify-center">
              <Shield className="h-5 w-5 text-neon" strokeWidth={2.5} />
            </div>
            <div>
              <p className="text-[10px] font-mono-tac text-muted-foreground uppercase tracking-widest">
                Painel de Comando
              </p>
              <h1 className="text-base font-bold font-mono-tac uppercase tracking-widest text-glow text-neon">
                Admin Central T.A.F
              </h1>
            </div>
          </div>
          <Button
            variant="outline"
            onClick={handleLogout}
            className="font-mono-tac uppercase text-xs tracking-widest"
          >
            <LogOut className="h-4 w-4 mr-1.5" />
            Sair
          </Button>
        </div>
      </header>

      <main className="container mx-auto max-w-6xl px-4 py-6 space-y-6">
        <div className="panel p-4 flex items-center gap-3">
          <Users className="h-5 w-5 text-neon" />
          <div>
            <div className="text-[10px] font-mono-tac uppercase tracking-widest text-muted-foreground">
              Operadores cadastrados
            </div>
            <div className="text-2xl font-mono-tac font-bold text-neon text-glow tabular-nums">
              {operators.length}
            </div>
          </div>
        </div>

        <div className="panel p-0 overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="border-border">
                <TableHead className="font-mono-tac uppercase text-[10px] tracking-widest">Operador</TableHead>
                <TableHead className="font-mono-tac uppercase text-[10px] tracking-widest">Email</TableHead>
                <TableHead className="font-mono-tac uppercase text-[10px] tracking-widest">Função</TableHead>
                <TableHead className="font-mono-tac uppercase text-[10px] tracking-widest">Ativo</TableHead>
                <TableHead className="font-mono-tac uppercase text-[10px] tracking-widest">Cadastro</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-muted-foreground font-mono-tac uppercase text-xs tracking-widest">
                    Carregando operadores...
                  </TableCell>
                </TableRow>
              ) : operators.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-muted-foreground font-mono-tac uppercase text-xs tracking-widest">
                    Nenhum operador encontrado
                  </TableCell>
                </TableRow>
              ) : (
                operators.map((op) => (
                  <TableRow key={op.id} className="border-border">
                    <TableCell className="font-medium">{op.full_name ?? "—"}</TableCell>
                    <TableCell className="text-muted-foreground text-sm">{op.email ?? "—"}</TableCell>
                    <TableCell>
                      <Select
                        value={op.role}
                        onValueChange={(v) => changeRole(op, v as Role)}
                      >
                        <SelectTrigger className="w-36 h-9 font-mono-tac uppercase text-xs tracking-widest">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="admin">Admin</SelectItem>
                          <SelectItem value="operador">Operador</SelectItem>
                          <SelectItem value="recruta">Recruta</SelectItem>
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={op.is_active}
                          onCheckedChange={() => toggleActive(op)}
                        />
                        <span className="text-xs font-mono-tac uppercase tracking-widest text-muted-foreground">
                          {op.is_active ? "Ativo" : "Bloqueado"}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-xs font-mono-tac text-muted-foreground tabular-nums">
                      {new Date(op.created_at).toLocaleDateString("pt-BR")}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </main>
    </div>
  );
}
