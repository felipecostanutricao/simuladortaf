import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Trophy, Swords, Shield, Star } from "lucide-react";

interface RankEntry {
  user_id: string;
  nome_de_guerra: string;
  total_xp: number;
}

interface SystemRanks {
  rank_operador_min: number;
  rank_elite_min: number;
  rank_fe_min: number;
}

export function getRankInfo(totalXp: number, ranks: SystemRanks) {
  if (totalXp >= ranks.rank_fe_min)
    return { label: "Forças Especiais", color: "text-yellow-400", icon: Trophy };
  if (totalXp >= ranks.rank_elite_min)
    return { label: "Elite", color: "text-purple-400", icon: Shield };
  if (totalXp >= ranks.rank_operador_min)
    return { label: "Operador", color: "text-blue-400", icon: Swords };
  return { label: "Recruta", color: "text-muted-foreground", icon: Star };
}

export function RankingTab() {
  const [ranking, setRanking] = useState<RankEntry[]>([]);
  const [ranks, setRanks] = useState<SystemRanks>({ rank_operador_min: 100, rank_elite_min: 500, rank_fe_min: 1000 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadRanking();
  }, []);

  async function loadRanking() {
    // Load system settings
    const { data: settings } = await supabase
      .from("system_settings")
      .select("rank_operador_min, rank_elite_min, rank_fe_min")
      .eq("id", 1)
      .single();

    if (settings) {
      setRanks(settings);
    }

    // Load all XP entries
    const { data: xpData } = await supabase
      .from("tactical_xp")
      .select("user_id, xp_amount");

    // Load profiles with nome_de_guerra
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, nome_de_guerra");

    if (!xpData || !profiles) {
      setLoading(false);
      return;
    }

    // Aggregate XP by user
    const xpMap = new Map<string, number>();
    for (const row of xpData) {
      xpMap.set(row.user_id, (xpMap.get(row.user_id) || 0) + row.xp_amount);
    }

    // Build ranking - only users with nome_de_guerra
    const entries: RankEntry[] = [];
    for (const p of profiles) {
      if (!p.nome_de_guerra || !p.nome_de_guerra.trim()) continue;
      entries.push({
        user_id: p.id,
        nome_de_guerra: p.nome_de_guerra,
        total_xp: xpMap.get(p.id) || 0,
      });
    }

    entries.sort((a, b) => b.total_xp - a.total_xp);
    setRanking(entries);
    setLoading(false);
  }

  if (loading) {
    return (
      <div className="panel p-5 text-center text-muted-foreground font-mono-tac text-xs uppercase tracking-widest">
        Carregando ranking...
      </div>
    );
  }

  return (
    <div className="panel p-5">
      <div className="flex items-center gap-2 mb-4">
        <Trophy className="h-4 w-4 text-yellow-400" />
        <h3 className="font-mono-tac uppercase text-xs tracking-widest text-neon text-glow font-bold">
          Ranking Tático
        </h3>
      </div>

      {ranking.length === 0 ? (
        <p className="text-xs font-mono-tac text-muted-foreground text-center py-6">
          Nenhum operador com Nome de Guerra cadastrado.
        </p>
      ) : (
        <div className="space-y-2">
          {ranking.map((entry, i) => {
            const rank = getRankInfo(entry.total_xp, ranks);
            const RankIcon = rank.icon;
            return (
              <div
                key={entry.user_id}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg ${
                  i === 0
                    ? "bg-yellow-500/10 border border-yellow-500/30"
                    : i === 1
                      ? "bg-gray-400/10 border border-gray-400/20"
                      : i === 2
                        ? "bg-orange-600/10 border border-orange-600/20"
                        : "bg-card/50 border border-border/50"
                }`}
              >
                <span className="font-mono-tac text-lg font-bold text-muted-foreground w-8 text-center tabular-nums">
                  {i + 1}°
                </span>
                <RankIcon className={`h-4 w-4 ${rank.color}`} />
                <div className="flex-1">
                  <span className="font-mono-tac text-sm font-bold text-foreground uppercase tracking-wider">
                    {entry.nome_de_guerra}
                  </span>
                  <span className={`ml-2 text-[10px] font-mono-tac uppercase ${rank.color}`}>
                    {rank.label}
                  </span>
                </div>
                <span className="font-mono-tac text-sm font-bold text-neon tabular-nums">
                  {entry.total_xp} XP
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
