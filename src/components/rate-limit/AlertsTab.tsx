import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface Alert {
  id: string;
  title: string;
  description: string | null;
  severity: string;
  is_resolved: boolean | null;
  ip_address: unknown;
  created_at: string;
}

interface AlertsTabProps {
  alerts: Alert[];
  onResolveAlert: (id: string) => void;
}

const AlertsTab = ({ alerts, onResolveAlert }: AlertsTabProps) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Alertas de Segurança</CardTitle>
        <CardDescription>Eventos de segurança em tempo real</CardDescription>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[400px]">
          <div className="space-y-3">
            {alerts.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">Nenhum alerta registrado</p>
            ) : (
              alerts.map((alert) => (
                <div
                  key={alert.id}
                  className={`p-4 rounded-lg border ${
                    alert.is_resolved
                      ? 'bg-muted/50 border-border'
                      : alert.severity === 'high'
                        ? 'bg-destructive/10 border-destructive/30'
                        : 'bg-amber-500/10 border-amber-500/30'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <Badge
                          variant={
                            alert.severity === 'high' ? 'destructive' :
                            alert.severity === 'medium' ? 'default' : 'secondary'
                          }
                        >
                          {alert.severity}
                        </Badge>
                        <span className="font-medium">{alert.title}</span>
                        {alert.is_resolved && (
                          <Badge variant="outline" className="text-green-500">Resolvido</Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">{alert.description}</p>
                      {alert.ip_address && (
                        <p className="text-xs text-muted-foreground font-mono">IP: {String(alert.ip_address)}</p>
                      )}
                      <p className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(alert.created_at), { addSuffix: true, locale: ptBR })}
                      </p>
                    </div>
                    {!alert.is_resolved && (
                      <Button variant="outline" size="sm" onClick={() => onResolveAlert(alert.id)}>Resolver</Button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
};

export default AlertsTab;
