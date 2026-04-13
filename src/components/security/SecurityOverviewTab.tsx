import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Key, Monitor, AlertTriangle, CheckCircle2, LogOut, Loader2 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface Props {
  mfaSettings: { totp_enabled?: boolean; backup_codes?: string[] | null } | null;
  mfaLoading: boolean;
  sessions: Array<{ id: string; last_activity_at: string | null; session_token: string }>;
  sessionsLoading: boolean;
  alerts: Array<{ id: string; title: string; description: string | null; severity: string; is_resolved: boolean | null }>;
  alertsLoading: boolean;
  onRevokeAllOther: () => void;
  onResolveAlert: (id: string) => void;
}

const SecurityOverviewTab = ({ mfaSettings, mfaLoading, sessions, sessionsLoading, alerts, alertsLoading, onRevokeAllOther, onResolveAlert }: Props) => {
  const navigate = useNavigate();

  return (
    <div className="grid md:grid-cols-2 gap-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Key className="h-5 w-5" />Autenticação de Dois Fatores</CardTitle>
          <CardDescription>Proteja sua conta com uma camada extra de segurança</CardDescription>
        </CardHeader>
        <CardContent>
          {mfaLoading ? <Loader2 className="h-6 w-6 animate-spin" /> : (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span>TOTP (App Autenticador)</span>
                {mfaSettings?.totp_enabled ? <Badge className="bg-green-500">Ativado</Badge> : <Badge variant="outline">Desativado</Badge>}
              </div>
              <div className="flex items-center justify-between">
                <span>Códigos de Backup</span>
                {mfaSettings?.backup_codes && mfaSettings.backup_codes.length > 0 ? <Badge className="bg-green-500">{mfaSettings.backup_codes.length} disponíveis</Badge> : <Badge variant="outline">Nenhum</Badge>}
              </div>
              <Button className="w-full mt-4" onClick={() => navigate('/seguranca')}>Gerenciar 2FA</Button>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Monitor className="h-5 w-5" />Sessões Ativas</CardTitle>
          <CardDescription>Dispositivos conectados à sua conta</CardDescription>
        </CardHeader>
        <CardContent>
          {sessionsLoading ? <Loader2 className="h-6 w-6 animate-spin" /> : (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span>Total de sessões ativas</span>
                <Badge variant="secondary">{sessions.length}</Badge>
              </div>
              {sessions.length > 0 && (
                <div className="text-sm text-muted-foreground">
                  Última atividade: {sessions[0].last_activity_at ? formatDistanceToNow(new Date(sessions[0].last_activity_at), { addSuffix: true, locale: ptBR }) : 'Agora'}
                </div>
              )}
              {sessions.length > 1 && (
                <Button variant="destructive" className="w-full mt-4" onClick={onRevokeAllOther}>
                  <LogOut className="h-4 w-4 mr-2" />Encerrar outras sessões
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="md:col-span-2">
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><AlertTriangle className="h-5 w-5" />Alertas Recentes</CardTitle>
          <CardDescription>Atividades suspeitas ou importantes na sua conta</CardDescription>
        </CardHeader>
        <CardContent>
          {alertsLoading ? <Loader2 className="h-6 w-6 animate-spin" /> : alerts.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <CheckCircle2 className="h-12 w-12 mx-auto mb-4 text-green-500" /><p>Nenhum alerta de segurança</p><p className="text-sm">Sua conta está segura</p>
            </div>
          ) : (
            <div className="space-y-3">
              {alerts.slice(0, 5).map((alert) => (
                <div key={alert.id} className={`flex items-center justify-between p-3 rounded-lg border ${!alert.is_resolved ? 'bg-destructive/5 border-destructive/20' : ''}`}>
                  <div className="flex items-center gap-3">
                    <AlertTriangle className={`h-5 w-5 ${alert.severity === 'high' ? 'text-destructive' : alert.severity === 'medium' ? 'text-yellow-500' : 'text-muted-foreground'}`} />
                    <div><p className="font-medium text-sm">{alert.title}</p><p className="text-xs text-muted-foreground">{alert.description}</p></div>
                  </div>
                  {!alert.is_resolved && <Button size="sm" variant="outline" onClick={() => onResolveAlert(alert.id)}>Resolver</Button>}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default SecurityOverviewTab;
