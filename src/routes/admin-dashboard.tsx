import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { toast } from "sonner";
import { Shield, Save, ArrowLeft, Loader2, Settings2, Swords, Star, Trophy } from "lucide-react";
import { Scanlines } from "@/components/taf/Scanlines";

export const Route = createFileRoute("/admin-dashboard")({
  component: AdminDashboardPage,
  head: () => ({
    meta: [
      { title: "Centro de Comando — Configurações do Sistema" },
      { name: "description", content: "Painel de configurações do sistema de gamificação." },
    ],
  }),
});

const ADMIN_EMAIL = "felipecostanutricao@gmail.com";

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

const FIELD_CONFIG: { key: keyof SystemSettings; label: string; description: string; icon: React.ReactNode; group: string }[] = [
  { key: "weight_cooldown_days", label: "Cooldown de Pesagem (dias)", description: "Intervalo mínimo entre atualizações de peso", icon: <Settings2 className="w-4 h-4" />, group: "geral" },
  { key: "xp_simulado", label: "XP por Simulado", description: "Pontos ganhos ao completar um simulado", icon: <Star className="w-4 h-4" />, group: "xp" },
  { key: "xp_simulado_perfect", label: "XP Simulado Perfeito", description: "Bônus por atingir 100% no simulado", icon: <Star className="w-4 h-4" />, group: "xp" },
  { key: "xp_bio_update", label: "XP Atualização Bio", description: "Pontos por atualizar dados biométricos", icon: <Star className="w-4 h-4" />, group: "xp" },
  { key: "xp_daily_report", label: "XP Relatório Diário", description: "Pontos por acessar o relatório diário", icon: <Star className="w-4 h-4" />, group: "xp" },
  { key: "rank_operador_min", label: "XP mín. Operador", description: "XP necessário para o rank Operador", icon: <Swords className="w-4 h-4" />, group: "rank" },
  { key: "rank_elite_min", label: "XP mín. Elite", description: "XP necessário para o rank Elite", icon: <Trophy className="w-4 h-4" />, group: "rank" },
  { key: "rank_fe_min", label: "XP mín. Forças Especiais", description: "XP necessário para o rank Forças Especiais", icon: <Trophy className="w-4 h-4" />, group: "rank" },
];

function AdminDashboardPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [authorized, setAuthorized] = useState(false);
  const [settings, setSettings] = useState<SystemSettings>({
    weight_cooldown_days: 7,
    xp_simulado: 10,
    xp_simulado_perfect: 25,
    xp_bio_update: 5,
    xp_daily_report: 3,
    rank_operador_min: 100,
    rank_elite_min: 500,
    rank_fe_min: 1000,
  });

  useEffect(() => {
    checkAuthAndLoad();
  }, []);

  async function checkAuthAndLoad() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user || user.email?.toLowerCase() !== ADMIN_EMAIL) {
      toast.error("Acesso negado: somente Comando.");
      navigate({ to: "/" });
      return;
    }
    setAuthorized(true);

    const { data, error } = await supabase
      .from("system_settings")
      .select("*")
      .eq("id", 1)
      .single();

    if (error) {
      toast.error("Erro ao carregar configurações.");
      console.error(error);
    } else if (data) {
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
    setLoading(false);
  }

  function handleChange(key: keyof SystemSettings, value: string) {
    const num = parseInt(value, 10);
    if (!isNaN(num) && num >= 0) {
      setSettings((prev) => ({ ...prev, [key]: num }));
    }
  }

  async function handleSave() {
    setSaving(true);
    const { error } = await supabase
      .from("system_settings")
      .update({
        ...settings,
        updated_at: new Date().toISOString(),
      } as any)
      .eq("id", 1);

    if (error) {
      toast.error("Erro ao salvar configurações.");
      console.error("Erro ao salvar system_settings:", error);
    } else {
      toast.success("Configurações salvas com sucesso.");
    }
    setSaving(false);
  }

  if (!authorized || loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-green-500" />
      </div>
    );
  }

  const groups = [
    { id: "geral", title: "⚙️ Configurações Gerais", desc: "Parâmetros operacionais do sistema" },
    { id: "xp", title: "⭐ Sistema de XP", desc: "Pontos de experiência por ação" },
    { id: "rank", title: "🏆 Faixas de Rank", desc: "XP mínimo para cada patente" },
  ];

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-green-100 relative overflow-hidden">
      <Scanlines />
      <div className="relative z-10 max-w-3xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate({ to: "/admin" })}
            className="text-green-400 hover:bg-green-900/30"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <Shield className="w-7 h-7 text-green-500" />
          <div>
            <h1 className="text-xl font-bold text-green-400 tracking-wider uppercase">
              Centro de Comando
            </h1>
            <p className="text-xs text-green-600">Configurações do Sistema de Gamificação</p>
          </div>
        </div>

        {/* Settings Groups */}
        <div className="space-y-6">
          {groups.map((group) => {
            const fields = FIELD_CONFIG.filter((f) => f.group === group.id);
            return (
              <Card key={group.id} className="bg-[#111] border-green-900/40">
                <CardHeader className="pb-3">
                  <CardTitle className="text-green-400 text-base">{group.title}</CardTitle>
                  <CardDescription className="text-green-700 text-xs">{group.desc}</CardDescription>
                </CardHeader>
                <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {fields.map((field) => (
                    <div key={field.key} className="space-y-1.5">
                      <Label className="text-green-300 text-xs flex items-center gap-1.5">
                        {field.icon}
                        {field.label}
                      </Label>
                      <Input
                        type="number"
                        min={0}
                        value={settings[field.key]}
                        onChange={(e) => handleChange(field.key, e.target.value)}
                        className="bg-[#0a0a0a] border-green-900/50 text-green-100 focus:border-green-500 h-9"
                      />
                      <p className="text-[10px] text-green-700">{field.description}</p>
                    </div>
                  ))}
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Save Button */}
        <div className="mt-8 flex justify-end">
          <Button
            onClick={handleSave}
            disabled={saving}
            className="bg-green-700 hover:bg-green-600 text-black font-bold px-8 tracking-wider uppercase"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
            Salvar Configurações
          </Button>
        </div>
      </div>
    </div>
  );
}
