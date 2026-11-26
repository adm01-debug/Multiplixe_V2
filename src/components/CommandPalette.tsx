import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  CommandDialog, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList, CommandSeparator,
} from "@/components/ui/command";
import { Moon, Sun, LogOut, BookOpen, FileText, Video, Route, LayoutDashboard, Trophy, User, Sparkles, Target, ShieldAlert, Brain, ShoppingBag } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useTheme } from "next-themes";
import { toast } from "sonner";
import { useGlobalSearch, type GlobalSearchHit } from "@/hooks/useGlobalSearch";

interface QuickPage {
  id: string;
  title: string;
  url: string;
  icon: typeof BookOpen;
}

const QUICK_PAGES: QuickPage[] = [
  { id: "dashboard", title: "Dashboard", url: "/dashboard", icon: LayoutDashboard },
  { id: "catalog", title: "Catálogo de Cursos", url: "/catalogo", icon: BookOpen },
  { id: "leaderboard", title: "Ranking", url: "/ranking", icon: Trophy },
  { id: "profile", title: "Meu Perfil", url: "/perfil", icon: User },
  { id: "learning-paths", title: "Trilhas", url: "/trilhas", icon: Route },
  { id: "playbooks", title: "Playbooks", url: "/playbooks", icon: FileText },
  { id: "video-library", title: "Biblioteca de Vídeos", url: "/biblioteca-videos", icon: Video },
  { id: "onboarding", title: "Onboarding", url: "/onboarding", icon: Sparkles },
  { id: "assessments", title: "Avaliações", url: "/avaliacoes", icon: Target },
  { id: "flashcards", title: "Flashcards de Revisão", url: "/flashcards", icon: Brain },
  { id: "store", title: "Loja de Recompensas", url: "/loja", icon: ShoppingBag },
  { id: "security", title: "Segurança", url: "/seguranca", icon: ShieldAlert },
];

const ICON_BY_TYPE: Record<GlobalSearchHit["type"], typeof BookOpen> = {
  course: BookOpen,
  playbook: FileText,
  video: Video,
  path: Route,
};

const HEADING_BY_TYPE: Record<GlobalSearchHit["type"], string> = {
  course: "Cursos",
  playbook: "Playbooks",
  video: "Vídeos",
  path: "Trilhas",
};

const CommandPalette = () => {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const { theme, setTheme } = useTheme();
  const { results, isLoading } = useGlobalSearch(query);

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((o) => !o);
      }
    };
    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  const handleSelect = (url: string) => {
    setOpen(false);
    setQuery("");
    navigate(url);
  };

  const grouped = results.reduce<Record<GlobalSearchHit["type"], GlobalSearchHit[]>>(
    (acc, r) => {
      acc[r.type].push(r);
      return acc;
    },
    { course: [], playbook: [], video: [], path: [] },
  );

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput
        placeholder="Buscar cursos, playbooks, vídeos, trilhas..."
        value={query}
        onValueChange={setQuery}
      />
      <CommandList>
        <CommandEmpty>{isLoading ? "Buscando..." : "Nenhum resultado encontrado."}</CommandEmpty>

        {!query && user && (
          <CommandGroup heading="Ir para">
            {QUICK_PAGES.map((p) => {
              const Icon = p.icon;
              return (
                <CommandItem key={p.id} value={p.title} onSelect={() => handleSelect(p.url)}>
                  <Icon className="h-4 w-4 mr-2" />
                  {p.title}
                </CommandItem>
              );
            })}
          </CommandGroup>
        )}

        {query && (
          <>
            {(Object.keys(grouped) as GlobalSearchHit["type"][]).map((type, idx) => {
              const items = grouped[type];
              if (items.length === 0) return null;
              const Icon = ICON_BY_TYPE[type];
              return (
                <div key={type}>
                  {idx > 0 && <CommandSeparator />}
                  <CommandGroup heading={HEADING_BY_TYPE[type]}>
                    {items.map((r) => (
                      <CommandItem key={r.id} value={`${type}-${r.id}-${r.title}`} onSelect={() => handleSelect(r.url)}>
                        <Icon className="h-4 w-4 mr-2 shrink-0" />
                        <div className="flex flex-col min-w-0">
                          <span className="truncate">{r.title}</span>
                          {r.subtitle && (
                            <span className="text-xs text-muted-foreground truncate">{r.subtitle}</span>
                          )}
                        </div>
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </div>
              );
            })}
          </>
        )}
      </CommandList>

      <div className="border-t border-border p-3 space-y-2">
        {user && !query && (
          <div className="flex items-center justify-between gap-2 pb-2 border-b border-border">
            <button
              onClick={() => {
                setTheme(theme === "dark" ? "light" : "dark");
                setOpen(false);
                toast.success(`Tema ${theme === "dark" ? "claro" : "escuro"} ativado`);
              }}
              className="flex items-center gap-2 px-3 py-1.5 rounded-md hover:bg-muted transition-colors text-sm"
            >
              {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
              <span>{theme === "dark" ? "Modo Claro" : "Modo Escuro"}</span>
            </button>
            <button
              onClick={() => { signOut(); setOpen(false); }}
              className="flex items-center gap-2 px-3 py-1.5 rounded-md hover:bg-destructive/10 text-destructive transition-colors text-sm"
            >
              <LogOut className="h-4 w-4" />
              <span>Sair</span>
            </button>
          </div>
        )}
        <div className="text-xs text-muted-foreground flex flex-wrap items-center justify-center gap-x-4 gap-y-1">
          <div className="flex items-center gap-1">
            <kbd className="px-1.5 py-0.5 bg-muted rounded text-[10px] font-mono">↑↓</kbd><span>navegar</span>
          </div>
          <div className="flex items-center gap-1">
            <kbd className="px-1.5 py-0.5 bg-muted rounded text-[10px] font-mono">↵</kbd><span>selecionar</span>
          </div>
          <div className="flex items-center gap-1">
            <kbd className="px-1.5 py-0.5 bg-muted rounded text-[10px] font-mono">?</kbd><span>atalhos</span>
          </div>
        </div>
      </div>
    </CommandDialog>
  );
};

export default CommandPalette;
