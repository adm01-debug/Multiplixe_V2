import { History, CheckCircle2, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { PerformanceAlert } from './types';

interface Props {
  alertHistory: PerformanceAlert[];
  onClose: () => void;
  onResolve: (alertId: string) => void;
}

const AlertHistoryPanel = ({ alertHistory, onClose, onResolve }: Props) => (
  <div className="p-6 rounded-2xl bg-card/80 border border-border/50">
    <div className="flex items-center justify-between mb-4">
      <h3 className="text-lg font-semibold flex items-center gap-2">
        <History className="h-5 w-5 text-primary" />Histórico de Alertas de Desempenho
      </h3>
      <Button variant="ghost" size="sm" onClick={onClose}>Fechar</Button>
    </div>
    {alertHistory.length === 0 ? (
      <p className="text-muted-foreground text-center py-8">Nenhum alerta registrado ainda.</p>
    ) : (
      <div className="space-y-3">
        {alertHistory.map((alert) => (
          <div key={alert.id} className={`p-4 rounded-xl border ${alert.is_resolved ? 'bg-muted/30 border-border/50' : 'bg-destructive/5 border-destructive/30'}`}>
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-3">
                {alert.is_resolved ? <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5" /> : <Clock className="h-5 w-5 text-amber-500 mt-0.5" />}
                <div>
                  <p className="font-medium">{alert.quizTitle}</p>
                  <p className="text-sm text-muted-foreground">{alert.courseTitle}</p>
                  <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                    <span>Taxa: <span className="font-medium text-destructive">{alert.passing_rate}%</span></span>
                    <span>{alert.passed_attempts}/{alert.total_attempts} aprovados</span>
                    <span>{new Date(alert.created_at).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                  {alert.is_resolved && alert.resolved_at && (
                    <p className="text-xs text-green-600 mt-1">Resolvido em {new Date(alert.resolved_at).toLocaleDateString('pt-BR')}</p>
                  )}
                </div>
              </div>
              {!alert.is_resolved && (
                <Button variant="outline" size="sm" onClick={() => onResolve(alert.id)} className="gap-2 text-green-600 hover:text-green-700">
                  <CheckCircle2 className="h-4 w-4" />Resolver
                </Button>
              )}
            </div>
          </div>
        ))}
      </div>
    )}
  </div>
);

export default AlertHistoryPanel;
