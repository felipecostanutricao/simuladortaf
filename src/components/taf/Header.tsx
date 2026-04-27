import { Settings, LogOut, Crosshair } from "lucide-react";
import { Button } from "@/components/ui/button";

type Props = {
  onConfigurar: () => void;
  onLogout?: () => void;
};

export function Header({ onConfigurar, onLogout }: Props) {
  return (
    <header className="border-b border-border bg-card/60 backdrop-blur-md sticky top-0 z-40">
      <div className="container mx-auto px-4 py-3 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="relative h-10 w-10 rounded-md panel panel-neon flex items-center justify-center shadow-neon">
            <Crosshair className="h-5 w-5 text-neon" strokeWidth={2.5} />
          </div>
          <div className="flex flex-col leading-tight">
            <span className="text-[10px] font-mono-tac text-muted-foreground uppercase">
              Portal do Operador
            </span>
            <h1 className="text-sm sm:text-base font-bold font-mono-tac uppercase tracking-widest text-glow text-neon">
              Central T.A.F
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            onClick={onConfigurar}
            variant="outline"
            size="sm"
            className="font-mono-tac uppercase text-xs border-neon/40 text-neon hover:bg-neon/10 hover:text-neon"
          >
            <Settings className="h-4 w-4" />
            <span className="hidden sm:inline">Configurar Edital</span>
          </Button>
          <Button
            onClick={onLogout}
            variant="ghost"
            size="sm"
            className="font-mono-tac uppercase text-xs text-muted-foreground hover:text-destructive"
          >
            <LogOut className="h-4 w-4" />
            <span className="hidden sm:inline">Logout</span>
          </Button>
        </div>
      </div>
    </header>
  );
}
