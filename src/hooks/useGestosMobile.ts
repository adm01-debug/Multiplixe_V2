import { useEffect, useRef, useState, type TouchEvent as EventoTouch } from "react";

const LIMITE_SWIPE = 72;
const PROPORCAO_HORIZONTAL = 1.6;
const ELEMENTOS_SEM_GESTO =
  'input, textarea, select, button, a, [role="slider"], [data-gesto-ignorar="true"]';

function comecaEmControle(alvo: EventTarget | null): boolean {
  return alvo instanceof Element && alvo.closest(ELEMENTOS_SEM_GESTO) !== null;
}

function paginaNoTopo(): boolean {
  if (typeof document === "undefined") return true;
  const rolagem = document.scrollingElement ?? document.documentElement;
  return (rolagem?.scrollTop ?? 0) <= 0;
}

interface OpcoesSwipe {
  /** Arrastar o dedo para a esquerda. */
  aoAvancar?: () => void;
  /** Arrastar o dedo para a direita. */
  aoVoltar?: () => void;
  habilitado?: boolean;
}

/**
 * Swipe horizontal no conteúdo. Gestos que começam em controle (botão, link, campo,
 * barra de progresso) são ignorados, assim como arrastos verticais de rolagem.
 */
export function useSwipeHorizontal({ aoAvancar, aoVoltar, habilitado = true }: OpcoesSwipe) {
  const inicio = useRef<{ x: number; y: number } | null>(null);

  const onTouchStart = (evento: EventoTouch) => {
    if (!habilitado || evento.touches.length !== 1 || comecaEmControle(evento.target)) {
      inicio.current = null;
      return;
    }
    inicio.current = { x: evento.touches[0].clientX, y: evento.touches[0].clientY };
  };

  const onTouchEnd = (evento: EventoTouch) => {
    const partida = inicio.current;
    inicio.current = null;
    const toque = evento.changedTouches[0];
    if (!habilitado || !partida || !toque) return;

    const dx = toque.clientX - partida.x;
    const dy = toque.clientY - partida.y;
    if (Math.abs(dx) < LIMITE_SWIPE || Math.abs(dx) < Math.abs(dy) * PROPORCAO_HORIZONTAL) return;

    if (dx < 0) aoAvancar?.();
    else aoVoltar?.();
  };

  return { onTouchStart, onTouchEnd };
}

interface OpcoesPuxar {
  aoAtualizar: () => unknown;
  /** Distância (px) que o dedo precisa descer para disparar. */
  limite?: number;
  habilitado?: boolean;
  /** Troca a checagem de "página no topo" (útil em teste). */
  estaNoTopo?: () => boolean;
}

/** Puxar a página para baixo, com a rolagem no topo, recarrega a lista. */
export function usePuxarParaAtualizar({
  aoAtualizar,
  limite = 70,
  habilitado = true,
  estaNoTopo = paginaNoTopo,
}: OpcoesPuxar) {
  const [puxado, setPuxado] = useState(0);
  const [atualizando, setAtualizando] = useState(false);
  const inicio = useRef<number | null>(null);

  // Sem isso o Chrome para Android dispara o recarregamento nativo da página
  // junto com o gesto, apagando filtros e estado da tela.
  useEffect(() => {
    if (!habilitado || typeof document === "undefined") return;
    const raiz = document.documentElement;
    const anterior = raiz.style.overscrollBehaviorY;
    raiz.style.overscrollBehaviorY = "contain";
    return () => {
      if (anterior) raiz.style.overscrollBehaviorY = anterior;
      else raiz.style.removeProperty("overscroll-behavior-y");
    };
  }, [habilitado]);

  const onTouchStart = (evento: EventoTouch) => {
    if (!habilitado || atualizando || evento.touches.length !== 1 || !estaNoTopo()) {
      inicio.current = null;
      return;
    }
    inicio.current = evento.touches[0].clientY;
  };

  const onTouchMove = (evento: EventoTouch) => {
    if (inicio.current === null || atualizando) return;
    const deslocamento = evento.touches[0].clientY - inicio.current;
    if (deslocamento <= 0 || !estaNoTopo()) {
      setPuxado(0);
      return;
    }
    setPuxado(Math.min(deslocamento / 2, limite + 30));
  };

  const onTouchEnd = () => {
    const disparar = inicio.current !== null && puxado >= limite;
    inicio.current = null;
    if (!disparar) {
      setPuxado(0);
      return;
    }
    setAtualizando(true);
    setPuxado(limite);
    Promise.resolve(aoAtualizar()).finally(() => {
      setAtualizando(false);
      setPuxado(0);
    });
  };

  return { puxado, atualizando, limite, aoPuxar: { onTouchStart, onTouchMove, onTouchEnd } };
}