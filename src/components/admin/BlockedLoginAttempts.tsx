import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Loader2, RefreshCw, ShieldAlert, Unlock, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';
import { format, formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface LoginAttempt {
  id: string;
  email: string;
  ip_address: string;
  attempt_count: number;
  last_attempt_at: string;
  locked_until: string | null;
  created_at: string;
}

const BlockedLoginAttempts = () => {
  const [attempts, setAttempts] = useState<LoginAttempt[]>([]);
  const [loading, setLoading] = useState(true);
  const [unlocking, setUnlocking] = useState<string | null>(null);

  const fetchAttempts = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('login_attempts')
        .select('*')
        .order('last_attempt_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      
      // Cast ip_address to string since it comes as unknown from DB
      const typedData = (data || []).map(item => ({
        ...item,
        ip_address: String(item.ip_address || 'N/A')
      }));
      
      setAttempts(typedData);
    } catch {
      toast.error('Erro ao carregar tentativas de login');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAttempts();
  }, []);

  const handleUnlockAccount = async (email: string) => {
    setUnlocking(email);
    try {
      const { error } = await supabase.rpc('reset_login_attempts', { p_email: email });
      
      if (error) throw error;
      
      toast.success(`Conta ${email} desbloqueada com sucesso`);
      fetchAttempts();
    } catch {
      toast.error('Erro ao desbloquear conta');
    } finally {
      setUnlocking(null);
    }
  };

  const isLocked = (attempt: LoginAttempt) => {
    if (!attempt.locked_until) return false;
    return new Date(attempt.locked_until) > new Date();
  };

  const getStatusBadge = (attempt: LoginAttempt) => {
    if (isLocked(attempt)) {
      return <Badge variant="destructive">Bloqueado</Badge>;
    }
    if (attempt.attempt_count >= 3) {
      return <Badge variant="secondary" className="bg-yellow-500/20 text-yellow-700">Em risco</Badge>;
    }
    return <Badge variant="outline">Normal</Badge>;
  };

  const blockedCount = attempts.filter(isLocked).length;
  const atRiskCount = attempts.filter(a => !isLocked(a) && a.attempt_count >= 3).length;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <ShieldAlert className="h-5 w-5" />
              Tentativas de Login Bloqueadas
            </CardTitle>
            <CardDescription>
              Monitore e gerencie contas com tentativas de login falhadas
            </CardDescription>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex gap-2">
              {blockedCount > 0 && (
                <Badge variant="destructive" className="flex items-center gap-1">
                  <AlertTriangle className="h-3 w-3" />
                  {blockedCount} bloqueado{blockedCount !== 1 ? 's' : ''}
                </Badge>
              )}
              {atRiskCount > 0 && (
                <Badge variant="secondary" className="bg-yellow-500/20 text-yellow-700">
                  {atRiskCount} em risco
                </Badge>
              )}
            </div>
            <Button variant="outline" size="sm" onClick={fetchAttempts} disabled={loading}>
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Atualizar
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : attempts.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <ShieldAlert className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p className="font-medium">Nenhuma tentativa de login registrada</p>
            <p className="text-sm">O sistema está funcionando normalmente</p>
          </div>
        ) : (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Email</TableHead>
                  <TableHead>IP</TableHead>
                  <TableHead className="text-center">Tentativas</TableHead>
                  <TableHead>Última Tentativa</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Bloqueado Até</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {attempts.map((attempt) => (
                  <TableRow key={attempt.id} className={isLocked(attempt) ? 'bg-destructive/5' : ''}>
                    <TableCell className="font-medium">{attempt.email}</TableCell>
                    <TableCell className="font-mono text-sm">{attempt.ip_address}</TableCell>
                    <TableCell className="text-center">
                      <Badge 
                        variant={attempt.attempt_count >= 5 ? 'destructive' : attempt.attempt_count >= 3 ? 'secondary' : 'outline'}
                      >
                        {attempt.attempt_count}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="text-sm">
                          {formatDistanceToNow(new Date(attempt.last_attempt_at), { 
                            addSuffix: true, 
                            locale: ptBR 
                          })}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {format(new Date(attempt.last_attempt_at), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{getStatusBadge(attempt)}</TableCell>
                    <TableCell>
                      {attempt.locked_until && isLocked(attempt) ? (
                        <div>
                          <div className="text-sm text-destructive font-medium">
                            {formatDistanceToNow(new Date(attempt.locked_until), { 
                              addSuffix: false, 
                              locale: ptBR 
                            })}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {format(new Date(attempt.locked_until), "HH:mm:ss", { locale: ptBR })}
                          </div>
                        </div>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleUnlockAccount(attempt.email)}
                        disabled={unlocking === attempt.email}
                      >
                        {unlocking === attempt.email ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <>
                            <Unlock className="h-4 w-4 mr-1" />
                            Desbloquear
                          </>
                        )}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default BlockedLoginAttempts;
