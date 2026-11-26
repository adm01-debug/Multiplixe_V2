import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Palette, Check, X, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { toast } from "sonner";

interface ThemePreset {
  id: string;
  name: string;
  description: string;
  primary: string;
  accent: string;
  gradient: string;
}

const themePresets: ThemePreset[] = [
  {
    id: "default",
    name: "Roxo Neon",
    description: "Tema padrão com cores vibrantes",
    primary: "270 100% 70%",
    accent: "280 100% 80%",
    gradient: "from-purple-500 to-pink-500",
  },
  {
    id: "ocean",
    name: "Oceano",
    description: "Tons de azul e ciano",
    primary: "200 100% 50%",
    accent: "180 100% 60%",
    gradient: "from-cyan-500 to-blue-500",
  },
  {
    id: "forest",
    name: "Floresta",
    description: "Tons de verde e esmeralda",
    primary: "150 80% 45%",
    accent: "120 70% 50%",
    gradient: "from-emerald-500 to-green-500",
  },
  {
    id: "sunset",
    name: "Pôr do Sol",
    description: "Tons de laranja e vermelho",
    primary: "25 100% 55%",
    accent: "10 90% 60%",
    gradient: "from-orange-500 to-red-500",
  },
  {
    id: "gold",
    name: "Dourado",
    description: "Tons de ouro e âmbar",
    primary: "45 100% 50%",
    accent: "35 100% 55%",
    gradient: "from-amber-500 to-yellow-500",
  },
];

const ThemeCustomizer = () => {
  const [open, setOpen] = useState(false);
  const [selectedTheme, setSelectedTheme] = useState<string>("default");

  useEffect(() => {
    const savedTheme = localStorage.getItem("theme-preset");
    if (savedTheme) {
      setSelectedTheme(savedTheme);
      applyTheme(savedTheme);
    }
  }, []);

  const applyTheme = (themeId: string) => {
    const preset = themePresets.find((t) => t.id === themeId);
    if (!preset) return;

    const root = document.documentElement;
    root.style.setProperty("--primary", preset.primary);
    root.style.setProperty("--accent", preset.accent);
    root.style.setProperty("--ring", preset.primary);
  };

  const handleSelectTheme = (themeId: string) => {
    setSelectedTheme(themeId);
    applyTheme(themeId);
    localStorage.setItem("theme-preset", themeId);
    toast.success("Tema aplicado com sucesso!");
  };

  const resetTheme = () => {
    setSelectedTheme("default");
    applyTheme("default");
    localStorage.removeItem("theme-preset");
    toast.success("Tema resetado para o padrão");
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button
          variant="outline"
          size="icon" aria-label="Personalizar tema"
          className="rounded-xl border-border/50 hover:bg-primary/10 hover:text-primary hover:border-primary/50"
        >
          <Palette className="h-4 w-4" />
        </Button>
      </SheetTrigger>
      <SheetContent className="w-[340px] sm:w-[400px]">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            Personalizar Tema
          </SheetTitle>
          <SheetDescription>
            Escolha uma paleta de cores para personalizar sua experiência
          </SheetDescription>
        </SheetHeader>

        <div className="mt-6 space-y-4">
          {themePresets.map((preset) => (
            <motion.button
              key={preset.id}
              onClick={() => handleSelectTheme(preset.id)}
              className={`w-full p-4 rounded-xl border-2 text-left transition-all ${
                selectedTheme === preset.id
                  ? "border-primary bg-primary/10"
                  : "border-border hover:border-primary/50 hover:bg-muted/50"
              }`}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <div className="flex items-center gap-3">
                <div
                  className={`w-10 h-10 rounded-lg bg-gradient-to-br ${preset.gradient} flex items-center justify-center`}
                >
                  {selectedTheme === preset.id && (
                    <Check className="h-5 w-5 text-white" />
                  )}
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-foreground">{preset.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {preset.description}
                  </p>
                </div>
              </div>

              {/* Color Preview */}
              <div className="flex gap-2 mt-3">
                <div
                  className="w-6 h-6 rounded-full"
                  style={{ backgroundColor: `hsl(${preset.primary})` }}
                />
                <div
                  className="w-6 h-6 rounded-full"
                  style={{ backgroundColor: `hsl(${preset.accent})` }}
                />
              </div>
            </motion.button>
          ))}

          <div className="pt-4 border-t border-border">
            <Button
              variant="ghost"
              className="w-full"
              onClick={resetTheme}
            >
              <X className="h-4 w-4 mr-2" />
              Resetar para Padrão
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default ThemeCustomizer;
