import { motion } from "framer-motion";
import { Check, Palette, RotateCcw, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { useT } from "@/lib/i18n";
import { useUserPreferences } from "@/hooks/useUserPreferences";
import { PALETAS, PALETA_PADRAO, normalizarPaleta } from "@/lib/themePresets";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const ThemeCustomizer = () => {
  const { t } = useT();
  const { preferences, updatePreference } = useUserPreferences();
  const atual = normalizarPaleta(preferences.accentColor);

  const selecionar = (id: string) => {
    if (id === atual) return;
    updatePreference("accentColor", id);
    toast.success(t("theme.applied"));
  };

  const restaurar = () => {
    if (atual === PALETA_PADRAO) return;
    updatePreference("accentColor", PALETA_PADRAO);
    toast.success(t("theme.resetDone"));
  };

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button
          variant="outline"
          size="icon"
          aria-label={t("theme.customize")}
          className="h-11 w-11 rounded-xl border-border/50 hover:border-primary/50 hover:bg-primary/10 hover:text-primary"
        >
          <Palette className="h-4 w-4" />
        </Button>
      </SheetTrigger>
      <SheetContent className="w-[340px] overflow-y-auto sm:w-[400px]">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            {t("theme.title")}
          </SheetTitle>
          <SheetDescription>{t("theme.subtitle")}</SheetDescription>
        </SheetHeader>

        <div className="mt-6 space-y-4" role="group" aria-label={t("theme.title")}>
          {PALETAS.map((paleta) => {
            const selecionado = paleta.id === atual;
            return (
              <motion.button
                key={paleta.id}
                type="button"
                onClick={() => selecionar(paleta.id)}
                aria-pressed={selecionado}
                className={cn(
                  "w-full rounded-xl border-2 p-4 text-left transition-colors",
                  selecionado
                    ? "border-primary bg-primary/10"
                    : "border-border hover:border-primary/50 hover:bg-muted/50"
                )}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={cn(
                      "flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br",
                      paleta.gradiente
                    )}
                  >
                    {selecionado && <Check className="h-5 w-5 text-white" />}
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-foreground">{t(paleta.nome)}</p>
                    <p className="text-sm text-muted-foreground">{t(paleta.descricao)}</p>
                  </div>
                  {selecionado && (
                    <span className="rounded-full bg-primary/15 px-2 py-0.5 text-[11px] font-medium text-primary">
                      {t("theme.current")}
                    </span>
                  )}
                </div>

                <div className="mt-3 flex gap-2" aria-hidden="true">
                  {[paleta.escuro.primary, paleta.escuro.secondary, paleta.escuro.accent].map((cor) => (
                    <div
                      key={cor}
                      className="h-6 w-6 rounded-full"
                      style={{ backgroundColor: `hsl(${cor})` }}
                    />
                  ))}
                </div>
              </motion.button>
            );
          })}

          <div className="border-t border-border pt-4">
            <Button
              variant="ghost"
              className="w-full"
              onClick={restaurar}
              disabled={atual === PALETA_PADRAO}
            >
              <RotateCcw className="mr-2 h-4 w-4" />
              {t("theme.reset")}
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default ThemeCustomizer;
