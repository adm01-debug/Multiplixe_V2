import { useState } from 'react';
import { useMFA } from '@/hooks/useMFA';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Shield, Loader2, KeyRound } from 'lucide-react';

interface MFAVerifyProps {
  onSuccess: () => void;
  onCancel?: () => void;
}

const MFAVerify = ({ onSuccess, onCancel }: MFAVerifyProps) => {
  const { verifyMFACode } = useMFA();
  const [code, setCode] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [useBackupCode, setUseBackupCode] = useState(false);

  const handleVerify = async () => {
    if (code.length < 6) return;
    
    setVerifying(true);
    const success = await verifyMFACode(code);
    setVerifying(false);

    if (success) {
      onSuccess();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleVerify();
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-primary/5 p-4">
      <Card className="w-full max-w-md border-border/50 shadow-xl">
        <CardHeader className="text-center space-y-4">
          <div className="mx-auto w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center shadow-lg">
            <Shield className="h-8 w-8 text-primary-foreground" />
          </div>
          <CardTitle className="text-2xl font-bold">Verificação de Segurança</CardTitle>
          <CardDescription>
            {useBackupCode 
              ? 'Digite um de seus códigos de backup'
              : 'Digite o código do seu aplicativo autenticador'
            }
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Input
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, useBackupCode ? 8 : 6))}
              onKeyDown={handleKeyDown}
              placeholder={useBackupCode ? 'XXXXXXXX' : '000000'}
              className="text-center text-2xl tracking-widest font-mono h-14"
              maxLength={useBackupCode ? 8 : 6}
              autoFocus
            />
          </div>

          <Button 
            className="w-full" 
            onClick={handleVerify}
            disabled={code.length < 6 || verifying}
          >
            {verifying ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Verificando...
              </>
            ) : (
              'Verificar'
            )}
          </Button>

          <div className="flex flex-col gap-2">
            <Button 
              variant="ghost" 
              className="w-full text-sm"
              onClick={() => {
                setUseBackupCode(!useBackupCode);
                setCode('');
              }}
            >
              <KeyRound className="mr-2 h-4 w-4" />
              {useBackupCode ? 'Usar código do app' : 'Usar código de backup'}
            </Button>

            {onCancel && (
              <Button variant="outline" className="w-full" onClick={onCancel}>
                Cancelar
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default MFAVerify;
