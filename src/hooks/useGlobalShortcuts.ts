import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

const ROUTE_MAP: Record<string, string> = {
  d: "/dashboard",
  c: "/catalogo",
  t: "/trilhas",
  p: "/playbooks",
  v: "/biblioteca-videos",
  o: "/onboarding",
  a: "/avaliacoes",
  r: "/ranking",
};

/**
 * Atalhos globais estilo Linear/GitHub:
 * - `g` seguido por uma letra para navegar
 * - `?` abre/fecha o modal de ajuda
 * - `n` foca o input de novo comentário (se houver `[data-comment-input]` na página)
 */
export function useGlobalShortcuts(): { isHelpOpen: boolean; setHelpOpen: (open: boolean) => void } {
  const navigate = useNavigate();
  const [isHelpOpen, setHelpOpen] = useState(false);

  useEffect(() => {
    let pendingG = false;
    let resetTimer: ReturnType<typeof setTimeout> | null = null;

    const isTyping = (target: EventTarget | null): boolean => {
      if (!(target instanceof HTMLElement)) return false;
      const tag = target.tagName;
      return tag === "INPUT" || tag === "TEXTAREA" || target.isContentEditable;
    };

    const handler = (e: KeyboardEvent) => {
      if (isTyping(e.target)) return;
      if (e.metaKey || e.ctrlKey || e.altKey) return;

      if (e.key === "?") {
        e.preventDefault();
        setHelpOpen((open) => !open);
        return;
      }

      if (e.key === "n") {
        const input = document.querySelector<HTMLTextAreaElement>("[data-comment-input]");
        if (input) {
          e.preventDefault();
          input.focus();
          return;
        }
      }

      if (e.key === "g") {
        pendingG = true;
        if (resetTimer) clearTimeout(resetTimer);
        resetTimer = setTimeout(() => { pendingG = false; }, 1200);
        return;
      }

      if (pendingG) {
        const route = ROUTE_MAP[e.key.toLowerCase()];
        pendingG = false;
        if (resetTimer) clearTimeout(resetTimer);
        if (route) {
          e.preventDefault();
          navigate(route);
        }
      }
    };

    window.addEventListener("keydown", handler);
    return () => {
      window.removeEventListener("keydown", handler);
      if (resetTimer) clearTimeout(resetTimer);
    };
  }, [navigate]);

  return { isHelpOpen, setHelpOpen };
}

export const SHORTCUTS_LIST: ReadonlyArray<{ keys: string; label: string }> = [
  { keys: "g d", label: "Ir para Dashboard" },
  { keys: "g c", label: "Ir para Catálogo" },
  { keys: "g t", label: "Ir para Trilhas" },
  { keys: "g p", label: "Ir para Playbooks" },
  { keys: "g v", label: "Ir para Vídeos" },
  { keys: "g o", label: "Ir para Onboarding" },
  { keys: "g a", label: "Ir para Avaliações" },
  { keys: "g r", label: "Ir para Ranking" },
  { keys: "n", label: "Novo comentário (na página)" },
  { keys: "?", label: "Mostrar atalhos" },
];
