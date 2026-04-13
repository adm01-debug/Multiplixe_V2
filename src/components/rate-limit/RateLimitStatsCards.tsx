import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Ban, CheckCircle, AlertTriangle, Activity } from 'lucide-react';

interface Props {
  blockedCount: number;
  whitelistCount: number;
  unreadCount: number;
  logsCount: number;
}

const RateLimitStatsCards = ({ blockedCount, whitelistCount, unreadCount, logsCount }: Props) => (
  <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
    {[
      { description: 'IPs Bloqueados', value: blockedCount, color: 'text-destructive', icon: Ban, sublabel: 'Atualmente bloqueados' },
      { description: 'IPs na Whitelist', value: whitelistCount, color: 'text-green-500', icon: CheckCircle, sublabel: 'Sempre permitidos' },
      { description: 'Alertas Ativos', value: unreadCount, color: 'text-amber-500', icon: AlertTriangle, sublabel: 'Não resolvidos' },
      { description: 'Requisições (7 dias)', value: logsCount, color: '', icon: Activity, sublabel: 'Total registrado' },
    ].map((item) => (
      <Card key={item.description}>
        <CardHeader className="pb-2">
          <CardDescription>{item.description}</CardDescription>
          <CardTitle className={`text-3xl ${item.color}`}>{item.value}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <item.icon className="h-3 w-3" />{item.sublabel}
          </div>
        </CardContent>
      </Card>
    ))}
  </div>
);

export default RateLimitStatsCards;
