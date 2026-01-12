import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import { supabase } from "@/integrations/supabase/client";
import { 
  BookOpen, 
  PlayCircle, 
  Trophy, 
  Search,
  GraduationCap,
  LayoutDashboard,
  User,
  BarChart3,
  Shield,
  Moon,
  Sun,
  LogOut
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useTheme } from "next-themes";
import { toast } from "sonner";

interface SearchResult {
  id: string;
  title: string;
  description?: string;
  type: "course" | "lesson" | "achievement" | "page";
  url: string;
  icon: string;
  courseSlug?: string;
}

const CommandPalette = () => {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const { theme, setTheme } = useTheme();

  // Pages for quick navigation
  const pages: SearchResult[] = [
    { id: "dashboard", title: "Dashboard", type: "page", url: "/dashboard", icon: "dashboard" },
    { id: "catalog", title: "Catálogo de Cursos", type: "page", url: "/catalogo", icon: "catalog" },
    { id: "leaderboard", title: "Ranking", type: "page", url: "/ranking", icon: "leaderboard" },
    { id: "profile", title: "Meu Perfil", type: "page", url: "/perfil", icon: "profile" },
    { id: "learning-paths", title: "Trilhas de Aprendizado", type: "page", url: "/trilhas", icon: "catalog" },
    { id: "security", title: "Segurança", type: "page", url: "/seguranca", icon: "shield" },
  ];

  // Global keyboard shortcuts
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      // Cmd+K or Ctrl+K to open command palette
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
        return;
      }

      // Don't process other shortcuts if in input/textarea
      const target = e.target as HTMLElement;
      const isInput = target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable;
      
      if (isInput || open) return;

      // Global shortcuts
      switch (e.key.toLowerCase()) {
        case "g":
          // Wait for second key
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
          // Cancel after 1 second
          setTimeout(() => document.removeEventListener("keydown", handleSecondKey), 1000);
          break;
        case "t":
          if (!e.metaKey && !e.ctrlKey) {
            setTheme(theme === "dark" ? "light" : "dark");
            toast.success(`Tema alterado para ${theme === "dark" ? "claro" : "escuro"}`);
          }
          break;
        case "?":
          setOpen(true);
          break;
      }
    };

    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, [open, navigate, theme, setTheme]);

  // Search function
  const performSearch = useCallback(async (searchQuery: string) => {
    if (!searchQuery.trim()) {
      setResults([]);
      return;
    }

    setIsLoading(true);
    const searchResults: SearchResult[] = [];

    try {
      // Search courses
      const { data: courses } = await supabase
        .from("courses")
        .select("id, title, description, slug")
        .or(`title.ilike.%${searchQuery}%,description.ilike.%${searchQuery}%`)
        .eq("is_published", true)
        .limit(5);

      if (courses) {
        courses.forEach((course) => {
          searchResults.push({
            id: course.id,
            title: course.title,
            description: course.description || undefined,
            type: "course",
            url: `/curso/${course.slug}`,
            icon: "course",
          });
        });
      }

      // Search lessons
      const { data: lessons } = await supabase
        .from("lessons")
        .select(`
          id, 
          title, 
          description,
          course_id,
          courses!inner(slug, is_published)
        `)
        .or(`title.ilike.%${searchQuery}%,description.ilike.%${searchQuery}%`)
        .eq("courses.is_published", true)
        .limit(5);

      if (lessons) {
        lessons.forEach((lesson: { id: string; title: string; description: string | null; course_id: string; courses: { slug: string; is_published: boolean } }) => {
          searchResults.push({
            id: lesson.id,
            title: lesson.title,
            description: lesson.description || undefined,
            type: "lesson",
            url: `/curso/${lesson.courses.slug}/aula/${lesson.id}`,
            icon: "lesson",
            courseSlug: lesson.courses.slug,
          });
        });
      }

      // Search achievements
      const { data: achievements } = await supabase
        .from("achievements")
        .select("id, name, description, slug")
        .or(`name.ilike.%${searchQuery}%,description.ilike.%${searchQuery}%`)
        .limit(5);

      if (achievements) {
        achievements.forEach((achievement) => {
          searchResults.push({
            id: achievement.id,
            title: achievement.name,
            description: achievement.description || undefined,
            type: "achievement",
            url: "/perfil#conquistas",
            icon: "achievement",
          });
        });
      }

      setResults(searchResults);
    } catch {
      // Silent fail
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      performSearch(query);
    }, 300);

    return () => clearTimeout(timer);
  }, [query, performSearch]);

  const handleSelect = (url: string) => {
    setOpen(false);
    setQuery("");
    navigate(url);
  };

  const getIcon = (type: string) => {
    switch (type) {
      case "course":
        return <BookOpen className="h-4 w-4 text-primary" />;
      case "lesson":
        return <PlayCircle className="h-4 w-4 text-accent" />;
      case "achievement":
        return <Trophy className="h-4 w-4 text-amber-500" />;
      case "dashboard":
        return <LayoutDashboard className="h-4 w-4 text-muted-foreground" />;
      case "catalog":
        return <GraduationCap className="h-4 w-4 text-muted-foreground" />;
      case "leaderboard":
        return <BarChart3 className="h-4 w-4 text-muted-foreground" />;
      case "profile":
        return <User className="h-4 w-4 text-muted-foreground" />;
      case "shield":
        return <Shield className="h-4 w-4 text-muted-foreground" />;
      default:
        return <Search className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case "course":
        return "Curso";
      case "lesson":
        return "Aula";
      case "achievement":
        return "Conquista";
      default:
        return "";
    }
  };

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput
        placeholder="Buscar cursos, aulas, conquistas..."
        value={query}
        onValueChange={setQuery}
      />
      <CommandList>
        <CommandEmpty>
          {isLoading ? "Buscando..." : "Nenhum resultado encontrado."}
        </CommandEmpty>

        {/* Quick navigation pages */}
        {!query && user && (
          <CommandGroup heading="Navegação Rápida">
            {pages.map((page) => (
              <CommandItem
                key={page.id}
                value={page.title}
                onSelect={() => handleSelect(page.url)}
                className="cursor-pointer"
              >
                {getIcon(page.icon)}
                <span className="ml-2">{page.title}</span>
              </CommandItem>
            ))}
          </CommandGroup>
        )}

        {/* Search results */}
        {query && results.length > 0 && (
          <>
            {/* Courses */}
            {results.filter((r) => r.type === "course").length > 0 && (
              <CommandGroup heading="Cursos">
                {results
                  .filter((r) => r.type === "course")
                  .map((result) => (
                    <CommandItem
                      key={result.id}
                      value={result.title}
                      onSelect={() => handleSelect(result.url)}
                      className="cursor-pointer"
                    >
                      {getIcon(result.type)}
                      <div className="ml-2 flex flex-col">
                        <span>{result.title}</span>
                        {result.description && (
                          <span className="text-xs text-muted-foreground line-clamp-1">
                            {result.description}
                          </span>
                        )}
                      </div>
                    </CommandItem>
                  ))}
              </CommandGroup>
            )}

            {/* Lessons */}
            {results.filter((r) => r.type === "lesson").length > 0 && (
              <>
                <CommandSeparator />
                <CommandGroup heading="Aulas">
                  {results
                    .filter((r) => r.type === "lesson")
                    .map((result) => (
                      <CommandItem
                        key={result.id}
                        value={result.title}
                        onSelect={() => handleSelect(result.url)}
                        className="cursor-pointer"
                      >
                        {getIcon(result.type)}
                        <div className="ml-2 flex flex-col">
                          <span>{result.title}</span>
                          {result.description && (
                            <span className="text-xs text-muted-foreground line-clamp-1">
                              {result.description}
                            </span>
                          )}
                        </div>
                      </CommandItem>
                    ))}
                </CommandGroup>
              </>
            )}

            {/* Achievements */}
            {results.filter((r) => r.type === "achievement").length > 0 && (
              <>
                <CommandSeparator />
                <CommandGroup heading="Conquistas">
                  {results
                    .filter((r) => r.type === "achievement")
                    .map((result) => (
                      <CommandItem
                        key={result.id}
                        value={result.title}
                        onSelect={() => handleSelect(result.url)}
                        className="cursor-pointer"
                      >
                        {getIcon(result.type)}
                        <div className="ml-2 flex flex-col">
                          <span>{result.title}</span>
                          {result.description && (
                            <span className="text-xs text-muted-foreground line-clamp-1">
                              {result.description}
                            </span>
                          )}
                        </div>
                      </CommandItem>
                    ))}
                </CommandGroup>
              </>
            )}
          </>
        )}
      </CommandList>
      
      <div className="border-t border-border p-3 space-y-2">
        {/* Quick Actions */}
        {user && !query && (
          <div className="flex items-center justify-between gap-2 pb-2 border-b border-border">
            <button
              onClick={() => {
                setTheme(theme === "dark" ? "light" : "dark");
                setOpen(false);
              }}
              className="flex items-center gap-2 px-3 py-1.5 rounded-md hover:bg-muted transition-colors text-sm"
            >
              {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
              <span>{theme === "dark" ? "Modo Claro" : "Modo Escuro"}</span>
              <kbd className="ml-auto px-1.5 py-0.5 bg-muted rounded text-[10px] font-mono">T</kbd>
            </button>
            <button
              onClick={() => {
                signOut();
                setOpen(false);
              }}
              className="flex items-center gap-2 px-3 py-1.5 rounded-md hover:bg-destructive/10 text-destructive transition-colors text-sm"
            >
              <LogOut className="h-4 w-4" />
              <span>Sair</span>
            </button>
          </div>
        )}

        {/* Shortcuts help */}
        <div className="text-xs text-muted-foreground flex flex-wrap items-center justify-center gap-x-4 gap-y-1">
          <div className="flex items-center gap-1">
            <kbd className="px-1.5 py-0.5 bg-muted rounded text-[10px] font-mono">↑↓</kbd>
            <span>navegar</span>
          </div>
          <div className="flex items-center gap-1">
            <kbd className="px-1.5 py-0.5 bg-muted rounded text-[10px] font-mono">↵</kbd>
            <span>selecionar</span>
          </div>
          <div className="flex items-center gap-1">
            <kbd className="px-1.5 py-0.5 bg-muted rounded text-[10px] font-mono">G</kbd>
            <span>+</span>
            <kbd className="px-1.5 py-0.5 bg-muted rounded text-[10px] font-mono">H/C/L/P</kbd>
            <span>ir para</span>
          </div>
          <div className="flex items-center gap-1">
            <kbd className="px-1.5 py-0.5 bg-muted rounded text-[10px] font-mono">?</kbd>
            <span>atalhos</span>
          </div>
        </div>
      </div>
    </CommandDialog>
  );
};

export default CommandPalette;
