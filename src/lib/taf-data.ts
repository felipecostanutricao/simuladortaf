export type Modalidade = "barra" | "flexao" | "corrida" | "natacao";

export type Metas = Record<Modalidade, number>;

export type Simulado = {
  barra: number;
  flexao: number;
  corrida: number;
  natacao: number; // segundos (menor é melhor)
};

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

// Dados fictícios de evolução
export const EVOLUCAO_MOCK = [
  { data: "01/03", indice: 42 },
  { data: "08/03", indice: 51 },
  { data: "15/03", indice: 58 },
  { data: "22/03", indice: 63 },
  { data: "29/03", indice: 67 },
  { data: "05/04", indice: 74 },
  { data: "12/04", indice: 78 },
  { data: "19/04", indice: 83 },
  { data: "26/04", indice: 88 },
];

export const SIMULADO_MOCK: Simulado = {
  barra: 8,
  flexao: 34,
  corrida: 2650,
  natacao: 54,
};
