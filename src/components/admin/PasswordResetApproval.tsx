import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useFuzzySearch } from '@/hooks/useFuzzySearch';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2, KeyRound, Check, X, Clock, Search, RefreshCw, User, Shield } from 'lucide-react';
import { toast } from 'sonner';
import { format, formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import type { ResetRequest } from './password-reset/types';
import RequestStatusBadge from './password-reset/RequestStatusBadge';
import ReviewDialog from './password-reset/ReviewDialog';

const PasswordResetApproval = () => {
  const [requests, setRequests] = useState<ResetRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRequest, setSelectedRequest] = useState<ResetRequest | null>(null);
  const [reviewDialogOpen, setReviewDialogOpen] = useState(false);
  const [reviewNotes, setReviewNotes] = useState('');
  const [reviewAction, setReviewAction] = useState<'approve' | 'reject'>('approve');

  useEffect(() => { fetchRequests(); }, []);

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
      const response = await supabase.functions.invoke('approve-password-reset', {
        body: { requestId: selectedRequest.id, action: reviewAction, notes: reviewNotes },
      });
      if (response.error) throw response.error;
      toast.success(reviewAction === 'approve' ? 'Solicitação aprovada! Email de reset enviado.' : 'Solicitação rejeitada.');
      setReviewDialogOpen(false);
      setReviewNotes('');
      setSelectedRequest(null);
      await fetchRequests();
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : 'Erro ao processar solicitação');
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

  const pendingRequests = requests.filter(r => r.status === 'pending');
  const processedRequests = requests.filter(r => r.status !== 'pending');
  const filteredPending = useFuzzySearch(pendingRequests, ["user_email", "user_name", "reason"], searchQuery);
  const filteredProcessed = useFuzzySearch(processedRequests, ["user_email", "user_name", "reviewer_notes"], searchQuery);

  if (loading) {
    return <div className="flex items-center justify-center p-8"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10"><KeyRound className="h-5 w-5 text-primary" /></div>
              <div>
                <CardTitle>Aprovação de Reset de Senha</CardTitle>
                <CardDescription>Aprove ou rejeite solicitações de redefinição de senha</CardDescription>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {pendingRequests.length > 0 && <Badge variant="destructive">{pendingRequests.length} pendente(s)</Badge>}
              <Button variant="outline" size="icon" onClick={fetchRequests}><RefreshCw className="h-4 w-4" /></Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input aria-label="Buscar por email ou nome" placeholder="Buscar por email ou nome..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-10" />
          </div>

          <Tabs defaultValue="pending" className="w-full">
            <TabsList>
              <TabsTrigger value="pending" className="flex items-center gap-2">
                <Clock className="h-4 w-4" />Pendentes
                {pendingRequests.length > 0 && <Badge variant="secondary" className="ml-1">{pendingRequests.length}</Badge>}
              </TabsTrigger>
              <TabsTrigger value="processed" className="flex items-center gap-2"><Shield className="h-4 w-4" />Processadas</TabsTrigger>
            </TabsList>

            <TabsContent value="pending" className="mt-4">
              {filteredPending.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground"><Check className="h-12 w-12 mx-auto mb-3 opacity-50 text-green-500" /><p>Nenhuma solicitação pendente</p></div>
              ) : (
                <div className="rounded-lg border overflow-hidden">
                  <Table>
                    <TableHeader><TableRow><TableHead>Usuário</TableHead><TableHead>Motivo</TableHead><TableHead>Solicitado em</TableHead><TableHead>Expira em</TableHead><TableHead className="text-center">Ações</TableHead></TableRow></TableHeader>
                    <TableBody>
                      {filteredPending.map((request) => (
                        <TableRow key={request.id}>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center"><User className="h-4 w-4 text-primary" /></div>
                              <div><p className="font-medium">{request.user_name || 'Usuário'}</p><p className="text-xs text-muted-foreground">{request.user_email}</p></div>
                            </div>
                          </TableCell>
                          <TableCell className="max-w-[200px] truncate text-muted-foreground">{request.reason || '—'}</TableCell>
                          <TableCell className="text-muted-foreground">
                            <div className="text-sm">{format(new Date(request.requested_at), "dd/MM/yyyy HH:mm", { locale: ptBR })}</div>
                            <div className="text-xs text-muted-foreground">{formatDistanceToNow(new Date(request.requested_at), { addSuffix: true, locale: ptBR })}</div>
                          </TableCell>
                          <TableCell className="text-muted-foreground">{formatDistanceToNow(new Date(request.expires_at), { addSuffix: true, locale: ptBR })}</TableCell>
                          <TableCell>
                            <div className="flex items-center justify-center gap-2">
                              <Button size="sm" variant="outline" className="text-green-600 border-green-600 hover:bg-green-50" onClick={() => openReviewDialog(request, 'approve')} disabled={processing === request.id}>
                                {processing === request.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                              </Button>
                              <Button size="sm" variant="outline" className="text-red-600 border-red-600 hover:bg-red-50" onClick={() => openReviewDialog(request, 'reject')} disabled={processing === request.id}>
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
                <div className="text-center py-8 text-muted-foreground"><KeyRound className="h-12 w-12 mx-auto mb-3 opacity-50" /><p>Nenhuma solicitação processada</p></div>
              ) : (
                <div className="rounded-lg border overflow-hidden">
                  <Table>
                    <TableHeader><TableRow><TableHead>Usuário</TableHead><TableHead>Status</TableHead><TableHead>Processado em</TableHead><TableHead>Observações</TableHead></TableRow></TableHeader>
                    <TableBody>
                      {filteredProcessed.map((request) => (
                        <TableRow key={request.id}>
                          <TableCell><div><p className="font-medium">{request.user_name || 'Usuário'}</p><p className="text-xs text-muted-foreground">{request.user_email}</p></div></TableCell>
                          <TableCell><RequestStatusBadge status={request.status} /></TableCell>
                          <TableCell className="text-muted-foreground">{request.reviewed_at ? format(new Date(request.reviewed_at), "dd/MM/yyyy HH:mm", { locale: ptBR }) : '—'}</TableCell>
                          <TableCell className="max-w-[200px] truncate text-muted-foreground">{request.reviewer_notes || '—'}</TableCell>
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

      <ReviewDialog
        open={reviewDialogOpen}
        onOpenChange={setReviewDialogOpen}
        request={selectedRequest}
        action={reviewAction}
        notes={reviewNotes}
        onNotesChange={setReviewNotes}
        onConfirm={handleReview}
        processing={processing !== null}
      />
    </div>
  );
};

export default PasswordResetApproval;
