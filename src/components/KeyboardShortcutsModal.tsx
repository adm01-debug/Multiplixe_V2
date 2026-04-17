import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useGlobalShortcuts, SHORTCUTS_LIST } from "@/hooks/useGlobalShortcuts";

const KeyboardShortcutsModal = () => {
  const { isHelpOpen, setHelpOpen } = useGlobalShortcuts();

  return (
    <Dialog open={isHelpOpen} onOpenChange={setHelpOpen}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Atalhos de teclado</DialogTitle>
        </DialogHeader>
        <ul className="space-y-2" aria-label="Lista de atalhos de teclado">
          {SHORTCUTS_LIST.map((s) => (
            <li key={s.keys} className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">{s.label}</span>
              <kbd className="font-mono text-xs px-2 py-1 rounded border border-border bg-muted">
                {s.keys}
              </kbd>
            </li>
          ))}
        </ul>
      </DialogContent>
    </Dialog>
  );
};

export default KeyboardShortcutsModal;
