import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Loader2, 
  KeyRound, 
  Check, 
  X, 
  Clock, 
  Search, 
  RefreshCw,
  User,
  Mail,
  Calendar,
  Shield
} from 'lucide-react';
import { toast } from 'sonner';
import { format, formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface ResetRequest {
  id: string;
  user_id: string;
  user_email: string;
  user_name: string | null;
  reason: string | null;
  status: 'pending' | 'approved' | 'rejected';
  requested_at: string;
  reviewed_at: string | null;
  reviewed_by: string | null;
  reviewer_notes: string | null;
  reset_token_sent_at: string | null;
  expires_at: string;
  ip_address: string | null;
  user_agent: string | null;
}

const PasswordResetApproval = () => {
  const [requests, setRequests] = useState<ResetRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRequest, setSelectedRequest] = useState<ResetRequest | null>(null);
  const [reviewDialogOpen, setReviewDialogOpen] = useState(false);
  const [reviewNotes, setReviewNotes] = useState('');
  const [reviewAction, setReviewAction] = useState<'approve' | 'reject'>('approve');

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    try {
      const { data, error } = await supabase
        .from('password_reset_requests')
        .select('*')
        .order('requested_at', { ascending: false });

      if (error) throw error;
      setRequests((data as ResetRequest[]) || []);
    } catch {
      toast.error('Erro ao carregar solicitações');
    } finally {
      setLoading(false);
    }
  };

  const handleReview = async () => {
    if (!selectedRequest) return;

    setProcessing(selectedRequest.id);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      const response = await supabase.functions.invoke('approve-password-reset', {
        body: {
          requestId: selectedRequest.id,
          action: reviewAction,
          notes: reviewNotes,
        },
      });

      if (response.error) throw response.error;

      toast.success(
        reviewAction === 'approve' 
          ? 'Solicitação aprovada! Email de reset enviado.'
          : 'Solicitação rejeitada.'
      );
      
      setReviewDialogOpen(false);
      setReviewNotes('');
      setSelectedRequest(null);
      await fetchRequests();
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Erro ao processar solicitação';
      toast.error(errorMessage);
    } finally {
      setProcessing(null);
    }
  };

  const openReviewDialog = (request: ResetRequest, action: 'approve' | 'reject') => {
    setSelectedRequest(request);
    setReviewAction(action);
    setReviewNotes('');
    setReviewDialogOpen(true);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="outline" className="bg-yellow-500/10 text-yellow-600 border-yellow-500/20"><Clock className="h-3 w-3 mr-1" /> Pendente</Badge>;
      case 'approved':
        return <Badge variant="outline" className="bg-green-500/10 text-green-600 border-green-500/20"><Check className="h-3 w-3 mr-1" /> Aprovada</Badge>;
      case 'rejected':
        return <Badge variant="outline" className="bg-red-500/10 text-red-600 border-red-500/20"><X className="h-3 w-3 mr-1" /> Rejeitada</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const pendingRequests = requests.filter(r => r.status === 'pending');
  const processedRequests = requests.filter(r => r.status !== 'pending');

  const filteredPending = pendingRequests.filter(r =>
    r.user_email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    r.user_name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredProcessed = processedRequests.filter(r =>
    r.user_email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    r.user_name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <KeyRound className="h-5 w-5 text-primary" />
              </div>
              <div>
                <CardTitle>Aprovação de Reset de Senha</CardTitle>
                <CardDescription>
                  Aprove ou rejeite solicitações de redefinição de senha
                </CardDescription>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {pendingRequests.length > 0 && (
                <Badge variant="destructive">{pendingRequests.length} pendente(s)</Badge>
              )}
              <Button variant="outline" size="icon" onClick={fetchRequests}>
                <RefreshCw className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por email ou nome..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          <Tabs defaultValue="pending" className="w-full">
            <TabsList>
              <TabsTrigger value="pending" className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Pendentes
                {pendingRequests.length > 0 && (
                  <Badge variant="secondary" className="ml-1">{pendingRequests.length}</Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="processed" className="flex items-center gap-2">
                <Shield className="h-4 w-4" />
                Processadas
              </TabsTrigger>
            </TabsList>

            <TabsContent value="pending" className="mt-4">
              {filteredPending.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Check className="h-12 w-12 mx-auto mb-3 opacity-50 text-green-500" />
                  <p>Nenhuma solicitação pendente</p>
                </div>
              ) : (
                <div className="rounded-lg border overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Usuário</TableHead>
                        <TableHead>Motivo</TableHead>
                        <TableHead>Solicitado em</TableHead>
                        <TableHead>Expira em</TableHead>
                        <TableHead className="text-center">Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredPending.map((request) => (
                        <TableRow key={request.id}>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                                <User className="h-4 w-4 text-primary" />
                              </div>
                              <div>
                                <p className="font-medium">{request.user_name || 'Usuário'}</p>
                                <p className="text-xs text-muted-foreground">{request.user_email}</p>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="max-w-[200px] truncate text-muted-foreground">
                            {request.reason || '—'}
                          </TableCell>
                          <TableCell className="text-muted-foreground">
                            <div className="text-sm">
                              {format(new Date(request.requested_at), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {formatDistanceToNow(new Date(request.requested_at), { addSuffix: true, locale: ptBR })}
                            </div>
                          </TableCell>
                          <TableCell className="text-muted-foreground">
                            {formatDistanceToNow(new Date(request.expires_at), { addSuffix: true, locale: ptBR })}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center justify-center gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                className="text-green-600 border-green-600 hover:bg-green-50"
                                onClick={() => openReviewDialog(request, 'approve')}
                                disabled={processing === request.id}
                              >
                                {processing === request.id ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                  <Check className="h-4 w-4" />
                                )}
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                className="text-red-600 border-red-600 hover:bg-red-50"
                                onClick={() => openReviewDialog(request, 'reject')}
                                disabled={processing === request.id}
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </TabsContent>

            <TabsContent value="processed" className="mt-4">
              {filteredProcessed.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <KeyRound className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p>Nenhuma solicitação processada</p>
                </div>
              ) : (
                <div className="rounded-lg border overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Usuário</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Processado em</TableHead>
                        <TableHead>Observações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredProcessed.map((request) => (
                        <TableRow key={request.id}>
                          <TableCell>
                            <div>
                              <p className="font-medium">{request.user_name || 'Usuário'}</p>
                              <p className="text-xs text-muted-foreground">{request.user_email}</p>
                            </div>
                          </TableCell>
                          <TableCell>{getStatusBadge(request.status)}</TableCell>
                          <TableCell className="text-muted-foreground">
                            {request.reviewed_at 
                              ? format(new Date(request.reviewed_at), "dd/MM/yyyy HH:mm", { locale: ptBR })
                              : '—'
                            }
                          </TableCell>
                          <TableCell className="max-w-[200px] truncate text-muted-foreground">
                            {request.reviewer_notes || '—'}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Review Dialog */}
      <Dialog open={reviewDialogOpen} onOpenChange={setReviewDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {reviewAction === 'approve' ? 'Aprovar Solicitação' : 'Rejeitar Solicitação'}
            </DialogTitle>
            <DialogDescription>
              {reviewAction === 'approve' 
                ? 'Um email com o link de redefinição será enviado ao usuário.'
                : 'O usuário será notificado que sua solicitação foi rejeitada.'
              }
            </DialogDescription>
          </DialogHeader>
          
          {selectedRequest && (
            <div className="space-y-4 py-4">
              <div className="p-4 rounded-lg bg-muted/50 space-y-2">
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">{selectedRequest.user_name || 'Usuário'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">{selectedRequest.user_email}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">
                    Solicitado {formatDistanceToNow(new Date(selectedRequest.requested_at), { addSuffix: true, locale: ptBR })}
                  </span>
                </div>
                {selectedRequest.reason && (
                  <div className="pt-2 border-t">
                    <p className="text-sm text-muted-foreground">
                      <strong>Motivo:</strong> {selectedRequest.reason}
                    </p>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Observações (opcional)</label>
                <Textarea
                  placeholder={reviewAction === 'approve' 
                    ? 'Ex: Verificado por telefone...'
                    : 'Ex: Usuário não identificado, solicitar verificação adicional...'
                  }
                  value={reviewNotes}
                  onChange={(e) => setReviewNotes(e.target.value)}
                  rows={3}
                />
              </div>
            </div>
          )}
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setReviewDialogOpen(false)}>
              Cancelar
            </Button>
            <Button 
              onClick={handleReview} 
              disabled={processing !== null}
              variant={reviewAction === 'approve' ? 'default' : 'destructive'}
            >
              {processing ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : reviewAction === 'approve' ? (
                <Check className="h-4 w-4 mr-2" />
              ) : (
                <X className="h-4 w-4 mr-2" />
              )}
              {reviewAction === 'approve' ? 'Aprovar' : 'Rejeitar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PasswordResetApproval;
