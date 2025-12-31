import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { useAuth } from '@/hooks/useAuth';
import { useMFA } from '@/hooks/useMFA';
import { useUserSessions } from '@/hooks/useUserSessions';
import { useSecurityAlerts } from '@/hooks/useSecurityAlerts';
import { usePushNotifications } from '@/hooks/usePushNotifications';
import { useAdminRole } from '@/hooks/useAdminRole';
import NotificationPermissionBanner from '@/components/security/NotificationPermissionBanner';
import PasskeyManager from '@/components/security/PasskeyManager';
import IPWhitelistManager from '@/components/admin/IPWhitelistManager';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Shield, 
  Smartphone, 
  Monitor, 
  AlertTriangle, 
  CheckCircle2, 
  XCircle,
  Key,
  Lock,
  Eye,
  LogOut,
  ArrowLeft,
  Clock,
  MapPin,
  Loader2,
  RefreshCw,
  Bell,
  ShieldCheck
} from 'lucide-react';
import { toast } from 'sonner';
import { format, formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const SecurityDashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { isAdmin } = useAdminRole();
  const { settings: mfaSettings, loading: mfaLoading } = useMFA();
  const { sessions, loading: sessionsLoading, revokeSession, revokeAllOtherSessions, refetch: refetchSessions } = useUserSessions();
  const { alerts, loading: alertsLoading, unreadCount, resolveAlert, refetch: refetchAlerts } = useSecurityAlerts();
  const { isEnabled: notificationsEnabled, requestPermission } = usePushNotifications();
  const [revokingSession, setRevokingSession] = useState<string | null>(null);

  const handleRevokeSession = async (sessionId: string) => {
    setRevokingSession(sessionId);
    const success = await revokeSession(sessionId);
    if (success) {
      toast.success('Sessão encerrada com sucesso');
    } else {
      toast.error('Erro ao encerrar sessão');
    }
    setRevokingSession(null);
  };

  const handleRevokeAllOther = async () => {
    const currentSession = sessions[0];
    if (!currentSession) return;
    
    const success = await revokeAllOtherSessions(currentSession.session_token);
    if (success) {
      toast.success('Todas as outras sessões foram encerradas');
    } else {
      toast.error('Erro ao encerrar sessões');
    }
  };

  const getDeviceIcon = (userAgent: string | null) => {
    if (!userAgent) return <Monitor className="h-5 w-5" />;
    const ua = userAgent.toLowerCase();
    if (ua.includes('mobile') || ua.includes('android') || ua.includes('iphone')) {
      return <Smartphone className="h-5 w-5" />;
    }
    return <Monitor className="h-5 w-5" />;
  };

  const parseUserAgent = (userAgent: string | null) => {
    if (!userAgent) return { browser: 'Desconhecido', os: 'Desconhecido' };
    
    let browser = 'Navegador';
    let os = 'Sistema';
    
    if (userAgent.includes('Chrome')) browser = 'Chrome';
    else if (userAgent.includes('Firefox')) browser = 'Firefox';
    else if (userAgent.includes('Safari')) browser = 'Safari';
    else if (userAgent.includes('Edge')) browser = 'Edge';
    
    if (userAgent.includes('Windows')) os = 'Windows';
    else if (userAgent.includes('Mac')) os = 'macOS';
    else if (userAgent.includes('Linux')) os = 'Linux';
    else if (userAgent.includes('Android')) os = 'Android';
    else if (userAgent.includes('iOS') || userAgent.includes('iPhone')) os = 'iOS';
    
    return { browser, os };
  };

  const securityScore = (() => {
    let score = 40;
    if (mfaSettings?.totp_enabled) score += 30;
    if (mfaSettings?.backup_codes && mfaSettings.backup_codes.length > 0) score += 10;
    if (sessions.length <= 3) score += 10;
    if (notificationsEnabled) score += 10;
    return Math.min(score, 100);
  })();

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-500';
    if (score >= 60) return 'text-yellow-500';
    return 'text-red-500';
  };

  const getScoreBadge = (score: number) => {
    if (score >= 80) return { label: 'Excelente', variant: 'default' as const };
    if (score >= 60) return { label: 'Bom', variant: 'secondary' as const };
    return { label: 'Precisa melhorar', variant: 'destructive' as const };
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>Painel de Segurança | Plataforma de Cursos</title>
      </Helmet>
      
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8 max-w-6xl">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div>
                <h1 className="text-3xl font-bold">Painel de Segurança</h1>
                <p className="text-muted-foreground">
                  Gerencie suas configurações de segurança em um só lugar
                </p>
              </div>
            </div>
            <Button 
              variant="outline" 
              onClick={() => {
                refetchSessions();
                refetchAlerts();
              }}
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Atualizar
            </Button>
          </div>

          {/* Notification Permission Banner */}
          <NotificationPermissionBanner />

          {/* Security Score Card */}
          <Card className="mb-8 border-2">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-6">
                  <div className="relative">
                    <div className={`text-5xl font-bold ${getScoreColor(securityScore)}`}>
                      {securityScore}
                    </div>
                    <div className="text-sm text-muted-foreground text-center">/100</div>
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <Shield className="h-5 w-5" />
                      <span className="font-semibold text-lg">Pontuação de Segurança</span>
                      <Badge variant={getScoreBadge(securityScore).variant}>
                        {getScoreBadge(securityScore).label}
                      </Badge>
                    </div>
                    <p className="text-muted-foreground text-sm">
                      Sua conta está {securityScore >= 80 ? 'bem protegida' : 'parcialmente protegida'}. 
                      {securityScore < 80 && ' Ative a autenticação de dois fatores para melhorar.'}
                    </p>
                  </div>
                </div>
                
                {/* Quick Status */}
                <div className="flex gap-4">
                  <div className="text-center">
                    {mfaSettings?.totp_enabled ? (
                      <CheckCircle2 className="h-8 w-8 text-green-500 mx-auto" />
                    ) : (
                      <XCircle className="h-8 w-8 text-red-500 mx-auto" />
                    )}
                    <div className="text-xs mt-1">2FA</div>
                  </div>
                  <div className="text-center">
                    <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
                      <span className="text-sm font-bold">{sessions.length}</span>
                    </div>
                    <div className="text-xs mt-1">Sessões</div>
                  </div>
                  <div className="text-center">
                    {unreadCount > 0 ? (
                      <div className="h-8 w-8 rounded-full bg-destructive flex items-center justify-center mx-auto">
                        <span className="text-sm font-bold text-destructive-foreground">{unreadCount}</span>
                      </div>
                    ) : (
                      <CheckCircle2 className="h-8 w-8 text-green-500 mx-auto" />
                    )}
                    <div className="text-xs mt-1">Alertas</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Main Content Tabs */}
          <Tabs defaultValue="overview" className="space-y-6">
            <TabsList className={`grid w-full ${isAdmin ? 'grid-cols-5' : 'grid-cols-4'}`}>
              <TabsTrigger value="overview">Visão Geral</TabsTrigger>
              <TabsTrigger value="sessions">
                Sessões
                {sessions.length > 1 && (
                  <Badge variant="secondary" className="ml-2">{sessions.length}</Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="mfa">
                Autenticação
                {mfaSettings?.totp_enabled && (
                  <CheckCircle2 className="h-4 w-4 ml-2 text-green-500" />
                )}
              </TabsTrigger>
              <TabsTrigger value="alerts">
                Alertas
                {unreadCount > 0 && (
                  <Badge variant="destructive" className="ml-2">{unreadCount}</Badge>
                )}
              </TabsTrigger>
              {isAdmin && (
                <TabsTrigger value="admin" className="flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4" />
                  Admin
                </TabsTrigger>
              )}
            </TabsList>

            {/* Overview Tab */}
            <TabsContent value="overview" className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                {/* MFA Status Card */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Key className="h-5 w-5" />
                      Autenticação de Dois Fatores
                    </CardTitle>
                    <CardDescription>
                      Proteja sua conta com uma camada extra de segurança
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {mfaLoading ? (
                      <Loader2 className="h-6 w-6 animate-spin" />
                    ) : (
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <span>TOTP (App Autenticador)</span>
                          {mfaSettings?.totp_enabled ? (
                            <Badge className="bg-green-500">Ativado</Badge>
                          ) : (
                            <Badge variant="outline">Desativado</Badge>
                          )}
                        </div>
                        <div className="flex items-center justify-between">
                          <span>Códigos de Backup</span>
                          {mfaSettings?.backup_codes && mfaSettings.backup_codes.length > 0 ? (
                            <Badge className="bg-green-500">
                              {mfaSettings.backup_codes.length} disponíveis
                            </Badge>
                          ) : (
                            <Badge variant="outline">Nenhum</Badge>
                          )}
                        </div>
                        <Button 
                          className="w-full mt-4" 
                          onClick={() => navigate('/seguranca')}
                        >
                          Gerenciar 2FA
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Sessions Summary Card */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Monitor className="h-5 w-5" />
                      Sessões Ativas
                    </CardTitle>
                    <CardDescription>
                      Dispositivos conectados à sua conta
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {sessionsLoading ? (
                      <Loader2 className="h-6 w-6 animate-spin" />
                    ) : (
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <span>Total de sessões ativas</span>
                          <Badge variant="secondary">{sessions.length}</Badge>
                        </div>
                        {sessions.length > 0 && (
                          <div className="text-sm text-muted-foreground">
                            Última atividade:{' '}
                            {sessions[0].last_activity_at 
                              ? formatDistanceToNow(new Date(sessions[0].last_activity_at), { 
                                  addSuffix: true, 
                                  locale: ptBR 
                                })
                              : 'Agora'}
                          </div>
                        )}
                        {sessions.length > 1 && (
                          <Button 
                            variant="destructive" 
                            className="w-full mt-4"
                            onClick={handleRevokeAllOther}
                          >
                            <LogOut className="h-4 w-4 mr-2" />
                            Encerrar outras sessões
                          </Button>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Recent Alerts Card */}
                <Card className="md:col-span-2">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <AlertTriangle className="h-5 w-5" />
                      Alertas Recentes
                    </CardTitle>
                    <CardDescription>
                      Atividades suspeitas ou importantes na sua conta
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {alertsLoading ? (
                      <Loader2 className="h-6 w-6 animate-spin" />
                    ) : alerts.length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground">
                        <CheckCircle2 className="h-12 w-12 mx-auto mb-4 text-green-500" />
                        <p>Nenhum alerta de segurança</p>
                        <p className="text-sm">Sua conta está segura</p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {alerts.slice(0, 5).map((alert) => (
                          <div 
                            key={alert.id} 
                            className={`flex items-center justify-between p-3 rounded-lg border ${
                              !alert.is_resolved ? 'bg-destructive/5 border-destructive/20' : ''
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              <AlertTriangle className={`h-5 w-5 ${
                                alert.severity === 'high' ? 'text-destructive' : 
                                alert.severity === 'medium' ? 'text-yellow-500' : 'text-muted-foreground'
                              }`} />
                              <div>
                                <p className="font-medium text-sm">{alert.title}</p>
                                <p className="text-xs text-muted-foreground">{alert.description}</p>
                              </div>
                            </div>
                            {!alert.is_resolved && (
                              <Button 
                                size="sm" 
                                variant="outline"
                                onClick={() => resolveAlert(alert.id)}
                              >
                                Resolver
                              </Button>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Sessions Tab */}
            <TabsContent value="sessions" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Sessões Ativas</CardTitle>
                  <CardDescription>
                    Veja e gerencie todos os dispositivos conectados à sua conta
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {sessionsLoading ? (
                    <div className="flex justify-center py-8">
                      <Loader2 className="h-8 w-8 animate-spin" />
                    </div>
                  ) : sessions.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <Monitor className="h-12 w-12 mx-auto mb-4" />
                      <p>Nenhuma sessão ativa encontrada</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {sessions.map((session, index) => {
                        const { browser, os } = parseUserAgent(session.user_agent);
                        const isCurrentSession = index === 0;
                        
                        return (
                          <div 
                            key={session.id} 
                            className={`flex items-center justify-between p-4 rounded-lg border ${
                              isCurrentSession ? 'border-primary bg-primary/5' : ''
                            }`}
                          >
                            <div className="flex items-center gap-4">
                              {getDeviceIcon(session.user_agent)}
                              <div>
                                <div className="flex items-center gap-2">
                                  <span className="font-medium">{browser} em {os}</span>
                                  {isCurrentSession && (
                                    <Badge variant="outline" className="text-xs">Sessão atual</Badge>
                                  )}
                                </div>
                                <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                                  {session.ip_address && (
                                    <span className="flex items-center gap-1">
                                      <MapPin className="h-3 w-3" />
                                      {session.ip_address}
                                    </span>
                                  )}
                                  <span className="flex items-center gap-1">
                                    <Clock className="h-3 w-3" />
                                    {session.last_activity_at 
                                      ? formatDistanceToNow(new Date(session.last_activity_at), { 
                                          addSuffix: true, 
                                          locale: ptBR 
                                        })
                                      : 'Agora'}
                                  </span>
                                </div>
                              </div>
                            </div>
                            {!isCurrentSession && (
                              <Button 
                                variant="ghost" 
                                size="sm"
                                onClick={() => handleRevokeSession(session.id)}
                                disabled={revokingSession === session.id}
                              >
                                {revokingSession === session.id ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                  <XCircle className="h-4 w-4" />
                                )}
                              </Button>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* MFA Tab */}
            <TabsContent value="mfa" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Autenticação de Dois Fatores (2FA)</CardTitle>
                  <CardDescription>
                    Configure métodos adicionais de autenticação para proteger sua conta
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {mfaLoading ? (
                    <div className="flex justify-center py-8">
                      <Loader2 className="h-8 w-8 animate-spin" />
                    </div>
                  ) : (
                    <>
                      {/* TOTP Section */}
                      <div className="flex items-center justify-between p-4 rounded-lg border">
                        <div className="flex items-center gap-4">
                          <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                            <Smartphone className="h-6 w-6" />
                          </div>
                          <div>
                            <h3 className="font-semibold">App Autenticador (TOTP)</h3>
                            <p className="text-sm text-muted-foreground">
                              Use um app como Google Authenticator ou Authy
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          {mfaSettings?.totp_enabled ? (
                            <Badge className="bg-green-500">Ativado</Badge>
                          ) : (
                            <Badge variant="outline">Desativado</Badge>
                          )}
                          <Button 
                            variant={mfaSettings?.totp_enabled ? "outline" : "default"}
                            onClick={() => navigate('/seguranca')}
                          >
                            {mfaSettings?.totp_enabled ? 'Gerenciar' : 'Ativar'}
                          </Button>
                        </div>
                      </div>

                      {/* Backup Codes Section */}
                      <div className="flex items-center justify-between p-4 rounded-lg border">
                        <div className="flex items-center gap-4">
                          <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                            <Key className="h-6 w-6" />
                          </div>
                          <div>
                            <h3 className="font-semibold">Códigos de Backup</h3>
                            <p className="text-sm text-muted-foreground">
                              Códigos de uso único para recuperação de acesso
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          {mfaSettings?.backup_codes && mfaSettings.backup_codes.length > 0 ? (
                            <Badge className="bg-green-500">
                              {mfaSettings.backup_codes.length} códigos
                            </Badge>
                          ) : (
                            <Badge variant="outline">Nenhum</Badge>
                          )}
                          <Button 
                            variant="outline"
                            onClick={() => navigate('/seguranca')}
                          >
                            {mfaSettings?.backup_codes?.length ? 'Ver códigos' : 'Gerar'}
                          </Button>
                        </div>
                      </div>

                      {/* Security Tips */}
                      <div className="mt-6 p-4 rounded-lg bg-muted/50">
                        <h4 className="font-semibold flex items-center gap-2 mb-2">
                          <Lock className="h-4 w-4" />
                          Dicas de Segurança
                        </h4>
                        <ul className="text-sm text-muted-foreground space-y-1">
                          <li>• Ative a autenticação de dois fatores para máxima proteção</li>
                          <li>• Guarde seus códigos de backup em um local seguro</li>
                          <li>• Nunca compartilhe seus códigos de verificação</li>
                          <li>• Revise regularmente as sessões ativas na sua conta</li>
                        </ul>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>

              {/* Passkeys Section */}
              <PasskeyManager />
            </TabsContent>

            {/* Alerts Tab */}
            <TabsContent value="alerts" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Alertas de Segurança</CardTitle>
                  <CardDescription>
                    Histórico de atividades suspeitas e eventos de segurança
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {alertsLoading ? (
                    <div className="flex justify-center py-8">
                      <Loader2 className="h-8 w-8 animate-spin" />
                    </div>
                  ) : alerts.length === 0 ? (
                    <div className="text-center py-12 text-muted-foreground">
                      <CheckCircle2 className="h-16 w-16 mx-auto mb-4 text-green-500" />
                      <h3 className="font-semibold text-lg mb-2">Tudo limpo!</h3>
                      <p>Não há alertas de segurança para sua conta</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {alerts.map((alert) => (
                        <div 
                          key={alert.id} 
                          className={`p-4 rounded-lg border ${
                            !alert.is_resolved 
                              ? 'bg-destructive/5 border-destructive/20' 
                              : 'bg-muted/30'
                          }`}
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex items-start gap-3">
                              <AlertTriangle className={`h-5 w-5 mt-0.5 ${
                                alert.severity === 'high' ? 'text-destructive' : 
                                alert.severity === 'medium' ? 'text-yellow-500' : 'text-muted-foreground'
                              }`} />
                              <div>
                                <div className="flex items-center gap-2">
                                  <p className="font-medium">{alert.title}</p>
                                  <Badge 
                                    variant={alert.severity === 'high' ? 'destructive' : 'secondary'}
                                    className="text-xs"
                                  >
                                    {alert.severity === 'high' ? 'Alta' : 
                                     alert.severity === 'medium' ? 'Média' : 'Baixa'}
                                  </Badge>
                                  {alert.is_resolved && (
                                    <Badge variant="outline" className="text-xs">Resolvido</Badge>
                                  )}
                                </div>
                                <p className="text-sm text-muted-foreground mt-1">
                                  {alert.description}
                                </p>
                                <p className="text-xs text-muted-foreground mt-2">
                                  {format(new Date(alert.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                                </p>
                              </div>
                            </div>
                            {!alert.is_resolved && (
                              <Button 
                                size="sm" 
                                variant="outline"
                                onClick={() => resolveAlert(alert.id)}
                              >
                                <Eye className="h-4 w-4 mr-1" />
                                Resolver
                              </Button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Admin Tab - Only visible for admins */}
            {isAdmin && (
              <TabsContent value="admin" className="space-y-6">
                <IPWhitelistManager />
              </TabsContent>
            )}
          </Tabs>
        </div>
      </div>
    </>
  );
};

export default SecurityDashboard;
