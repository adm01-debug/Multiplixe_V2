import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Key, Loader2, ShieldCheck, ShieldOff, RefreshCw } from 'lucide-react';
import { useMFA } from '@/hooks/useMFA';
import MFAEnrollmentDialog from './MFAEnrollmentDialog';
import { toast } from 'sonner';

const MFASettingsCard = () => {
  const { settings, loading, disableTOTP, generateBackupCodes, refetch } = useMFA();
  const [enrollOpen, setEnrollOpen] = useState(false);
  const [confirmDisableOpen, setConfirmDisableOpen] = useState(false);
  const [regenerating, setRegenerating] = useState(false);

  const enabled = !!settings?.totp_enabled;
  const backupCount = settings?.backup_codes?.length ?? 0;

  const handleDisable = async () => {
    await disableTOTP();
    setConfirmDisableOpen(false);
  };

  const handleRegenerate = async () => {
    setRegenerating(true);
    const codes = await generateBackupCodes();
    setRegenerating(false);
    if (codes) {
      const blob = new Blob(
        [`MULTIPLIXE - Códigos de Backup MFA\n\n${codes.join('\n')}\n`],
        { type: 'text/plain' }
      );
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'multiplixe-backup-codes.txt';
      a.click();
      URL.revokeObjectURL(url);
      toast.success('Novos códigos gerados e baixados');
    }
  };

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Key className="h-5 w-5" />
            Autenticação de Dois Fatores
          </CardTitle>
          <CardDescription>Proteja sua conta com uma camada extra de segurança</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <Loader2 className="h-6 w-6 animate-spin" />
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm">App autenticador (TOTP)</span>
                {enabled ? (
                  <Badge className="bg-green-500">
                    <ShieldCheck className="h-3 w-3 mr-1" />
                    Ativado
                  </Badge>
                ) : (
                  <Badge variant="outline">Desativado</Badge>
                )}
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm">Códigos de backup</span>
                {backupCount > 0 ? (
                  <Badge className="bg-green-500">{backupCount} disponíveis</Badge>
                ) : (
                  <Badge variant="outline">Nenhum</Badge>
                )}
              </div>

              <div className="flex flex-col gap-2 pt-2">
                {!enabled ? (
                  <Button onClick={() => setEnrollOpen(true)} className="w-full">
                    <ShieldCheck className="h-4 w-4 mr-2" />
                    Ativar 2FA
                  </Button>
                ) : (
                  <>
                    <Button
                      variant="outline"
                      onClick={handleRegenerate}
                      disabled={regenerating}
                      className="w-full"
                    >
                      {regenerating ? (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <RefreshCw className="h-4 w-4 mr-2" />
                      )}
                      Gerar novos códigos de backup
                    </Button>
                    <Button
                      variant="destructive"
                      onClick={() => setConfirmDisableOpen(true)}
                      className="w-full"
                    >
                      <ShieldOff className="h-4 w-4 mr-2" />
                      Desativar 2FA
                    </Button>
                  </>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <MFAEnrollmentDialog
        open={enrollOpen}
        onOpenChange={setEnrollOpen}
        onEnrolled={refetch}
      />

      <AlertDialog open={confirmDisableOpen} onOpenChange={setConfirmDisableOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Desativar 2FA?</AlertDialogTitle>
            <AlertDialogDescription>
              Sua conta ficará menos segura sem autenticação de dois fatores. Você pode reativar a qualquer momento.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDisable}>Desativar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default MFASettingsCard;
