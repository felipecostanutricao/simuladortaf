import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import { Shield, LogOut, Users, KeyRound, Copy, AlertTriangle } from "lucide-react";
import { adminSetPassword } from "@/lib/admin/admin.functions";

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
const APP_URL = "simuladortaf.felipecostanutricao.workers.dev";
type Role = "admin" | "operador" | "recruta";

interface Operator {
  id: string;
  email: string | null;
  full_name: string | null;
  is_active: boolean;
  created_at: string;
  hiring_date: string | null;
  expiry_date: string | null;
  role: Role;
}

function toDateInput(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toISOString().slice(0, 10);
}

function fromDateInput(value: string): string | null {
  if (!value) return null;
  const d = new Date(value + "T12:00:00");
  return d.toISOString();
}

function isExpired(expiry: string | null): boolean {
  if (!expiry) return false;
  return new Date(expiry).getTime() < Date.now();
}

function generatePassword(): string {
  const chars = "ABCDEFGHJKMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789";
  let out = "";
  for (let i = 0; i < 10; i++) out += chars[Math.floor(Math.random() * chars.length)];
  return out + "!9";
}

function AdminPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [operators, setOperators] = useState<Operator[]>([]);
  const [pwDialog, setPwDialog] = useState<{ op: Operator; password: string } | null>(null);
  const [pwSaving, setPwSaving] = useState(false);

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
        .select("id, email, full_name, is_active, created_at, hiring_date, expiry_date")
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
        hiring_date: p.hiring_date,
        expiry_date: p.expiry_date,
        role: roleMap.get(p.id) ?? "recruta",
      }))
    );
    setLoading(false);
  };

  const toggleActive = async (op: Operator) => {
    const next = !op.is_active;
    setOperators((prev) => prev.map((o) => (o.id === op.id ? { ...o, is_active: next } : o)));
    const { data, error } = await supabase
      .from("profiles")
      .update({ is_active: next })
      .eq("id", op.id)
      .select("hiring_date, expiry_date")
      .single();
    if (error) {
      toast.error("Falha ao atualizar status", { description: error.message });
      setOperators((prev) => prev.map((o) => (o.id === op.id ? { ...o, is_active: !next } : o)));
    } else {
      setOperators((prev) =>
        prev.map((o) =>
          o.id === op.id
            ? { ...o, is_active: next, hiring_date: data?.hiring_date ?? null, expiry_date: data?.expiry_date ?? null }
            : o
        )
      );
      toast.success(next ? "Operador ativado — vigência de 30 dias" : "Operador desativado");
    }
  };

  const changeRole = async (op: Operator, role: Role) => {
    const prevRole = op.role;
    setOperators((prev) => prev.map((o) => (o.id === op.id ? { ...o, role } : o)));
    const { error: delErr } = await supabase.from("user_roles").delete().eq("user_id", op.id);
    if (delErr) {
      toast.error("Falha ao alterar função", { description: delErr.message });
      setOperators((prev) => prev.map((o) => (o.id === op.id ? { ...o, role: prevRole } : o)));
      return;
    }
    const { error: insErr } = await supabase.from("user_roles").insert({ user_id: op.id, role });
    if (insErr) {
      toast.error("Falha ao definir nova função", { description: insErr.message });
      setOperators((prev) => prev.map((o) => (o.id === op.id ? { ...o, role: prevRole } : o)));
    } else {
      toast.success(`Função atualizada para ${role}`);
    }
  };

  const updateDate = async (op: Operator, field: "hiring_date" | "expiry_date", value: string) => {
    const iso = fromDateInput(value);
    setOperators((prev) => prev.map((o) => (o.id === op.id ? { ...o, [field]: iso } : o)));
    const patch = field === "hiring_date" ? { hiring_date: iso } : { expiry_date: iso };
    const { error } = await supabase
      .from("profiles")
      .update(patch)
      .eq("id", op.id);
    if (error) {
      toast.error("Falha ao atualizar data", { description: error.message });
      await loadOperators();
    } else {
      toast.success("Data atualizada");
    }
  };

  const openPwDialog = (op: Operator) => {
    setPwDialog({ op, password: generatePassword() });
  };

  const savePassword = async () => {
    if (!pwDialog) return;
    if (pwDialog.password.length < 8) {
      toast.error("Senha curta", { description: "Mínimo 8 caracteres." });
      return;
    }
    setPwSaving(true);
    try {
      await adminSetPassword({
        data: { targetUserId: pwDialog.op.id, newPassword: pwDialog.password },
      });
      toast.success("Senha definida com sucesso");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Erro";
      toast.error("Falha ao definir senha", { description: msg });
      setPwSaving(false);
      return;
    }
    setPwSaving(false);
  };

  const copyKit = async (_op: Operator, _password?: string) => {
    const text = `Operador, a sua credencial para a Central T.A.F. foi validada e o seu acesso está LIBERADO. Vigência: 30 dias. Diretriz: Utilize o e-mail e a senha que você mesmo cadastrou no momento do alistamento. Aceda em: ${APP_URL}`;
    try {
      await navigator.clipboard.writeText(text);
      toast.success("Kit de Acesso copiado");
    } catch {
      toast.error("Não foi possível copiar");
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate({ to: "/auth" });
  };

  return (
    <div className="min-h-screen text-foreground">
      <header className="border-b border-border bg-card/40">
        <div className="container mx-auto max-w-7xl px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-md panel panel-neon flex items-center justify-center">
              <Shield className="h-5 w-5 text-neon" strokeWidth={2.5} />
            </div>
            <div>
              <p className="text-[10px] font-mono-tac text-muted-foreground uppercase tracking-widest">
                Painel de Comando
              </p>
              <h1 className="text-base font-bold font-mono-tac uppercase tracking-widest text-glow text-neon">
                Quartel General — Central T.A.F
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

      <main className="container mx-auto max-w-7xl px-4 py-6 space-y-6">
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

        <div className="panel p-0 overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="border-border">
                <TableHead className="font-mono-tac uppercase text-[10px] tracking-widest">Operador</TableHead>
                <TableHead className="font-mono-tac uppercase text-[10px] tracking-widest">Email</TableHead>
                <TableHead className="font-mono-tac uppercase text-[10px] tracking-widest">Função</TableHead>
                <TableHead className="font-mono-tac uppercase text-[10px] tracking-widest">Ativo</TableHead>
                <TableHead className="font-mono-tac uppercase text-[10px] tracking-widest">Início</TableHead>
                <TableHead className="font-mono-tac uppercase text-[10px] tracking-widest">Vencimento</TableHead>
                <TableHead className="font-mono-tac uppercase text-[10px] tracking-widest">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground font-mono-tac uppercase text-xs tracking-widest">
                    Carregando operadores...
                  </TableCell>
                </TableRow>
              ) : operators.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground font-mono-tac uppercase text-xs tracking-widest">
                    Nenhum operador encontrado
                  </TableCell>
                </TableRow>
              ) : (
                operators.map((op) => {
                  const expired = isExpired(op.expiry_date);
                  return (
                    <TableRow key={op.id} className="border-border">
                      <TableCell className="font-medium">{op.full_name ?? "—"}</TableCell>
                      <TableCell className="text-muted-foreground text-sm">{op.email ?? "—"}</TableCell>
                      <TableCell>
                        <Select value={op.role} onValueChange={(v) => changeRole(op, v as Role)}>
                          <SelectTrigger className="w-32 h-9 font-mono-tac uppercase text-xs tracking-widest">
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
                          <Switch checked={op.is_active} onCheckedChange={() => toggleActive(op)} />
                          <span className="text-xs font-mono-tac uppercase tracking-widest text-muted-foreground">
                            {op.is_active ? "Ativo" : "Bloq"}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Input
                          type="date"
                          value={toDateInput(op.hiring_date)}
                          onChange={(e) => updateDate(op, "hiring_date", e.target.value)}
                          className="h-9 w-36 font-mono-tac text-xs"
                        />
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1.5">
                          <Input
                            type="date"
                            value={toDateInput(op.expiry_date)}
                            onChange={(e) => updateDate(op, "expiry_date", e.target.value)}
                            className={`h-9 w-36 font-mono-tac text-xs ${expired ? "border-destructive text-destructive" : ""}`}
                          />
                          {expired && <AlertTriangle className="h-4 w-4 text-destructive flex-shrink-0" />}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1.5">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => openPwDialog(op)}
                            className="h-8 font-mono-tac uppercase text-[10px] tracking-widest"
                          >
                            <KeyRound className="h-3 w-3" />
                            Senha
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => copyKit(op)}
                            className="h-8 font-mono-tac uppercase text-[10px] tracking-widest"
                          >
                            <Copy className="h-3 w-3" />
                            Kit
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
      </main>

      {/* === DIALOG GESTÃO DE SENHA === */}
      <Dialog open={pwDialog !== null} onOpenChange={(o) => !o && setPwDialog(null)}>
        <DialogContent className="bg-card border-border">
          <DialogHeader>
            <DialogTitle className="font-mono-tac uppercase tracking-widest text-neon text-glow text-sm">
              Gestão de Senha — {pwDialog?.op.full_name ?? pwDialog?.op.email}
            </DialogTitle>
          </DialogHeader>
          {pwDialog && (
            <div className="space-y-4">
              <div>
                <Label className="text-[10px] font-mono-tac uppercase tracking-widest text-muted-foreground">
                  Senha Temporária
                </Label>
                <div className="flex gap-2 mt-1">
                  <Input
                    value={pwDialog.password}
                    onChange={(e) => setPwDialog({ ...pwDialog, password: e.target.value })}
                    className="font-mono-tac"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setPwDialog({ ...pwDialog, password: generatePassword() })}
                    className="font-mono-tac uppercase text-[10px] tracking-widest"
                  >
                    Gerar
                  </Button>
                </div>
                <p className="mt-1.5 text-[10px] font-mono-tac uppercase tracking-wider text-muted-foreground">
                  Mín. 8 caracteres. Operador deve trocar no primeiro acesso.
                </p>
              </div>
              <DialogFooter className="gap-2">
                <Button
                  variant="outline"
                  onClick={() => copyKit(pwDialog.op, pwDialog.password)}
                  className="font-mono-tac uppercase text-[10px] tracking-widest"
                >
                  <Copy className="h-3 w-3" />
                  Copiar Kit de Acesso
                </Button>
                <Button
                  onClick={savePassword}
                  disabled={pwSaving}
                  className="bg-neon text-primary-foreground hover:bg-neon/90 shadow-neon font-mono-tac uppercase text-[10px] tracking-widest"
                >
                  {pwSaving ? "Aplicando..." : "Aplicar Senha"}
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
