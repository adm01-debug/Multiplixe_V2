import { Helmet } from 'react-helmet-async';
import { useNavigate } from 'react-router-dom';
import { useRateLimitLogs } from '@/hooks/useRateLimitLogs';
import { useSecurityAlerts } from '@/hooks/useSecurityAlerts';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Ban, CheckCircle, AlertTriangle, Settings, Activity, Loader2 } from 'lucide-react';
import RateLimitHeader from '@/components/rate-limit/RateLimitHeader';
import RateLimitStatsCards from '@/components/rate-limit/RateLimitStatsCards';
import BlockedIPsTab from '@/components/rate-limit/BlockedIPsTab';
import WhitelistTab from '@/components/rate-limit/WhitelistTab';
import AlertsTab from '@/components/rate-limit/AlertsTab';
import ConfigTab from '@/components/rate-limit/ConfigTab';
import ActivityTab from '@/components/rate-limit/ActivityTab';

const RateLimitDashboard = () => {
  const navigate = useNavigate();
  const {
    logs, blockedIPs, whitelistedIPs, config, loading,
    blockIP, unblockIP, whitelistIP, removeFromWhitelist, updateConfig, refetch,
  } = useRateLimitLogs();
  const { alerts, unreadCount, resolveAlert } = useSecurityAlerts();

  // Aggregate logs by IP for stats
  const ipStats = logs.reduce((acc, log) => {
    const ip = String(log.ip_address);
    if (!acc[ip]) {
      acc[ip] = { count: 0, endpoints: new Set<string>(), lastSeen: log.created_at };
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
          <RateLimitHeader onBack={() => navigate('/admin')} onRefresh={refetch} />

          <RateLimitStatsCards
            blockedCount={blockedIPs.length}
            whitelistedCount={whitelistedIPs.length}
            alertsCount={unreadCount}
            logsCount={logs.length}
          />

          <Tabs defaultValue="blocked" className="space-y-6">
            <TabsList>
              <TabsTrigger value="blocked" className="gap-2"><Ban className="h-4 w-4" />IPs Bloqueados ({blockedIPs.length})</TabsTrigger>
              <TabsTrigger value="whitelist" className="gap-2"><CheckCircle className="h-4 w-4" />Whitelist ({whitelistedIPs.length})</TabsTrigger>
              <TabsTrigger value="alerts" className="gap-2"><AlertTriangle className="h-4 w-4" />Alertas ({unreadCount})</TabsTrigger>
              <TabsTrigger value="config" className="gap-2"><Settings className="h-4 w-4" />Configurações</TabsTrigger>
              <TabsTrigger value="activity" className="gap-2"><Activity className="h-4 w-4" />Atividade</TabsTrigger>
            </TabsList>

            <TabsContent value="blocked">
              <BlockedIPsTab blockedIPs={blockedIPs} onBlockIP={blockIP} onUnblockIP={unblockIP} />
            </TabsContent>
            <TabsContent value="whitelist">
              <WhitelistTab whitelistedIPs={whitelistedIPs} onWhitelistIP={whitelistIP} onRemoveFromWhitelist={removeFromWhitelist} />
            </TabsContent>
            <TabsContent value="alerts">
              <AlertsTab alerts={alerts} onResolveAlert={resolveAlert} />
            </TabsContent>
            <TabsContent value="config">
              <ConfigTab config={config} onUpdateConfig={updateConfig} />
            </TabsContent>
            <TabsContent value="activity">
              <ActivityTab topIPs={topIPs} />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </>
  );
};

export default RateLimitDashboard;
