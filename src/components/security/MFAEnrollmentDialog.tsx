import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp';
import { Loader2, ShieldCheck, Download, Copy, Check } from 'lucide-react';
import { useMFA } from '@/hooks/useMFA';
import { toast } from 'sonner';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onEnrolled?: () => void;
}

type Step = 'intro' | 'qr' | 'verify' | 'backup';

interface EnrollData {
  id: string;
  totp: { qr_code: string; secret: string; uri: string };
}

const MFAEnrollmentDialog = ({ open, onOpenChange, onEnrolled }: Props) => {
  const { enrollTOTP, verifyTOTPEnrollment, generateBackupCodes, enrolling } = useMFA();
  const [step, setStep] = useState<Step>('intro');
  const [enrollData, setEnrollData] = useState<EnrollData | null>(null);
  const [code, setCode] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!open) {
      setStep('intro');
      setEnrollData(null);
      setCode('');
      setBackupCodes([]);
      setCopied(false);
    }
  }, [open]);

  const handleStart = async () => {
    const data = await enrollTOTP();
    if (data && 'totp' in data) {
      setEnrollData(data as EnrollData);
      setStep('qr');
    }
  };

  const handleVerify = async () => {
    if (!enrollData || code.length !== 6) return;
    setVerifying(true);
    const ok = await verifyTOTPEnrollment(enrollData.id, code);
    setVerifying(false);
    if (ok) {
      const codes = await generateBackupCodes();
      if (codes) {
        setBackupCodes(codes);
        setStep('backup');
      }
    }
  };

  const handleCopy = async () => {
    await navigator.clipboard.writeText(backupCodes.join('\n'));
    setCopied(true);
    toast.success('Códigos copiados');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const blob = new Blob(
      [`MULTIPLIXE - Códigos de Backup MFA\n\nGuarde estes códigos em local seguro. Cada um pode ser usado apenas uma vez.\n\n${backupCodes.join('\n')}\n`],
      { type: 'text/plain' }
    );
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'multiplixe-backup-codes.txt';
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleFinish = () => {
    onEnrolled?.();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-primary" />
            Ativar Autenticação de Dois Fatores
          </DialogTitle>
          <DialogDescription>
            {step === 'intro' && 'Adicione uma camada extra de segurança usando um app autenticador.'}
            {step === 'qr' && 'Escaneie o QR code com seu app autenticador.'}
            {step === 'verify' && 'Digite o código de 6 dígitos do seu app.'}
            {step === 'backup' && 'Salve estes códigos de backup em local seguro.'}
          </DialogDescription>
        </DialogHeader>

        {step === 'intro' && (
          <div className="space-y-4">
            <Alert>
              <AlertDescription>
                Use Google Authenticator, Authy, 1Password ou similar. Você precisará do app sempre que fizer login.
              </AlertDescription>
            </Alert>
            <Button onClick={handleStart} disabled={enrolling} className="w-full">
              {enrolling && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Continuar
            </Button>
          </div>
        )}

        {step === 'qr' && enrollData && (
          <div className="space-y-4">
            <div
              className="flex justify-center bg-white p-4 rounded-lg"
              dangerouslySetInnerHTML={{ __html: enrollData.totp.qr_code }}
            />
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Ou digite manualmente este código:</p>
              <code className="block p-2 bg-muted rounded text-xs break-all">{enrollData.totp.secret}</code>
            </div>
            <Button onClick={() => setStep('verify')} className="w-full">
              Já adicionei, continuar
            </Button>
          </div>
        )}

        {step === 'verify' && (
          <div className="space-y-4">
            <div className="flex justify-center">
              <InputOTP maxLength={6} value={code} onChange={setCode}>
                <InputOTPGroup>
                  <InputOTPSlot index={0} />
                  <InputOTPSlot index={1} />
                  <InputOTPSlot index={2} />
                  <InputOTPSlot index={3} />
                  <InputOTPSlot index={4} />
                  <InputOTPSlot index={5} />
                </InputOTPGroup>
              </InputOTP>
            </div>
            <Button onClick={handleVerify} disabled={verifying || code.length !== 6} className="w-full">
              {verifying && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Verificar e ativar
            </Button>
          </div>
        )}

        {step === 'backup' && (
          <div className="space-y-4">
            <Alert>
              <AlertDescription>
                Estes códigos permitem acesso se você perder seu app autenticador. Cada código só pode ser usado uma vez.
              </AlertDescription>
            </Alert>
            <div className="grid grid-cols-2 gap-2 p-4 bg-muted rounded-lg font-mono text-sm">
              {backupCodes.map((c) => (
                <div key={c} className="text-center">{c}</div>
              ))}
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={handleCopy} className="flex-1">
                {copied ? <Check className="h-4 w-4 mr-2" /> : <Copy className="h-4 w-4 mr-2" />}
                Copiar
              </Button>
              <Button variant="outline" onClick={handleDownload} className="flex-1">
                <Download className="h-4 w-4 mr-2" />
                Baixar
              </Button>
            </div>
            <DialogFooter>
              <Button onClick={handleFinish} className="w-full">Concluir</Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default MFAEnrollmentDialog;
