import { useState } from 'react';
import { Fingerprint, Trash2, Loader2, Smartphone, Monitor, Key } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
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
import { usePasskeys, PasskeyCredential } from '@/hooks/usePasskeys';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const PasskeyManager = () => {
  const { 
    credentials, 
    loading, 
    isSupported, 
    isRegistering,
    registerPasskey, 
    removePasskey 
  } = usePasskeys();
  
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<PasskeyCredential | null>(null);

  const handleRegister = async () => {
    const success = await registerPasskey();
    if (success) {
      toast.success('Passkey registrada com sucesso!', {
        description: 'Agora você pode usar biometria para autenticação'
      });
    } else {
      toast.error('Erro ao registrar passkey', {
        description: 'Tente novamente ou verifique se seu dispositivo suporta'
      });
    }
  };

  const handleDelete = async () => {
    if (!confirmDelete) return;
    
    setDeletingId(confirmDelete.id);
    const success = await removePasskey(confirmDelete.id);
    
    if (success) {
      toast.success('Passkey removida com sucesso');
    } else {
      toast.error('Erro ao remover passkey');
    }
    
    setConfirmDelete(null);
    setDeletingId(null);
  };

  const getDeviceIcon = (type: string | null) => {
    switch (type) {
      case 'apple':
      case 'android':
        return <Smartphone className="h-5 w-5" />;
      case 'windows':
        return <Monitor className="h-5 w-5" />;
      default:
        return <Key className="h-5 w-5" />;
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin" />
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Fingerprint className="h-5 w-5" />
            Passkeys / Biometria
          </CardTitle>
          <CardDescription>
            Use impressão digital, Face ID ou Windows Hello para autenticação rápida e segura
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {!isSupported ? (
            <div className="text-center py-8 text-muted-foreground">
              <Fingerprint className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="font-medium">Biometria não disponível</p>
              <p className="text-sm">Seu dispositivo ou navegador não suporta WebAuthn/Passkeys</p>
            </div>
          ) : (
            <>
              {/* Register new passkey */}
              <div className="flex items-center justify-between p-4 rounded-lg border bg-primary/5">
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                    <Fingerprint className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold">Adicionar Passkey</h3>
                    <p className="text-sm text-muted-foreground">
                      Registre seu dispositivo para login biométrico
                    </p>
                  </div>
                </div>
                <Button onClick={handleRegister} disabled={isRegistering}>
                  {isRegistering ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Registrando...
                    </>
                  ) : (
                    'Registrar'
                  )}
                </Button>
              </div>

              {/* List of registered passkeys */}
              {credentials.length > 0 && (
                <div className="space-y-3">
                  <h4 className="font-medium text-sm text-muted-foreground">
                    Passkeys Registradas ({credentials.length})
                  </h4>
                  {credentials.map((credential) => (
                    <div 
                      key={credential.id} 
                      className="flex items-center justify-between p-4 rounded-lg border"
                    >
                      <div className="flex items-center gap-4">
                        {getDeviceIcon(credential.device_type)}
                        <div>
                          <p className="font-medium">{credential.device_name || 'Passkey'}</p>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <span>
                              Registrada {formatDistanceToNow(new Date(credential.created_at), { 
                                addSuffix: true, 
                                locale: ptBR 
                              })}
                            </span>
                            {credential.last_used_at && (
                              <>
                                <span>•</span>
                                <span>
                                  Último uso {formatDistanceToNow(new Date(credential.last_used_at), { 
                                    addSuffix: true, 
                                    locale: ptBR 
                                  })}
                                </span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary" className="text-xs">
                          {credential.device_type || 'passkey'}
                        </Badge>
                        <Button 
                          variant="ghost" 
                          size="icon" aria-label="Remover passkey"
                          onClick={() => setConfirmDelete(credential)}
                          disabled={deletingId === credential.id}
                        >
                          {deletingId === credential.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Trash2 className="h-4 w-4 text-destructive" />
                          )}
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {credentials.length === 0 && (
                <div className="text-center py-6 text-muted-foreground">
                  <p className="text-sm">Nenhuma passkey registrada ainda</p>
                  <p className="text-xs mt-1">
                    Adicione uma passkey para login mais rápido e seguro
                  </p>
                </div>
              )}

              {/* Info box */}
              <div className="p-4 rounded-lg bg-muted/50 text-sm">
                <h4 className="font-semibold mb-2">💡 O que são Passkeys?</h4>
                <ul className="space-y-1 text-muted-foreground">
                  <li>• Método de login sem senha usando biometria</li>
                  <li>• Mais seguro que senhas tradicionais</li>
                  <li>• Funciona com Touch ID, Face ID, Windows Hello</li>
                  <li>• Suas credenciais nunca saem do dispositivo</li>
                </ul>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Delete confirmation dialog */}
      <AlertDialog open={!!confirmDelete} onOpenChange={() => setConfirmDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remover Passkey?</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja remover "{confirmDelete?.device_name || 'esta passkey'}"? 
              Você não poderá mais usar este dispositivo para autenticação biométrica.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">
              Remover
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default PasskeyManager;
