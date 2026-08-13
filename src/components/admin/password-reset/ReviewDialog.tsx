import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Loader2, Check, X, User, Mail, Calendar } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import type { ResetRequest } from './types';

interface ReviewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  request: ResetRequest | null;
  action: 'approve' | 'reject';
  notes: string;
  onNotesChange: (notes: string) => void;
  onConfirm: () => void;
  processing: boolean;
}

const ReviewDialog = ({
  open, onOpenChange, request, action, notes, onNotesChange, onConfirm, processing,
}: ReviewDialogProps) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {action === 'approve' ? 'Aprovar Solicitação' : 'Rejeitar Solicitação'}
          </DialogTitle>
          <DialogDescription>
            {action === 'approve'
              ? 'Um email com o link de redefinição será enviado ao usuário.'
              : 'O usuário será notificado que sua solicitação foi rejeitada.'}
          </DialogDescription>
        </DialogHeader>

        {request && (
          <div className="space-y-4 py-4">
            <div className="p-4 rounded-lg bg-muted/50 space-y-2">
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">{request.user_name || 'Usuário'}</span>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">{request.user_email}</span>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">
                  Solicitado {formatDistanceToNow(new Date(request.requested_at), { addSuffix: true, locale: ptBR })}
                </span>
              </div>
              {request.reason && (
                <div className="pt-2 border-t">
                  <p className="text-sm text-muted-foreground">
                    <strong>Motivo:</strong> {request.reason}
                  </p>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Observações (opcional)</label>
              <Textarea
                placeholder={
                  action === 'approve'
                    ? 'Ex: Verificado por telefone...'
                    : 'Ex: Usuário não identificado, solicitar verificação adicional...'
                }
                value={notes}
                onChange={(e) => onNotesChange(e.target.value)}
                rows={3}
              />
            </div>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button
            onClick={onConfirm}
            disabled={processing}
            variant={action === 'approve' ? 'default' : 'destructive'}
          >
            {processing ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : action === 'approve' ? (
              <Check className="h-4 w-4 mr-2" />
            ) : (
              <X className="h-4 w-4 mr-2" />
            )}
            {action === 'approve' ? 'Aprovar' : 'Rejeitar'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ReviewDialog;
