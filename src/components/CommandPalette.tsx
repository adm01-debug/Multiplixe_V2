import { useEffect, useState, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import Fuse, { FuseResultMatch } from "fuse.js";
import {
  CommandDialog, CommandEmpty, CommandInput, CommandList,
} from "@/components/ui/command";
import { supabase } from "@/integrations/supabase/client";
import { Moon, Sun, LogOut } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useTheme } from "next-themes";
import { toast } from "sonner";
import { SearchResultGroup, QuickNavGroup, type SearchResult } from "@/components/command/SearchResultGroup";

const CommandPalette = () => {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const { theme, setTheme } = useTheme();

  const pages: SearchResult[] = [
    { id: "dashboard", title: "Dashboard", type: "page", url: "/dashboard", icon: "dashboard" },
    { id: "catalog", title: "Catálogo de Cursos", type: "page", url: "/catalogo", icon: "catalog" },
    { id: "leaderboard", title: "Ranking", type: "page", url: "/ranking", icon: "leaderboard" },
    { id: "profile", title: "Meu Perfil", type: "page", url: "/perfil", icon: "profile" },
    { id: "learning-paths", title: "Trilhas de Aprendizado", type: "page", url: "/trilhas", icon: "catalog" },
    { id: "security", title: "Segurança", type: "page", url: "/seguranca", icon: "shield" },
  ];

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) { e.preventDefault(); setOpen(o => !o); return; }
      const target = e.target as HTMLElement;
      if (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable || open) return;

      switch (e.key.toLowerCase()) {
        case "g": {
          const handleSecondKey = (e2: KeyboardEvent) => {
            document.removeEventListener("keydown", handleSecondKey);
            switch (e2.key.toLowerCase()) {
              case "h": navigate("/dashboard"); break;
              case "c": navigate("/catalogo"); break;
              case "l": navigate("/ranking"); break;
              case "p": navigate("/perfil"); break;
              case "t": navigate("/trilhas"); break;
              case "s": navigate("/seguranca"); break;
            }
          };
          document.addEventListener("keydown", handleSecondKey, { once: true });
          setTimeout(() => document.removeEventListener("keydown", handleSecondKey), 1000);
          break;
        }
        case "t":
          if (!e.metaKey && !e.ctrlKey) {
            setTheme(theme === "dark" ? "light" : "dark");
            toast.success(`Tema alterado para ${theme === "dark" ? "claro" : "escuro"}`);
          }
          break;
        case "?": setOpen(true); break;
      }
    };
    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, [open, navigate, theme, setTheme]);

  const [cachedData, setCachedData] = useState<{
    courses: { id: string; title: string; description: string | null; slug: string }[];
    lessons: { id: string; title: string; description: string | null; course_id: string; courses: { slug: string } }[];
    achievements: { id: string; name: string; description: string; slug: string }[];
  }>({ courses: [], lessons: [], achievements: [] });

  useEffect(() => {
    if (!user) return;
    const loadData = async () => {
      try {
        const [coursesRes, lessonsRes, achievementsRes] = await Promise.all([
          supabase.from("courses").select("id, title, description, slug").eq("is_published", true),
          supabase.from("lessons").select("id, title, description, course_id, courses!inner(slug, is_published)").eq("courses.is_published", true),
          supabase.from("achievements").select("id, name, description, slug"),
        ]);
        setCachedData({
          courses: coursesRes.data || [],
          lessons: (lessonsRes.data || []) as typeof cachedData.lessons,
          achievements: achievementsRes.data || [],
        });
      } catch { /* Silent */ }
    };
    loadData();
  }, [user]);

  const fuseInstances = useMemo(() => ({
    courses: new Fuse(cachedData.courses, { keys: ["title", "description"], threshold: 0.4, distance: 100, ignoreLocation: true, includeMatches: true }),
    lessons: new Fuse(cachedData.lessons, { keys: ["title", "description"], threshold: 0.4, distance: 100, ignoreLocation: true, includeMatches: true }),
    achievements: new Fuse(cachedData.achievements, { keys: ["name", "description"], threshold: 0.4, distance: 100, ignoreLocation: true, includeMatches: true }),
  }), [cachedData]);

  const performSearch = useCallback((searchQuery: string) => {
    if (!searchQuery.trim()) { setResults([]); return; }
    setIsLoading(true);
    try {
      const searchResults: SearchResult[] = [];
      fuseInstances.courses.search(searchQuery, { limit: 5 }).forEach(({ item, matches }) => {
        searchResults.push({ id: item.id, title: item.title, description: item.description || undefined, type: "course", url: `/curso/${item.slug}`, icon: "course", matches });
      });
      fuseInstances.lessons.search(searchQuery, { limit: 5 }).forEach(({ item, matches }) => {
        searchResults.push({ id: item.id, title: item.title, description: item.description || undefined, type: "lesson", url: `/curso/${item.courses.slug}/aula/${item.id}`, icon: "lesson", courseSlug: item.courses.slug, matches });
      });
      fuseInstances.achievements.search(searchQuery, { limit: 5 }).forEach(({ item, matches }) => {
        searchResults.push({ id: item.id, title: item.name, description: item.description || undefined, type: "achievement", url: "/perfil#conquistas", icon: "achievement", matches });
      });
      setResults(searchResults);
    } catch { /* Silent */ } finally { setIsLoading(false); }
  }, [fuseInstances]);

  useEffect(() => {
    const timer = setTimeout(() => performSearch(query), 300);
    return () => clearTimeout(timer);
  }, [query, performSearch]);

  const handleSelect = (url: string) => { setOpen(false); setQuery(""); navigate(url); };

  const courseResults = results.filter(r => r.type === "course");
  const lessonResults = results.filter(r => r.type === "lesson");
  const achievementResults = results.filter(r => r.type === "achievement");

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput placeholder="Buscar cursos, aulas, conquistas..." value={query} onValueChange={setQuery} />
      <CommandList>
        <CommandEmpty>{isLoading ? "Buscando..." : "Nenhum resultado encontrado."}</CommandEmpty>
        {!query && user && <QuickNavGroup pages={pages} onSelect={handleSelect} />}
        {query && results.length > 0 && (
          <>
            <SearchResultGroup heading="Cursos" results={courseResults} fieldKey="title" onSelect={handleSelect} />
            <SearchResultGroup heading="Aulas" results={lessonResults} fieldKey="title" onSelect={handleSelect} showSeparator={courseResults.length > 0} />
            <SearchResultGroup heading="Conquistas" results={achievementResults} fieldKey="auto" onSelect={handleSelect} showSeparator={courseResults.length > 0 || lessonResults.length > 0} />
          </>
        )}
      </CommandList>

      <div className="border-t border-border p-3 space-y-2">
        {user && !query && (
          <div className="flex items-center justify-between gap-2 pb-2 border-b border-border">
            <button onClick={() => { setTheme(theme === "dark" ? "light" : "dark"); setOpen(false); }} className="flex items-center gap-2 px-3 py-1.5 rounded-md hover:bg-muted transition-colors text-sm">
              {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
              <span>{theme === "dark" ? "Modo Claro" : "Modo Escuro"}</span>
              <kbd className="ml-auto px-1.5 py-0.5 bg-muted rounded text-[10px] font-mono">T</kbd>
            </button>
            <button onClick={() => { signOut(); setOpen(false); }} className="flex items-center gap-2 px-3 py-1.5 rounded-md hover:bg-destructive/10 text-destructive transition-colors text-sm">
              <LogOut className="h-4 w-4" /><span>Sair</span>
            </button>
          </div>
        )}
        <div className="text-xs text-muted-foreground flex flex-wrap items-center justify-center gap-x-4 gap-y-1">
          <div className="flex items-center gap-1"><kbd className="px-1.5 py-0.5 bg-muted rounded text-[10px] font-mono">↑↓</kbd><span>navegar</span></div>
          <div className="flex items-center gap-1"><kbd className="px-1.5 py-0.5 bg-muted rounded text-[10px] font-mono">↵</kbd><span>selecionar</span></div>
          <div className="flex items-center gap-1"><kbd className="px-1.5 py-0.5 bg-muted rounded text-[10px] font-mono">G</kbd><span>+</span><kbd className="px-1.5 py-0.5 bg-muted rounded text-[10px] font-mono">H/C/L/P</kbd><span>ir para</span></div>
          <div className="flex items-center gap-1"><kbd className="px-1.5 py-0.5 bg-muted rounded text-[10px] font-mono">?</kbd><span>atalhos</span></div>
        </div>
      </div>
    </CommandDialog>
  );
};

export default CommandPalette;
