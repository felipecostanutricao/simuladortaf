import React from "react";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { toast } from "sonner";
import {
  Shield, LogOut, Users, KeyRound, Copy, AlertTriangle, Activity,
  UserPlus, Save, Loader2, Settings2, Star, Swords, Trophy,
  Target, Radar,
} from "lucide-react";
import { adminSetPassword, adminCreateUser } from "@/lib/admin/admin.functions";
import { OperatorBioDetail } from "@/components/taf/OperatorBioDetail";
import { OperatorTafDetail } from "@/components/taf/OperatorTafDetail";
import { OperatorRadarDetail } from "@/components/taf/OperatorRadarDetail";
import { getRankInfo } from "@/components/taf/RankingTab";
import { playHover } from "@/lib/audio/audioService";

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
  total_xp: number;
}

interface SystemSettings {
  weight_cooldown_days: number;
  xp_simulado: number;
  xp_simulado_perfect: number;
  xp_bio_update: number;
  xp_daily_report: number;
  rank_operador_min: number;
  rank_elite_min: number;
  rank_fe_min: number;
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

const SETTINGS_FIELDS: { key: keyof SystemSettings; label: string; description: string; icon: React.ReactNode; group: string }[] = [
  { key: "weight_cooldown_days", label: "Trava Aba Bio (dias)", description: "Intervalo mínimo entre atualizações de peso", icon: <Settings2 className="w-4 h-4" />, group: "geral" },
  { key: "xp_simulado", label: "XP por Simulado", description: "Pontos ganhos ao completar um simulado", icon: <Star className="w-4 h-4" />, group: "xp" },
  { key: "xp_simulado_perfect", label: "XP Simulado Perfeito", description: "Bônus por atingir 100%", icon: <Star className="w-4 h-4" />, group: "xp" },
  { key: "xp_bio_update", label: "XP Atualização Bio", description: "Pontos por atualizar dados biométricos", icon: <Star className="w-4 h-4" />, group: "xp" },
  { key: "xp_daily_report", label: "XP Reporte Diário", description: "Pontos por reporte de prontidão", icon: <Star className="w-4 h-4" />, group: "xp" },
  { key: "rank_operador_min", label: "Corte Operador", description: "XP mínimo para Operador", icon: <Swords className="w-4 h-4" />, group: "rank" },
  { key: "rank_elite_min", label: "Corte Elite", description: "XP mínimo para Elite", icon: <Trophy className="w-4 h-4" />, group: "rank" },
  { key: "rank_fe_min", label: "Corte Forças Especiais", description: "XP mínimo para F.E.", icon: <Trophy className="w-4 h-4" />, group: "rank" },
];

const SETTINGS_GROUPS = [
  { id: "geral", title: "⚙️ Configurações Gerais", desc: "Parâmetros operacionais" },
  { id: "xp", title: "⭐ Sistema de XP", desc: "Pontos de experiência por ação" },
  { id: "rank", title: "🏆 Faixas de Rank", desc: "XP mínimo para cada patente" },
];

function AdminPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [operators, setOperators] = useState<Operator[]>([]);
  const [pwDialog, setPwDialog] = useState<{ op: Operator; password: string } | null>(null);
  const [pwSaving, setPwSaving] = useState(false);
  const [detailOpId, setDetailOpId] = useState<string | null>(null);
  const [tafDetailOpId, setTafDetailOpId] = useState<string | null>(null);
  const [radarDetailOpId, setRadarDetailOpId] = useState<string | null>(null);

  // Recruit modal
  const [recruitOpen, setRecruitOpen] = useState(false);
  const [recruitEmail, setRecruitEmail] = useState("");
  const [recruitPassword, setRecruitPassword] = useState(() => generatePassword());
  const [recruitExpiry, setRecruitExpiry] = useState("");
  const [recruitSaving, setRecruitSaving] = useState(false);

  // System settings
  const [settings, setSettings] = useState<SystemSettings>({
    weight_cooldown_days: 7, xp_simulado: 10, xp_simulado_perfect: 25,
    xp_bio_update: 5, xp_daily_report: 3,
    rank_operador_min: 100, rank_elite_min: 500, rank_fe_min: 1000,
  });
  const [settingsLoading, setSettingsLoading] = useState(true);
  const [settingsSaving, setSettingsSaving] = useState(false);

  useEffect(() => {
    (async () => {
      const { data: sess } = await supabase.auth.getSession();
      const email = sess.session?.user.email?.toLowerCase();
      if (!sess.session || email !== ADMIN_EMAIL) {
        navigate({ to: "/auth" });
        return;
      }
      await Promise.all([loadOperators(), loadSettings()]);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadSettings = async () => {
    setSettingsLoading(true);
    const { data, error } = await supabase
      .from("system_settings")
      .select("*")
      .eq("id", 1)
      .single();
    if (!error && data) {
      setSettings({
        weight_cooldown_days: data.weight_cooldown_days,
        xp_simulado: data.xp_simulado,
        xp_simulado_perfect: data.xp_simulado_perfect,
        xp_bio_update: data.xp_bio_update,
        xp_daily_report: data.xp_daily_report,
        rank_operador_min: data.rank_operador_min,
        rank_elite_min: data.rank_elite_min,
        rank_fe_min: data.rank_fe_min,
      });
    }
    setSettingsLoading(false);
  };

  const loadOperators = async () => {
    setLoading(true);
    const [profilesRes, rolesRes, xpRes] = await Promise.all([
      supabase
        .from("profiles")
        .select("id, email, full_name, is_active, created_at, hiring_date, expiry_date")
        .order("created_at", { ascending: false }),
      supabase.from("user_roles").select("user_id, role"),
      supabase.from("tactical_xp").select("user_id, xp_amount"),
    ]);

    if (profilesRes.error) {
      toast.error("Falha ao carregar operadores", { description: profilesRes.error.message });
      setLoading(false);
      return;
    }

    const roleMap = new Map<string, Role>();
    (rolesRes.data ?? []).forEach((r) => roleMap.set(r.user_id, r.role as Role));

    const xpMap = new Map<string, number>();
    (xpRes.data ?? []).forEach((r) => xpMap.set(r.user_id, (xpMap.get(r.user_id) || 0) + r.xp_amount));

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
        total_xp: xpMap.get(p.id) ?? 0,
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
    const { error } = await supabase.from("profiles").update(patch).eq("id", op.id);
    if (error) {
      toast.error("Falha ao atualizar data", { description: error.message });
      await loadOperators();
    } else {
      toast.success("Data atualizada");
    }
  };

  const openPwDialog = (op: Operator) => setPwDialog({ op, password: generatePassword() });

  const savePassword = async () => {
    if (!pwDialog) return;
    if (pwDialog.password.length < 8) {
      toast.error("Senha curta", { description: "Mínimo 8 caracteres." });
      return;
    }
    setPwSaving(true);
    try {
      await adminSetPassword({ data: { targetUserId: pwDialog.op.id, newPassword: pwDialog.password } });
      toast.success("Senha definida com sucesso");
    } catch (err) {
      toast.error("Falha ao definir senha", { description: err instanceof Error ? err.message : "Erro" });
    }
    setPwSaving(false);
  };

  const copyKit = async () => {
    const text = `Operador, a sua credencial para a Central T.A.F. foi validada e o seu acesso está LIBERADO. Vigência: 30 dias. Diretriz: Utilize o e-mail e a senha que você mesmo cadastrou no momento do alistamento. Aceda em: ${APP_URL}`;
    try {
      await navigator.clipboard.writeText(text);
      toast.success("Kit de Acesso copiado");
    } catch {
      toast.error("Não foi possível copiar");
    }
  };

  const handleRecruit = async () => {
    if (!recruitEmail || recruitPassword.length < 8) {
      toast.error("Preencha email e senha (mín. 8 caracteres)");
      return;
    }
    setRecruitSaving(true);
    try {
      await adminCreateUser({
        data: {
          email: recruitEmail,
          password: recruitPassword,
          expiryDate: recruitExpiry || null,
        },
      });
      toast.success("Operador recrutado com sucesso!");
      setRecruitOpen(false);
      setRecruitEmail("");
      setRecruitPassword(generatePassword());
      setRecruitExpiry("");
      await loadOperators();
    } catch (err) {
      toast.error("Falha ao recrutar", { description: err instanceof Error ? err.message : "Erro" });
    }
    setRecruitSaving(false);
  };

  const handleSettingChange = (key: keyof SystemSettings, value: string) => {
    const num = parseInt(value, 10);
    if (!isNaN(num) && num >= 0) {
      setSettings((prev) => ({ ...prev, [key]: num }));
    }
  };

  const handleSaveSettings = async () => {
    setSettingsSaving(true);
    const { error } = await supabase
      .from("system_settings")
      .update({ ...settings, updated_at: new Date().toISOString() } as any)
      .eq("id", 1);
    if (error) {
      toast.error("Erro ao salvar configurações.");
    } else {
      toast.success("Configurações salvas.");
    }
    setSettingsSaving(false);
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
          <Button variant="outline" onClick={handleLogout} className="font-mono-tac uppercase text-xs tracking-widest">
            <LogOut className="h-4 w-4 mr-1.5" />
            Sair
          </Button>
        </div>
      </header>

      <main className="container mx-auto max-w-7xl px-4 py-6">
        <Tabs defaultValue="tropa" className="space-y-6">
          <TabsList className="bg-card border border-border">
            <TabsTrigger value="tropa" className="font-mono-tac uppercase text-xs tracking-widest data-[state=active]:bg-neon/20 data-[state=active]:text-neon">
              <Users className="h-4 w-4 mr-1.5" />
              Gestão de Tropa
            </TabsTrigger>
            <TabsTrigger value="regras" className="font-mono-tac uppercase text-xs tracking-widest data-[state=active]:bg-neon/20 data-[state=active]:text-neon">
              <Settings2 className="h-4 w-4 mr-1.5" />
              Regras do Sistema
            </TabsTrigger>
          </TabsList>

          {/* ============ ABA GESTÃO DE TROPA ============ */}
          <TabsContent value="tropa" className="space-y-4">
            <div className="flex items-center justify-between">
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
              <Button
                onClick={() => setRecruitOpen(true)}
                onMouseEnter={playHover}
                className="bg-green-700 hover:bg-green-600 text-black font-bold font-mono-tac uppercase text-xs tracking-widest"
              >
                <UserPlus className="h-4 w-4 mr-1.5" />
                Recrutar Operador
              </Button>
            </div>

            <div className="panel p-0 overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-border">
                    <TableHead className="font-mono-tac uppercase text-[10px] tracking-widest">Operador</TableHead>
                    <TableHead className="font-mono-tac uppercase text-[10px] tracking-widest">Email</TableHead>
                    <TableHead className="font-mono-tac uppercase text-[10px] tracking-widest">Patente</TableHead>
                    <TableHead className="font-mono-tac uppercase text-[10px] tracking-widest">XP</TableHead>
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
                      <TableCell colSpan={9} className="text-center py-8 text-muted-foreground font-mono-tac uppercase text-xs tracking-widest">
                        Carregando operadores...
                      </TableCell>
                    </TableRow>
                  ) : operators.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={9} className="text-center py-8 text-muted-foreground font-mono-tac uppercase text-xs tracking-widest">
                        Nenhum operador encontrado
                      </TableCell>
                    </TableRow>
                  ) : (
                    operators.map((op) => {
                      const expired = isExpired(op.expiry_date);
                      const rank = getRankInfo(op.total_xp, settings);
                      const RankIcon = rank.icon;
                      const hasExpanded = detailOpId === op.id || tafDetailOpId === op.id || radarDetailOpId === op.id;
                      return (
                        <React.Fragment key={op.id}>
                          <TableRow className="border-border">
                            <TableCell className="font-medium">{op.full_name ?? "—"}</TableCell>
                            <TableCell className="text-muted-foreground text-sm">{op.email ?? "—"}</TableCell>
                            <TableCell>
                              <div className="flex items-center gap-1.5">
                                <RankIcon className={`h-3.5 w-3.5 ${rank.color}`} />
                                <span className={`text-xs font-mono-tac uppercase tracking-wider ${rank.color}`}>
                                  {rank.label}
                                </span>
                              </div>
                            </TableCell>
                            <TableCell>
                              <span className="font-mono-tac text-sm font-bold text-neon tabular-nums">
                                {op.total_xp}
                              </span>
                            </TableCell>
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
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <Button
                                  size="sm" variant="outline"
                                  onClick={() => setDetailOpId(detailOpId === op.id ? null : op.id)}
                                  onMouseEnter={playHover}
                                  className="h-8 font-mono-tac uppercase text-[10px] tracking-widest"
                                >
                                  <Activity className="h-3 w-3" /> Bio
                                </Button>
                                <Button
                                  size="sm" variant="outline"
                                  onClick={() => setTafDetailOpId(tafDetailOpId === op.id ? null : op.id)}
                                  onMouseEnter={playHover}
                                  className="h-8 font-mono-tac uppercase text-[10px] tracking-widest"
                                >
                                  <Target className="h-3 w-3" /> TAF
                                </Button>
                                <Button
                                  size="sm" variant="outline"
                                  onClick={() => setRadarDetailOpId(radarDetailOpId === op.id ? null : op.id)}
                                  onMouseEnter={playHover}
                                  className="h-8 font-mono-tac uppercase text-[10px] tracking-widest"
                                >
                                  <Radar className="h-3 w-3" /> Radar
                                </Button>
                                <Button
                                  size="sm" variant="outline"
                                  onClick={() => openPwDialog(op)}
                                  className="h-8 font-mono-tac uppercase text-[10px] tracking-widest"
                                >
                                  <KeyRound className="h-3 w-3" /> Senha
                                </Button>
                                <Button
                                  size="sm" variant="outline"
                                  onClick={() => copyKit()}
                                  className="h-8 font-mono-tac uppercase text-[10px] tracking-widest"
                                >
                                  <Copy className="h-3 w-3" /> Kit
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                          {detailOpId === op.id && (
                            <TableRow className="border-border">
                              <TableCell colSpan={9} className="p-4">
                                <OperatorBioDetail userId={op.id} name={op.full_name ?? op.email ?? "Operador"} onClose={() => setDetailOpId(null)} />
                              </TableCell>
                            </TableRow>
                          )}
                          {tafDetailOpId === op.id && (
                            <TableRow className="border-border">
                              <TableCell colSpan={9} className="p-4">
                                <OperatorTafDetail userId={op.id} name={op.full_name ?? op.email ?? "Operador"} onClose={() => setTafDetailOpId(null)} />
                              </TableCell>
                            </TableRow>
                          )}
                          {radarDetailOpId === op.id && (
                            <TableRow className="border-border">
                              <TableCell colSpan={9} className="p-4">
                                <OperatorRadarDetail userId={op.id} name={op.full_name ?? op.email ?? "Operador"} onClose={() => setRadarDetailOpId(null)} />
                              </TableCell>
                            </TableRow>
                          )}
                        </React.Fragment>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </div>
          </TabsContent>

          {/* ============ ABA REGRAS DO SISTEMA ============ */}
          <TabsContent value="regras" className="space-y-6">
            {settingsLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-neon" />
              </div>
            ) : (
              <>
                {SETTINGS_GROUPS.map((group) => {
                  const fields = SETTINGS_FIELDS.filter((f) => f.group === group.id);
                  return (
                    <Card key={group.id} className="bg-card border-border">
                      <CardHeader className="pb-3">
                        <CardTitle className="text-neon text-base font-mono-tac uppercase tracking-widest">{group.title}</CardTitle>
                        <CardDescription className="text-muted-foreground text-xs">{group.desc}</CardDescription>
                      </CardHeader>
                      <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {fields.map((field) => (
                          <div key={field.key} className="space-y-1.5">
                            <Label className="text-xs flex items-center gap-1.5 font-mono-tac uppercase tracking-widest text-muted-foreground">
                              {field.icon}
                              {field.label}
                            </Label>
                            <Input
                              type="number"
                              min={0}
                              value={settings[field.key]}
                              onChange={(e) => handleSettingChange(field.key, e.target.value)}
                              className="h-9 font-mono-tac"
                            />
                            <p className="text-[10px] text-muted-foreground">{field.description}</p>
                          </div>
                        ))}
                      </CardContent>
                    </Card>
                  );
                })}
                <div className="flex justify-end">
                  <Button
                    onClick={handleSaveSettings}
                    disabled={settingsSaving}
                    onMouseEnter={playHover}
                    className="bg-neon text-primary-foreground hover:bg-neon/90 shadow-neon font-mono-tac uppercase text-xs tracking-widest px-8"
                  >
                    {settingsSaving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
                    Salvar Configurações
                  </Button>
                </div>
              </>
            )}
          </TabsContent>
        </Tabs>
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
                    type="button" variant="outline"
                    onClick={() => setPwDialog({ ...pwDialog, password: generatePassword() })}
                    className="font-mono-tac uppercase text-[10px] tracking-widest"
                  >
                    Gerar
                  </Button>
                </div>
                <p className="mt-1.5 text-[10px] font-mono-tac uppercase tracking-wider text-muted-foreground">
                  Mín. 8 caracteres.
                </p>
              </div>
              <DialogFooter className="gap-2">
                <Button
                  variant="outline"
                  onClick={copyKit}
                  className="font-mono-tac uppercase text-[10px] tracking-widest"
                >
                  <Copy className="h-3 w-3" /> Copiar Kit
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

      {/* === DIALOG RECRUTAR OPERADOR === */}
      <Dialog open={recruitOpen} onOpenChange={setRecruitOpen}>
        <DialogContent className="bg-card border-border">
          <DialogHeader>
            <DialogTitle className="font-mono-tac uppercase tracking-widest text-neon text-glow text-sm">
              <UserPlus className="h-4 w-4 inline mr-2" />
              Recrutar Operador
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label className="text-[10px] font-mono-tac uppercase tracking-widest text-muted-foreground">Email</Label>
              <Input
                type="email"
                value={recruitEmail}
                onChange={(e) => setRecruitEmail(e.target.value)}
                placeholder="operador@email.com"
                className="font-mono-tac mt-1"
              />
            </div>
            <div>
              <Label className="text-[10px] font-mono-tac uppercase tracking-widest text-muted-foreground">Senha Inicial</Label>
              <div className="flex gap-2 mt-1">
                <Input
                  value={recruitPassword}
                  onChange={(e) => setRecruitPassword(e.target.value)}
                  className="font-mono-tac"
                />
                <Button
                  type="button" variant="outline"
                  onClick={() => setRecruitPassword(generatePassword())}
                  className="font-mono-tac uppercase text-[10px] tracking-widest"
                >
                  Gerar
                </Button>
              </div>
            </div>
            <div>
              <Label className="text-[10px] font-mono-tac uppercase tracking-widest text-muted-foreground">
                Data de Vencimento do Plano
              </Label>
              <Input
                type="date"
                value={recruitExpiry}
                onChange={(e) => setRecruitExpiry(e.target.value)}
                className="font-mono-tac mt-1"
              />
            </div>
            <DialogFooter>
              <Button
                onClick={handleRecruit}
                disabled={recruitSaving}
                className="bg-green-700 hover:bg-green-600 text-black font-bold font-mono-tac uppercase text-xs tracking-widest"
              >
                {recruitSaving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <UserPlus className="w-4 h-4 mr-2" />}
                Recrutar
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
