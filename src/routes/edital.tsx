import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollText, Target } from "lucide-react";
import { toast } from "sonner";
import { LABELS, UNIDADES, METAS_PADRAO, type Metas, type Modalidade } from "@/lib/taf-data";

export const Route = createFileRoute("/edital")({
  validateSearch: (search: Record<string, unknown>) => ({
    welcome: search.welcome === true || search.welcome === "true",
  }),
  component: EditalPage,
  head: () => ({
    meta: [{ title: "Configurar Edital — Central T.A.F" }],
  }),
});

function formatDateForPostgres(value: string): string | null {
  const trimmed = value.trim();
  if (!trimmed) return null;

  const iso = trimmed.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (iso) {
    const year = Number(iso[1]);
    const month = Number(iso[2]);
    const day = Number(iso[3]);
    const date = new Date(Date.UTC(year, month - 1, day));
    if (date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day) {
      return `${iso[1]}-${iso[2]}-${iso[3]}`;
    }
  }

  const br = trimmed.match(/^(\d{1,2})[\/-](\d{1,2})[\/-](\d{2}|\d{4})$/);
  if (br) {
    const day = Number(br[1]);
    const month = Number(br[2]);
    const year = Number(br[3].length === 2 ? `20${br[3]}` : br[3]);
    const date = new Date(Date.UTC(year, month - 1, day));
    if (date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day) {
      return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    }
  }

  throw new Error("Data do TAF inválida. Use o formato YYYY-MM-DD.");
}

function EditalPage() {
  const navigate = useNavigate();
  const { welcome } = Route.useSearch();
  const [metas, setMetas] = useState<Metas>(METAS_PADRAO);
  const [dataTaf, setDataTaf] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate({ to: "/auth" });
        return;
      }
      if (session.user.email?.toLowerCase() === "felipecostanutricao@gmail.com") {
        navigate({ to: "/admin" });
        return;
      }
      const { data } = await supabase
        .from("taf_goals")
        .select("barra_meta, flexao_meta, corrida_meta, natacao_meta, data_taf")
        .eq("user_id", session.user.id)
        .maybeSingle();
      if (data) {
        setMetas({
          barra: data.barra_meta,
          flexao: data.flexao_meta,
          corrida: data.corrida_meta,
          natacao: data.natacao_meta,
        });
        if (data.data_taf) setDataTaf(data.data_taf);
      }
      setLoading(false);
    })();
  }, [navigate]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Sessão expirada");
      const userId = session.user.id;
      const formattedDataTaf = formatDateForPostgres(dataTaf);

      const payload = {
        barra_meta: metas.barra,
        flexao_meta: metas.flexao,
        corrida_meta: metas.corrida,
        natacao_meta: metas.natacao,
        data_taf: formattedDataTaf,
      };

      const { data: existingGoal, error: selectError } = await supabase
        .from("taf_goals")
        .select("id")
        .eq("user_id", userId)
        .maybeSingle();

      if (selectError) throw selectError;

      if (existingGoal) {
        const { error: updateError } = await supabase
          .from("taf_goals")
          .update(payload)
          .eq("user_id", userId);

        if (updateError) throw updateError;
      } else {
        const { error: insertError } = await supabase
          .from("taf_goals")
          .insert({ ...payload, user_id: userId });

        if (insertError) throw insertError;
      }

      toast.success("Edital registrado", { description: "Metas e data do TAF aplicadas." });
      navigate({ to: "/" });
    } catch (err) {
      toast.error("Falha ao salvar", {
        description: err instanceof Error ? err.message : "Tente novamente",
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-muted-foreground font-mono-tac uppercase text-xs tracking-widest">
        Carregando briefing...
      </div>
    );
  }

  return (
    <div className="min-h-screen px-4 py-10">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <div className="h-12 w-12 rounded-md panel panel-neon flex items-center justify-center">
            <ScrollText className="h-6 w-6 text-neon" strokeWidth={2.5} />
          </div>
          <div>
            <p className="text-[10px] font-mono-tac text-muted-foreground uppercase tracking-widest">
              {welcome ? "Briefing Inicial" : "Atualizar Edital"}
            </p>
            <h1 className="text-xl font-bold font-mono-tac uppercase tracking-widest text-glow text-neon">
              Configurar Edital
            </h1>
          </div>
        </div>

        <p className="mb-6 text-xs font-mono-tac uppercase tracking-wider text-muted-foreground">
          Defina as metas mínimas de cada modalidade e a data da prova.
        </p>

        <form onSubmit={handleSave} className="space-y-5">
          <div className="panel p-4">
            <Label className="flex items-center gap-2 text-[11px] font-mono-tac uppercase tracking-widest text-muted-foreground">
              <Target className="h-4 w-4 text-neon" /> Data do TAF
            </Label>
            <Input
              type="date"
              value={dataTaf}
              onChange={(e) => setDataTaf(e.target.value)}
              className="mt-2 h-11 font-mono-tac bg-background/50 focus-visible:ring-neon focus-visible:border-neon"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {(Object.keys(LABELS) as Modalidade[]).map((k) => (
              <div key={k} className="panel p-3">
                <Label className="text-[11px] font-mono-tac uppercase tracking-widest text-muted-foreground">
                  {LABELS[k]}
                </Label>
                <Input
                  type="number"
                  min={0}
                  value={metas[k] || ""}
                  onChange={(e) => setMetas((m) => ({ ...m, [k]: Number(e.target.value) || 0 }))}
                  className="mt-2 h-11 text-lg font-mono-tac font-bold bg-background/60 focus-visible:ring-neon focus-visible:border-neon tabular-nums"
                />
                <p className="mt-1 text-[10px] font-mono-tac uppercase text-muted-foreground">
                  {UNIDADES[k]}
                </p>
              </div>
            ))}
          </div>

          <div className="flex gap-3">
            {!welcome && (
              <Button
                type="button"
                variant="ghost"
                onClick={() => navigate({ to: "/" })}
                className="font-mono-tac uppercase text-xs"
              >
                Cancelar
              </Button>
            )}
            <Button
              type="submit"
              disabled={saving}
              className="flex-1 h-12 font-mono-tac uppercase tracking-[0.2em] text-sm bg-neon text-primary-foreground hover:bg-neon/90 shadow-neon"
            >
              {saving ? "Salvando..." : "Aplicar Edital"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
