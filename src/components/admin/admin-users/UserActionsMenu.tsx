import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Loader2, MoreHorizontal, KeyRound, ShieldCheck, ShieldOff, UserCheck, UserX, Eye } from 'lucide-react';
import { toast } from 'sonner';
import UserProgressDialog from './UserProgressDialog';
import type { UserStat } from './types';

type ConfirmAction = 'reset' | 'deactivate' | 'reactivate' | 'grant-admin' | 'revoke-admin';

interface Props {
  user: UserStat;
  currentUserId?: string;
  isLastAdmin: boolean;
  onChanged: () => void | Promise<void>;
}

const actionCopy: Record<ConfirmAction, { title: string; description: string; confirm: string }> = {
  reset: {
    title: 'Redefinir senha',
    description: 'Um link de redefinição será enviado para o e-mail do usuário. O link expira em 1 hora.',
    confirm: 'Enviar link',
  },
  deactivate: {
    title: 'Desativar usuário',
    description: 'O acesso será bloqueado imediatamente e as sessões abertas serão encerradas. O histórico de progresso é preservado e a conta pode ser reativada depois.',
    confirm: 'Desativar',
  },
  reactivate: {
    title: 'Reativar usuário',
    description: 'O usuário volta a poder entrar na plataforma com a senha atual.',
    confirm: 'Reativar',
  },
  'grant-admin': {
    title: 'Conceder acesso de administrador',
    description: 'O usuário passará a ver esta área de administração e poderá alterar qualquer conteúdo.',
    confirm: 'Conceder',
  },
  'revoke-admin': {
    title: 'Remover acesso de administrador',
    description: 'O usuário volta a ser aluno e perde o acesso a esta área.',
    confirm: 'Remover',
  },
};

const errorText = async (error: unknown): Promise<string> => {
  const context = (error as { context?: Response }).context;
  if (context && typeof context.json === 'function') {
    try {
      const body = await context.json();
      if (body && typeof body.error === 'string') return body.error;
    } catch {
      // corpo não era JSON: cai no fallback
    }
  }
  return error instanceof Error ? error.message : 'Erro inesperado';
};

const UserActionsMenu = ({ user, currentUserId, isLastAdmin, onChanged }: Props) => {
  const [pending, setPending] = useState<ConfirmAction | null>(null);
  const [confirm, setConfirm] = useState<ConfirmAction | null>(null);
  const [progressOpen, setProgressOpen] = useState(false);

  const isSelf = currentUserId === user.user_id;
  const isAdmin = user.roles.includes('admin');
  const canRevokeAdmin = isAdmin && !isSelf && !isLastAdmin;

  const requestPasswordReset = async () => {
    const { data, error } = await supabase
      .from('password_reset_requests')
      .insert({
        user_id: user.user_id,
        user_email: user.email,
        user_name: user.full_name,
        reason: 'Redefinição solicitada pelo administrador',
        user_agent: navigator.userAgent,
      })
      .select('id')
      .single();

    if (error) throw error;

    const { error: approveError } = await supabase.functions.invoke('approve-password-reset', {
      body: { requestId: data.id, action: 'approve', notes: 'Solicitado pelo painel de administração' },
    });

    if (approveError) {
      const detail = await errorText(approveError);
      throw new Error(`${detail} — a solicitação ficou pendente na aba "Senhas".`);
    }
  };

  const setUserActive = async (active: boolean) => {
    const { data, error } = await supabase.functions.invoke('admin-user-actions', {
      body: { action: active ? 'reactivate' : 'deactivate', userId: user.user_id },
    });
    if (error) throw new Error(await errorText(error));
    if (data && typeof data === 'object' && 'error' in data && data.error) {
      throw new Error(String(data.error));
    }
  };

  const setAdminRole = async (grant: boolean) => {
    const base = supabase.from('user_roles');
    const { error } = grant
      ? await base.insert({ user_id: user.user_id, role: 'admin' })
      : await base.delete().eq('user_id', user.user_id).eq('role', 'admin');
    if (error) throw error;
  };

  const run = async (action: ConfirmAction) => {
    setPending(action);
    try {
      if (action === 'reset') {
        await requestPasswordReset();
        toast.success(`Link de redefinição enviado para ${user.email}`);
      } else if (action === 'deactivate') {
        await setUserActive(false);
        toast.success('Usuário desativado');
      } else if (action === 'reactivate') {
        await setUserActive(true);
        toast.success('Usuário reativado');
      } else if (action === 'grant-admin') {
        await setAdminRole(true);
        toast.success('Acesso de administrador concedido');
      } else {
        await setAdminRole(false);
        toast.success('Acesso de administrador removido');
      }
      setConfirm(null);
      await onChanged();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Erro ao executar a ação');
    } finally {
      setPending(null);
    }
  };

  const copy = confirm ? actionCopy[confirm] : null;

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" aria-label={`Ações para ${user.full_name}`}>
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuLabel>Ações</DropdownMenuLabel>
          <DropdownMenuItem onSelect={() => setProgressOpen(true)}>
            <Eye className="h-4 w-4 mr-2" />Ver progresso
          </DropdownMenuItem>
          <DropdownMenuItem
            disabled={!user.email}
            onSelect={() => setConfirm('reset')}
          >
            <KeyRound className="h-4 w-4 mr-2" />
            {user.email ? 'Redefinir senha' : 'Redefinir senha (sem e-mail)'}
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          {isAdmin ? (
            <DropdownMenuItem
              disabled={!canRevokeAdmin}
              onSelect={() => setConfirm('revoke-admin')}
            >
              <ShieldOff className="h-4 w-4 mr-2" />Remover admin
            </DropdownMenuItem>
          ) : (
            <DropdownMenuItem onSelect={() => setConfirm('grant-admin')}>
              <ShieldCheck className="h-4 w-4 mr-2" />Conceder admin
            </DropdownMenuItem>
          )}
          <DropdownMenuSeparator />
          {user.is_active ? (
            <DropdownMenuItem
              disabled={isSelf}
              className="text-destructive focus:text-destructive"
              onSelect={() => setConfirm('deactivate')}
            >
              <UserX className="h-4 w-4 mr-2" />Desativar usuário
            </DropdownMenuItem>
          ) : (
            <DropdownMenuItem onSelect={() => setConfirm('reactivate')}>
              <UserCheck className="h-4 w-4 mr-2" />Reativar usuário
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      <UserProgressDialog user={user} open={progressOpen} onOpenChange={setProgressOpen} />

      <AlertDialog open={confirm !== null} onOpenChange={(open) => { if (!open) setConfirm(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{copy?.title}</AlertDialogTitle>
            <AlertDialogDescription>{copy?.description}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={pending !== null}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              disabled={pending !== null}
              onClick={(event) => {
                event.preventDefault();
                if (confirm) run(confirm);
              }}
            >
              {pending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              {copy?.confirm}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default UserActionsMenu;