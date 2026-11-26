import type { ComponentType, ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type IconeLucide = ComponentType<{ className?: string }>;

interface PageHeaderProps {
  titulo?: ReactNode;
  subtitulo?: ReactNode;
  icone?: IconeLucide;
  gradiente?: string;
  voltarPara?: string;
  onVoltar?: () => void;
  ariaVoltar?: string;
  rotuloVoltar?: string;
  classeVoltar?: string;
  classeTitulo?: string;
  nivel?: 40 | 50;
  direita?: ReactNode;
}

export function PageHeader({
  titulo,
  subtitulo,
  icone: Icone,
  gradiente = "from-primary to-accent",
  voltarPara = "/dashboard",
  onVoltar,
  ariaVoltar = "Voltar ao painel",
  rotuloVoltar,
  classeVoltar,
  classeTitulo,
  nivel = 40,
  direita,
}: PageHeaderProps) {
  const navigate = useNavigate();

  return (
    <header className={cn("sticky top-0 glass border-b border-border/50", nivel === 50 ? "z-50" : "z-40")}>
      <div className="container mx-auto px-4 py-4 flex items-center justify-between gap-4">
        <div className="flex min-w-0 items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            aria-label={ariaVoltar}
            onClick={onVoltar ?? (() => navigate(voltarPara))}
            className={cn("rounded-xl", classeVoltar)}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          {rotuloVoltar ? <span className="text-sm text-muted-foreground">{rotuloVoltar}</span> : null}
          {Icone ? (
            <div className="flex min-w-0 items-center gap-3">
              <div className={cn("p-2 rounded-xl bg-gradient-to-br", gradiente)}>
                <Icone className="h-6 w-6 text-white" />
              </div>
              <div className="min-w-0">
                {titulo ? <h1 className={cn("text-2xl font-bold", classeTitulo)}>{titulo}</h1> : null}
                {subtitulo ? <p className="text-sm text-muted-foreground">{subtitulo}</p> : null}
              </div>
            </div>
          ) : titulo ? (
            <div className="min-w-0">
              <h1 className={cn("text-2xl font-bold", classeTitulo)}>{titulo}</h1>
              {subtitulo ? <p className="text-sm text-muted-foreground">{subtitulo}</p> : null}
            </div>
          ) : null}
        </div>
        {direita}
      </div>
    </header>
  );
}