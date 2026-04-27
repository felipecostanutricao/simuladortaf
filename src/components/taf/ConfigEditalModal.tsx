import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { LABELS, UNIDADES, type Metas, type Modalidade } from "@/lib/taf-data";
import { toast } from "sonner";
import { ScrollText } from "lucide-react";

type Props = {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  metas: Metas;
  onSalvar: (m: Metas) => void;
};

export function ConfigEditalModal({ open, onOpenChange, metas, onSalvar }: Props) {
  const [draft, setDraft] = useState<Metas>(metas);

  useEffect(() => {
    if (open) setDraft(metas);
  }, [open, metas]);

  const handleSave = () => {
    onSalvar(draft);
    toast.success("Edital atualizado", {
      description: "Novas metas mínimas aplicadas ao seu plano tático.",
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-card border-neon/40 shadow-neon max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 font-mono-tac uppercase tracking-widest text-neon text-glow">
            <ScrollText className="h-5 w-5" />
            Configurar Edital
          </DialogTitle>
          <DialogDescription className="font-mono-tac text-xs uppercase tracking-wider">
            Defina as metas mínimas de aprovação para cada modalidade.
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 py-2">
          {(Object.keys(LABELS) as Modalidade[]).map((k) => (
            <div key={k} className="panel p-3">
              <Label
                htmlFor={`meta-${k}`}
                className="text-[11px] font-mono-tac uppercase tracking-widest text-muted-foreground"
              >
                {LABELS[k]}
              </Label>
              <Input
                id={`meta-${k}`}
                type="number"
                min={0}
                value={draft[k] || ""}
                onChange={(e) =>
                  setDraft((d) => ({ ...d, [k]: Number(e.target.value) || 0 }))
                }
                className="mt-2 h-11 text-lg font-mono-tac font-bold bg-background/60 focus-visible:ring-neon focus-visible:border-neon tabular-nums"
              />
              <p className="mt-1 text-[10px] font-mono-tac uppercase text-muted-foreground">
                {UNIDADES[k]}
              </p>
            </div>
          ))}
        </div>

        <DialogFooter>
          <Button
            variant="ghost"
            onClick={() => onOpenChange(false)}
            className="font-mono-tac uppercase text-xs"
          >
            Cancelar
          </Button>
          <Button
            onClick={handleSave}
            className="font-mono-tac uppercase text-xs bg-neon text-primary-foreground hover:bg-neon/90 shadow-neon"
          >
            Aplicar Edital
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
