import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface KeyboardKeyProps {
  children: React.ReactNode;
  className?: string;
}

const KeyboardKey = ({ children, className }: KeyboardKeyProps) => {
  return (
    <kbd
      className={cn(
        "inline-flex items-center justify-center px-2 py-1 min-w-[1.75rem] h-7",
        "text-xs font-semibold",
        "bg-muted border border-border rounded-md shadow-sm",
        "text-muted-foreground",
        className
      )}
    >
      {children}
    </kbd>
  );
};

interface KeyboardShortcutProps {
  keys: string[];
  description?: string;
  className?: string;
}

const KeyboardShortcut = ({ keys, description, className }: KeyboardShortcutProps) => {
  return (
    <div className={cn("flex items-center gap-2", className)}>
      <div className="flex items-center gap-1">
        {keys.map((key, index) => (
          <span key={key} className="flex items-center gap-1">
            <KeyboardKey>{key}</KeyboardKey>
            {index < keys.length - 1 && (
              <span className="text-muted-foreground text-xs">+</span>
            )}
          </span>
        ))}
      </div>
      {description && (
        <span className="text-sm text-muted-foreground">{description}</span>
      )}
    </div>
  );
};

// Predefined shortcuts
const SHORTCUTS = {
  search: { keys: ["⌘", "K"], description: "Busca global" },
  escape: { keys: ["Esc"], description: "Fechar" },
  save: { keys: ["⌘", "S"], description: "Salvar" },
  nextLesson: { keys: ["→"], description: "Próxima aula" },
  prevLesson: { keys: ["←"], description: "Aula anterior" },
  playPause: { keys: ["Space"], description: "Play/Pause" },
  fullscreen: { keys: ["F"], description: "Tela cheia" },
  mute: { keys: ["M"], description: "Mudo" },
};

interface ShortcutsHelpProps {
  shortcuts: Array<{ keys: string[]; description: string }>;
  className?: string;
}

const ShortcutsHelp = ({ shortcuts, className }: ShortcutsHelpProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        "p-4 rounded-lg bg-popover border border-border shadow-lg",
        className
      )}
    >
      <h3 className="text-sm font-semibold text-foreground mb-3">
        Atalhos de Teclado
      </h3>
      <div className="space-y-2">
        {shortcuts.map((shortcut, index) => (
          <KeyboardShortcut
            key={index}
            keys={shortcut.keys}
            description={shortcut.description}
          />
        ))}
      </div>
    </motion.div>
  );
};

export { KeyboardKey, KeyboardShortcut, ShortcutsHelp, SHORTCUTS };
