import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { TooltipProvider } from '@/components/ui/tooltip';
import IconTooltip from '@/components/ui/icon-tooltip';
import DashboardStatsGrid, { type StatItem } from '@/components/dashboard/DashboardStatsGrid';
import { Play, Trophy } from 'lucide-react';

const wrap = (ui: React.ReactElement) => render(<TooltipProvider>{ui}</TooltipProvider>);

describe('UI-006 tooltips informativos', () => {
  it('da nome acessivel e tooltip ao icone de acao', async () => {
    wrap(
      <IconTooltip label="Excluir curso">
        <button type="button">x</button>
      </IconTooltip>,
    );
    const trigger = screen.getByRole('button', { name: 'Excluir curso' });
    fireEvent.focus(trigger);
    await waitFor(() => expect(screen.getAllByText('Excluir curso').length).toBeGreaterThan(1));
  });

  it('mostra o icone de informacao nos cards com tooltip e explica a metrica', () => {
    const stats: StatItem[] = [
      {
        label: 'Cursos em Andamento',
        value: 3,
        subtitle: 'Continue de onde parou',
        icon: Play,
        gradient: 'from-primary to-accent',
        glowColor: 'shadow-primary/25',
        tooltip: 'Cursos em que você começou mas ainda não concluiu',
      },
      { label: 'XP Total', value: 1200, subtitle: 'Pontos de experiência', icon: Trophy, gradient: 'from-amber-500 to-orange-500', glowColor: 'shadow-amber-500/25' },
    ];
    wrap(<DashboardStatsGrid stats={stats} />);
    expect(screen.getByLabelText('Cursos em que você começou mas ainda não concluiu')).toBeTruthy();
    expect(screen.queryByLabelText('Pontos de experiência')).toBeNull();
    expect(screen.getByText('Cursos em Andamento')).toBeTruthy();
    expect(screen.getByText('1200')).toBeTruthy();
  });
});