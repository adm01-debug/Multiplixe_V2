import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Type, Minus, Plus, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Slider } from "@/components/ui/slider";
import { toast } from "sonner";

const FONT_SIZE_KEY = "font-size-preference";
const MIN_SIZE = 14;
const MAX_SIZE = 22;
const DEFAULT_SIZE = 16;
const STEP = 1;

const FontSizeControl = () => {
  const [fontSize, setFontSize] = useState(DEFAULT_SIZE);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem(FONT_SIZE_KEY);
    if (saved) {
      const size = parseInt(saved, 10);
      if (!isNaN(size) && size >= MIN_SIZE && size <= MAX_SIZE) {
        setFontSize(size);
        applyFontSize(size);
      }
    }
  }, []);

  const applyFontSize = (size: number) => {
    document.documentElement.style.setProperty("--base-font-size", `${size}px`);
    document.documentElement.style.fontSize = `${size}px`;
  };

  const handleChange = (value: number[]) => {
    const size = value[0];
    setFontSize(size);
    applyFontSize(size);
    localStorage.setItem(FONT_SIZE_KEY, String(size));
  };

  const increase = () => {
    if (fontSize < MAX_SIZE) {
      handleChange([fontSize + STEP]);
    }
  };

  const decrease = () => {
    if (fontSize > MIN_SIZE) {
      handleChange([fontSize - STEP]);
    }
  };

  const reset = () => {
    handleChange([DEFAULT_SIZE]);
    toast.success("Tamanho de fonte resetado");
  };

  const percentage = Math.round((fontSize / DEFAULT_SIZE) * 100);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="icon"
          className="rounded-xl border-border/50 hover:bg-primary/10 hover:text-primary hover:border-primary/50"
          aria-label="Ajustar tamanho da fonte"
        >
          <Type className="h-4 w-4" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-72" align="end">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="font-semibold text-sm flex items-center gap-2">
              <Type className="h-4 w-4 text-primary" />
              Tamanho da Fonte
            </h4>
            <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded-full">
              {percentage}%
            </span>
          </div>

          {/* Quick Controls */}
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={decrease}
              disabled={fontSize <= MIN_SIZE}
              className="h-8 w-8"
              aria-label="Diminuir fonte"
            >
              <Minus className="h-3 w-3" />
            </Button>

            <div className="flex-1 px-2">
              <Slider
                value={[fontSize]}
                onValueChange={handleChange}
                min={MIN_SIZE}
                max={MAX_SIZE}
                step={STEP}
                className="cursor-pointer"
                aria-label="Ajustar tamanho da fonte"
              />
            </div>

            <Button
              variant="outline"
              size="icon"
              onClick={increase}
              disabled={fontSize >= MAX_SIZE}
              className="h-8 w-8"
              aria-label="Aumentar fonte"
            >
              <Plus className="h-3 w-3" />
            </Button>
          </div>

          {/* Preview */}
          <div className="p-3 rounded-lg bg-muted/50 border border-border/50">
            <p className="text-muted-foreground text-xs mb-1">Prévia:</p>
            <p
              className="text-foreground leading-relaxed"
              style={{ fontSize: `${fontSize}px` }}
            >
              Texto de exemplo para visualização
            </p>
          </div>

          {/* Presets */}
          <div className="grid grid-cols-3 gap-2">
            {[
              { label: "Pequeno", size: 14 },
              { label: "Normal", size: 16 },
              { label: "Grande", size: 20 },
            ].map((preset) => (
              <motion.button
                key={preset.size}
                onClick={() => handleChange([preset.size])}
                className={`px-3 py-2 text-xs rounded-lg border transition-colors ${
                  fontSize === preset.size
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-muted/50 border-border/50 hover:bg-muted"
                }`}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                {preset.label}
              </motion.button>
            ))}
          </div>

          {/* Reset */}
          <Button
            variant="ghost"
            size="sm"
            onClick={reset}
            className="w-full text-muted-foreground"
          >
            <RotateCcw className="h-3 w-3 mr-2" />
            Restaurar Padrão
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default FontSizeControl;
