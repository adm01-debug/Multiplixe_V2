import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Shield, CheckCircle2, XCircle } from 'lucide-react';

interface Props {
  securityScore: number;
  totpEnabled: boolean;
  sessionsCount: number;
  unreadCount: number;
}

const getScoreColor = (score: number) => score >= 80 ? 'text-green-500' : score >= 60 ? 'text-yellow-500' : 'text-red-500';
const getScoreBadge = (score: number) => score >= 80 ? { label: 'Excelente', variant: 'default' as const } : score >= 60 ? { label: 'Bom', variant: 'secondary' as const } : { label: 'Precisa melhorar', variant: 'destructive' as const };

const SecurityScoreCard = ({ securityScore, totpEnabled, sessionsCount, unreadCount }: Props) => (
  <Card className="mb-8 border-2">
    <CardContent className="p-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-6">
          <div className="relative">
            <div className={`text-5xl font-bold ${getScoreColor(securityScore)}`}>{securityScore}</div>
            <div className="text-sm text-muted-foreground text-center">/100</div>
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Shield className="h-5 w-5" />
              <span className="font-semibold text-lg">Pontuação de Segurança</span>
              <Badge variant={getScoreBadge(securityScore).variant}>{getScoreBadge(securityScore).label}</Badge>
            </div>
            <p className="text-muted-foreground text-sm">
              Sua conta está {securityScore >= 80 ? 'bem protegida' : 'parcialmente protegida'}.
              {securityScore < 80 && ' Ative a autenticação de dois fatores para melhorar.'}
            </p>
          </div>
        </div>
        <div className="flex gap-4">
          <div className="text-center">
            {totpEnabled ? <CheckCircle2 className="h-8 w-8 text-green-500 mx-auto" /> : <XCircle className="h-8 w-8 text-red-500 mx-auto" />}
            <div className="text-xs mt-1">2FA</div>
          </div>
          <div className="text-center">
            <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
              <span className="text-sm font-bold">{sessionsCount}</span>
            </div>
            <div className="text-xs mt-1">Sessões</div>
          </div>
          <div className="text-center">
            {unreadCount > 0 ? (
              <div className="h-8 w-8 rounded-full bg-destructive flex items-center justify-center mx-auto">
                <span className="text-sm font-bold text-destructive-foreground">{unreadCount}</span>
              </div>
            ) : <CheckCircle2 className="h-8 w-8 text-green-500 mx-auto" />}
            <div className="text-xs mt-1">Alertas</div>
          </div>
        </div>
      </div>
    </CardContent>
  </Card>
);

export default SecurityScoreCard;
