import { useCallback, useEffect, useState } from "react";

interface SkipTarget {
  id: string;
  label: string;
  selectors: string[];
}

const SKIP_TARGETS: SkipTarget[] = [
  { id: "main-content", label: "Pular para o conteúdo principal", selectors: ["main", "[role='main']"] },
  { id: "navigation", label: "Pular para a navegação", selectors: ["nav"] },
  { id: "footer", label: "Pular para o rodapé", selectors: ["footer", "[role='contentinfo']"] },
];

const isVisible = (element: HTMLElement) => {
  const style = window.getComputedStyle(element);
  return style.display !== "none" && style.visibility !== "hidden";
};

/** Primeiro elemento existente (e visível) para o alvo, priorizando o id canônico. */
const resolveTarget = (target: SkipTarget): HTMLElement | null => {
  for (const selector of [`#${target.id}`, ...target.selectors]) {
    const elements = Array.from(document.querySelectorAll<HTMLElement>(selector));
    const visible = elements.find(isVisible);
    if (visible) return visible;
  }
  return null;
};

/**
 * Links de atalho (WCAG 2.4.1). Só renderiza os alvos que realmente existem na
 * página atual — antes os links #navigation e #footer apontavam para ids que não
 * existiam em nenhuma rota, e #main-content só existia em 4 de 24 páginas.
 */
const SkipLinks = () => {
  const [available, setAvailable] = useState<SkipTarget[]>([]);

  useEffect(() => {
    setAvailable(SKIP_TARGETS.filter((target) => resolveTarget(target) !== null));
  }, []);

  const handleSkip = useCallback((event: React.MouseEvent<HTMLAnchorElement>, target: SkipTarget) => {
    const element = resolveTarget(target);
    if (!element) return;

    event.preventDefault();
    if (!element.hasAttribute("tabindex")) {
      element.setAttribute("tabindex", "-1");
    }
    element.focus({ preventScroll: true });
    element.scrollIntoView?.({ block: "start" });
  }, []);

  if (available.length === 0) return null;

  return (
    <nav aria-label="Links de atalho" className="sr-only focus-within:not-sr-only">
      <ul className="fixed top-0 left-0 z-[100] p-2 flex flex-col gap-1">
        {available.map((target) => (
          <li key={target.id}>
            <a
              href={`#${target.id}`}
              onClick={(event) => handleSkip(event, target)}
              className="block px-4 py-2 text-sm font-semibold text-primary-foreground bg-primary rounded-lg shadow-lg focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-background transition-all transform -translate-y-full focus:translate-y-0"
            >
              {target.label}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
};

export default SkipLinks;