import type { ReactElement } from 'react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface Props {
  label: string;
  side?: 'top' | 'right' | 'bottom' | 'left';
  children: ReactElement;
}

/**
 * Tooltip padrão para ícones de ação. Traz o próprio `TooltipProvider`, então
 * funciona mesmo fora do provider global (ilhas, diálogos, testes).
 */
const IconTooltip = ({ label, side = 'top', children }: Props) => (
  <TooltipProvider delayDuration={200}>
    <Tooltip>
      <TooltipTrigger asChild aria-label={label}>{children}</TooltipTrigger>
      <TooltipContent side={side} className="text-xs">{label}</TooltipContent>
    </Tooltip>
  </TooltipProvider>
);

export default IconTooltip;