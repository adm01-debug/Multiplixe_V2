import { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { useNavigate } from 'react-router-dom';
import { useRateLimitLogs } from '@/hooks/useRateLimitLogs';
import { useSecurityAlerts } from '@/hooks/useSecurityAlerts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  ArrowLeft, 
  Shield, 
  Ban, 
  CheckCircle, 
  AlertTriangle,
  Clock,
  Globe,
  Settings,
  Plus,
  Trash2,
  RefreshCw,
  Loader2,
  Activity
} from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const RateLimitDashboard = () => {
  const navigate = useNavigate();
  const { 
    logs, 
    blockedIPs, 
    whitelistedIPs, 
    config, 
    loading,
    blockIP,
    unblockIP,
    whitelistIP,
    removeFromWhitelist,
    updateConfig,
    refetch 
  } = useRateLimitLogs();
  const { alerts, unreadCount, resolveAlert } = useSecurityAlerts();

  const [blockIPModal, setBlockIPModal] = useState(false);
  const [whitelistModal, setWhitelistModal] = useState(false);
  const [newIP, setNewIP] = useState('');
  const [blockReason, setBlockReason] = useState('');
  const [blockDuration, setBlockDuration] = useState('60');
  const [isPermanent, setIsPermanent] = useState(false);
  const [whitelistDescription, setWhitelistDescription] = useState('');

  const handleBlockIP = async () => {
    if (!newIP) return;
    await blockIP(newIP, blockReason, isPermanent, parseInt(blockDuration));
    setBlockIPModal(false);
    setNewIP('');
    setBlockReason('');
  };

  const handleWhitelistIP = async () => {
    if (!newIP) return;
    await whitelistIP(newIP, whitelistDescription);
    setWhitelistModal(false);
    setNewIP('');
    setWhitelistDescription('');
  };

  // Aggregate logs by IP for stats
  const ipStats = logs.reduce((acc, log) => {
    const ip = String(log.ip_address);
    if (!acc[ip]) {
      acc[ip] = { count: 0, endpoints: new Set(), lastSeen: log.created_at };
    }
    acc[ip].count += log.request_count;
    acc[ip].endpoints.add(log.endpoint);
    return acc;
  }, {} as Record<string, { count: number; endpoints: Set<string>; lastSeen: string }>);

  const topIPs = Object.entries(ipStats)
    .sort((a, b) => b[1].count - a[1].count)
    .slice(0, 10);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>Rate Limiting | MULTIPLIXE</title>
        <meta name="description" content="Dashboard de Rate Limiting e Segurança" />
      </Helmet>

      <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
        <div className="container py-8 px-4">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="icon" onClick={() => navigate('/admin')}>
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div>
                <h1 className="text-2xl font-bold flex items-center gap-2">
                  <Shield className="h-6 w-6 text-primary" />
                  Rate Limiting & Segurança
                </h1>
                <p className="text-muted-foreground">Monitore e gerencie a proteção do sistema</p>
              </div>
            </div>
            <Button variant="outline" onClick={refetch}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Atualizar
            </Button>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>IPs Bloqueados</CardDescription>
                <CardTitle className="text-3xl text-destructive">{blockedIPs.length}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Ban className="h-3 w-3" />
                  Atualmente bloqueados
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardDescription>IPs na Whitelist</CardDescription>
                <CardTitle className="text-3xl text-green-500">{whitelistedIPs.length}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <CheckCircle className="h-3 w-3" />
                  Sempre permitidos
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Alertas Ativos</CardDescription>
                <CardTitle className="text-3xl text-amber-500">{unreadCount}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <AlertTriangle className="h-3 w-3" />
                  Não resolvidos
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Requisições (7 dias)</CardDescription>
                <CardTitle className="text-3xl">{logs.length}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Activity className="h-3 w-3" />
                  Total registrado
                </div>
              </CardContent>
            </Card>
          </div>

          <Tabs defaultValue="blocked" className="space-y-6">
            <TabsList>
              <TabsTrigger value="blocked" className="gap-2">
                <Ban className="h-4 w-4" />
                IPs Bloqueados ({blockedIPs.length})
              </TabsTrigger>
              <TabsTrigger value="whitelist" className="gap-2">
                <CheckCircle className="h-4 w-4" />
                Whitelist ({whitelistedIPs.length})
              </TabsTrigger>
              <TabsTrigger value="alerts" className="gap-2">
                <AlertTriangle className="h-4 w-4" />
                Alertas ({unreadCount})
              </TabsTrigger>
              <TabsTrigger value="config" className="gap-2">
                <Settings className="h-4 w-4" />
                Configurações
              </TabsTrigger>
              <TabsTrigger value="activity" className="gap-2">
                <Activity className="h-4 w-4" />
                Atividade
              </TabsTrigger>
            </TabsList>

            {/* Blocked IPs Tab */}
            <TabsContent value="blocked">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle>IPs Bloqueados</CardTitle>
                    <CardDescription>Endereços IP temporária ou permanentemente bloqueados</CardDescription>
                  </div>
                  <Dialog open={blockIPModal} onOpenChange={setBlockIPModal}>
                    <DialogTrigger asChild>
                      <Button>
                        <Plus className="h-4 w-4 mr-2" />
                        Bloquear IP
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Bloquear Endereço IP</DialogTitle>
                        <DialogDescription>
                          O IP será impedido de acessar o sistema
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label>Endereço IP</Label>
                          <Input 
                            placeholder="192.168.1.1" 
                            value={newIP}
                            onChange={(e) => setNewIP(e.target.value)}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Motivo</Label>
                          <Input 
                            placeholder="Ex: Tentativas de força bruta" 
                            value={blockReason}
                            onChange={(e) => setBlockReason(e.target.value)}
                          />
                        </div>
                        <div className="flex items-center justify-between">
                          <Label>Bloqueio Permanente</Label>
                          <Switch checked={isPermanent} onCheckedChange={setIsPermanent} />
                        </div>
                        {!isPermanent && (
                          <div className="space-y-2">
                            <Label>Duração (minutos)</Label>
                            <Select value={blockDuration} onValueChange={setBlockDuration}>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="15">15 minutos</SelectItem>
                                <SelectItem value="30">30 minutos</SelectItem>
                                <SelectItem value="60">1 hora</SelectItem>
                                <SelectItem value="360">6 horas</SelectItem>
                                <SelectItem value="1440">24 horas</SelectItem>
                                <SelectItem value="10080">7 dias</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        )}
                      </div>
                      <DialogFooter>
                        <Button variant="outline" onClick={() => setBlockIPModal(false)}>
                          Cancelar
                        </Button>
                        <Button variant="destructive" onClick={handleBlockIP}>
                          Bloquear
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-[400px]">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>IP</TableHead>
                          <TableHead>Motivo</TableHead>
                          <TableHead>Expira em</TableHead>
                          <TableHead>Tipo</TableHead>
                          <TableHead className="text-right">Ações</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {blockedIPs.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={5} className="text-center text-muted-foreground">
                              Nenhum IP bloqueado
                            </TableCell>
                          </TableRow>
                        ) : (
                          blockedIPs.map((ip) => (
                            <TableRow key={ip.id}>
                              <TableCell className="font-mono">{String(ip.ip_address)}</TableCell>
                              <TableCell>{ip.reason || '-'}</TableCell>
                              <TableCell>
                                {ip.is_permanent ? (
                                  <Badge variant="destructive">Permanente</Badge>
                                ) : ip.expires_at ? (
                                  <span className="text-sm">
                                    {formatDistanceToNow(new Date(ip.expires_at), { 
                                      addSuffix: true, 
                                      locale: ptBR 
                                    })}
                                  </span>
                                ) : '-'}
                              </TableCell>
                              <TableCell>
                                <Badge variant={ip.is_permanent ? 'destructive' : 'secondary'}>
                                  {ip.is_permanent ? 'Permanente' : 'Temporário'}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-right">
                                <Button 
                                  variant="ghost" 
                                  size="sm"
                                  onClick={() => unblockIP(ip.id)}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    </Table>
                  </ScrollArea>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Whitelist Tab */}
            <TabsContent value="whitelist">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle>IPs na Whitelist</CardTitle>
                    <CardDescription>Endereços IP que ignoram rate limiting</CardDescription>
                  </div>
                  <Dialog open={whitelistModal} onOpenChange={setWhitelistModal}>
                    <DialogTrigger asChild>
                      <Button>
                        <Plus className="h-4 w-4 mr-2" />
                        Adicionar IP
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Adicionar à Whitelist</DialogTitle>
                        <DialogDescription>
                          Este IP não será afetado pelo rate limiting
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label>Endereço IP</Label>
                          <Input 
                            placeholder="192.168.1.1" 
                            value={newIP}
                            onChange={(e) => setNewIP(e.target.value)}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Descrição</Label>
                          <Input 
                            placeholder="Ex: Servidor de monitoramento" 
                            value={whitelistDescription}
                            onChange={(e) => setWhitelistDescription(e.target.value)}
                          />
                        </div>
                      </div>
                      <DialogFooter>
                        <Button variant="outline" onClick={() => setWhitelistModal(false)}>
                          Cancelar
                        </Button>
                        <Button onClick={handleWhitelistIP}>
                          Adicionar
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>IP</TableHead>
                        <TableHead>Descrição</TableHead>
                        <TableHead>Adicionado em</TableHead>
                        <TableHead className="text-right">Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {whitelistedIPs.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={4} className="text-center text-muted-foreground">
                            Nenhum IP na whitelist
                          </TableCell>
                        </TableRow>
                      ) : (
                        whitelistedIPs.map((ip) => (
                          <TableRow key={ip.id}>
                            <TableCell className="font-mono">{String(ip.ip_address)}</TableCell>
                            <TableCell>{ip.description || '-'}</TableCell>
                            <TableCell>
                              {format(new Date(ip.created_at), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
                            </TableCell>
                            <TableCell className="text-right">
                              <Button 
                                variant="ghost" 
                                size="sm"
                                onClick={() => removeFromWhitelist(ip.id)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Alerts Tab */}
            <TabsContent value="alerts">
              <Card>
                <CardHeader>
                  <CardTitle>Alertas de Segurança</CardTitle>
                  <CardDescription>Eventos de segurança em tempo real</CardDescription>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-[400px]">
                    <div className="space-y-3">
                      {alerts.length === 0 ? (
                        <p className="text-center text-muted-foreground py-8">
                          Nenhum alerta registrado
                        </p>
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
                                    <Badge variant="outline" className="text-green-500">
                                      Resolvido
                                    </Badge>
                                  )}
                                </div>
                                <p className="text-sm text-muted-foreground">
                                  {alert.description}
                                </p>
                                {alert.ip_address && (
                                  <p className="text-xs text-muted-foreground font-mono">
                                    IP: {String(alert.ip_address)}
                                  </p>
                                )}
                                <p className="text-xs text-muted-foreground">
                                  {formatDistanceToNow(new Date(alert.created_at), { 
                                    addSuffix: true, 
                                    locale: ptBR 
                                  })}
                                </p>
                              </div>
                              {!alert.is_resolved && (
                                <Button 
                                  variant="outline" 
                                  size="sm"
                                  onClick={() => resolveAlert(alert.id)}
                                >
                                  Resolver
                                </Button>
                              )}
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Config Tab */}
            <TabsContent value="config">
              <Card>
                <CardHeader>
                  <CardTitle>Configurações de Rate Limiting</CardTitle>
                  <CardDescription>Defina limites por endpoint</CardDescription>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Endpoint</TableHead>
                        <TableHead>Max Requisições</TableHead>
                        <TableHead>Janela (seg)</TableHead>
                        <TableHead>Bloqueio (min)</TableHead>
                        <TableHead>Ativo</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {config.map((c) => (
                        <TableRow key={c.id}>
                          <TableCell className="font-mono">{c.endpoint}</TableCell>
                          <TableCell>{c.max_requests}</TableCell>
                          <TableCell>{c.window_seconds}</TableCell>
                          <TableCell>{c.block_duration_minutes}</TableCell>
                          <TableCell>
                            <Switch 
                              checked={c.is_active}
                              onCheckedChange={(checked) => 
                                updateConfig(c.id, { is_active: checked })
                              }
                            />
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Activity Tab */}
            <TabsContent value="activity">
              <Card>
                <CardHeader>
                  <CardTitle>Top IPs por Atividade</CardTitle>
                  <CardDescription>Endereços mais ativos nos últimos 7 dias</CardDescription>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>IP</TableHead>
                        <TableHead>Requisições</TableHead>
                        <TableHead>Endpoints</TableHead>
                        <TableHead>Última Atividade</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {topIPs.map(([ip, stats]) => (
                        <TableRow key={ip}>
                          <TableCell className="font-mono">{ip}</TableCell>
                          <TableCell>{stats.count}</TableCell>
                          <TableCell>
                            <div className="flex gap-1 flex-wrap">
                              {Array.from(stats.endpoints).slice(0, 3).map((ep) => (
                                <Badge key={ep} variant="outline" className="text-xs">
                                  {ep}
                                </Badge>
                              ))}
                              {stats.endpoints.size > 3 && (
                                <Badge variant="secondary" className="text-xs">
                                  +{stats.endpoints.size - 3}
                                </Badge>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            {formatDistanceToNow(new Date(stats.lastSeen), { 
                              addSuffix: true, 
                              locale: ptBR 
                            })}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </>
  );
};

export default RateLimitDashboard;
