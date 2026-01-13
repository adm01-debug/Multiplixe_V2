import React from "react";
import type { FuseResultMatch } from "fuse.js";

interface FuzzyHighlightProps {
  text: string;
  matches?: readonly FuseResultMatch[];
  fieldKey: string;
  highlightClassName?: string;
}

/**
 * Componente que destaca as partes do texto que correspondem à busca fuzzy
 */
export const FuzzyHighlight: React.FC<FuzzyHighlightProps> = ({
  text,
  matches,
  fieldKey,
  highlightClassName = "bg-primary/30 text-primary-foreground rounded px-0.5",
}) => {
  if (!text) return null;

  // Encontra os matches para o campo específico
  const fieldMatches = matches?.filter((match) => match.key === fieldKey);

  if (!fieldMatches || fieldMatches.length === 0) {
    return <>{text}</>;
  }

  // Coleta todos os índices de highlight
  const indices: [number, number][] = [];
  fieldMatches.forEach((match) => {
    if (match.indices) {
      match.indices.forEach((indexPair) => {
        indices.push([indexPair[0], indexPair[1]]);
      });
    }
  });

  if (indices.length === 0) {
    return <>{text}</>;
  }

  // Ordena e mescla índices sobrepostos
  const sortedIndices = indices.sort((a, b) => a[0] - b[0]);
  const mergedIndices: [number, number][] = [];

  for (const [start, end] of sortedIndices) {
    if (mergedIndices.length === 0) {
      mergedIndices.push([start, end]);
    } else {
      const last = mergedIndices[mergedIndices.length - 1];
      if (start <= last[1] + 1) {
        last[1] = Math.max(last[1], end);
      } else {
        mergedIndices.push([start, end]);
      }
    }
  }

  // Constrói o texto com highlights
  const parts: React.ReactNode[] = [];
  let lastIndex = 0;

  mergedIndices.forEach(([start, end], idx) => {
    // Texto antes do highlight
    if (start > lastIndex) {
      parts.push(
        <span key={`text-${idx}`}>{text.slice(lastIndex, start)}</span>
      );
    }

    // Texto destacado
    parts.push(
      <mark key={`highlight-${idx}`} className={highlightClassName}>
        {text.slice(start, end + 1)}
      </mark>
    );

    lastIndex = end + 1;
  });

  // Texto após o último highlight
  if (lastIndex < text.length) {
    parts.push(<span key="text-end">{text.slice(lastIndex)}</span>);
  }

  return <>{parts}</>;
};

/**
 * Helper para extrair matches de um resultado Fuse específico
 */
export function getMatchesForItem<T>(
  results: Array<{ item: T; matches?: readonly FuseResultMatch[] }>,
  item: T
): readonly FuseResultMatch[] | undefined {
  const result = results.find((r) => r.item === item);
  return result?.matches;
}
