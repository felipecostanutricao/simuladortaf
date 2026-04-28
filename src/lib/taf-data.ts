export type Modalidade = "barra" | "flexao" | "corrida" | "natacao";

export type Metas = Record<Modalidade, number>;

export type Simulado = {
  barra: number;
  flexao: number;
  corrida: number;
  natacao: number; // segundos (menor é melhor)
};

export type EvolucaoPoint = { data: string; indice: number };

export const METAS_PADRAO: Metas = {
  barra: 6,
  flexao: 30,
  corrida: 2400,
  natacao: 60,
};

export const LABELS: Record<Modalidade, string> = {
  barra: "Barra Fixa",
  flexao: "Flexão de Braço",
  corrida: "Corrida 12 min",
  natacao: "Natação 50m",
};

export const UNIDADES: Record<Modalidade, string> = {
  barra: "reps",
  flexao: "reps",
  corrida: "metros",
  natacao: "segundos",
};

/** Score 0-100. Para natação, menor tempo = melhor. */
export function scorePorModalidade(
  valor: number,
  meta: number,
  modalidade: Modalidade
): number {
  if (meta <= 0) return 0;
  const ratio =
    modalidade === "natacao"
      ? Math.max(0, (2 * meta - valor) / meta)
      : valor / meta;
  return Math.max(0, Math.min(150, Math.round(ratio * 100)));
}

export function indiceProntidao(s: Simulado, m: Metas): number {
  const scores = (Object.keys(LABELS) as Modalidade[]).map((k) =>
    Math.min(100, scorePorModalidade(s[k], m[k], k))
  );
  return Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
}

// ---------- DB row mappers ----------

export type GoalsRow = {
  barra_meta: number;
  flexao_meta: number;
  corrida_meta: number;
  natacao_meta: number;
  data_taf: string | null;
};

export type RecordRow = {
  id?: string;
  barra_result: number;
  flexao_result: number;
  corrida_result: number;
  natacao_result: number;
  created_at?: string;
  performed_at?: string;
};

export const rowToMetas = (row: GoalsRow | null | undefined): Metas =>
  row
    ? {
        barra: row.barra_meta,
        flexao: row.flexao_meta,
        corrida: row.corrida_meta,
        natacao: row.natacao_meta,
      }
    : { ...METAS_PADRAO };

export const rowToSimulado = (row: RecordRow | null | undefined): Simulado =>
  row
    ? {
        barra: row.barra_result,
        flexao: row.flexao_result,
        corrida: row.corrida_result,
        natacao: row.natacao_result,
      }
    : { barra: 0, flexao: 0, corrida: 0, natacao: 0 };
