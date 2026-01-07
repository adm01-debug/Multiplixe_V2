import { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useMFA } from '@/hooks/useMFA';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import PushNotificationManager from '@/components/notifications/PushNotificationManager';
import { 
  Shield, 
  Smartphone, 
  Key, 
  ArrowLeft, 
  Loader2, 
  CheckCircle, 
  Copy, 
  RefreshCw,
  AlertTriangle,
  Lock,
  Bell
} from 'lucide-react';

const SecuritySettings = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const { 
    settings, 
    loading, 
    enrolling,
    enrollTOTP, 
    verifyTOTPEnrollment, 
    disableTOTP,
    generateBackupCodes 
  } = useMFA();

  const [showEnrollModal, setShowEnrollModal] = useState(false);
  const [enrollmentData, setEnrollmentData] = useState<any>(null);
  const [verificationCode, setVerificationCode] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [backupCodes, setBackupCodes] = useState<string[] | null>(null);
  const [showBackupCodes, setShowBackupCodes] = useState(false);
  const [disabling, setDisabling] = useState(false);

  const handleEnrollTOTP = async () => {
    const data = await enrollTOTP();
    if (data) {
      setEnrollmentData(data);
      setShowEnrollModal(true);
    }
  };

  const handleVerifyEnrollment = async () => {
    if (!enrollmentData || verificationCode.length !== 6) return;
    
    setVerifying(true);
    const success = await verifyTOTPEnrollment(enrollmentData.id, verificationCode);
    setVerifying(false);

    if (success) {
      setShowEnrollModal(false);
      setEnrollmentData(null);
      setVerificationCode('');
      
      // Gerar códigos de backup automaticamente
      const codes = await generateBackupCodes();
      if (codes) {
        setBackupCodes(codes);
        setShowBackupCodes(true);
      }
    }
  };

  const handleDisableTOTP = async () => {
    setDisabling(true);
    await disableTOTP();
    setDisabling(false);
  };

  const handleGenerateBackupCodes = async () => {
    const codes = await generateBackupCodes();
    if (codes) {
      setBackupCodes(codes);
      setShowBackupCodes(true);
    }
  };

  const copyBackupCodes = () => {
    if (backupCodes) {
      navigator.clipboard.writeText(backupCodes.join('\n'));
      toast({
        title: 'Códigos copiados!',
        description: 'Guarde-os em um local seguro.',
      });
    }
  };

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
        <title>Segurança | MULTIPLIXE</title>
        <meta name="description" content="Configure suas opções de segurança" />
      </Helmet>

      <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
        <div className="container max-w-4xl py-8 px-4">
          {/* Header */}
          <div className="flex items-center gap-4 mb-8">
            <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold">Segurança da Conta</h1>
              <p className="text-muted-foreground">Gerencie suas configurações de segurança</p>
            </div>
          </div>

          <Tabs defaultValue="mfa" className="space-y-6">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="mfa" className="gap-2">
                <Smartphone className="h-4 w-4" />
                2FA
              </TabsTrigger>
              <TabsTrigger value="notifications" className="gap-2">
                <Bell className="h-4 w-4" />
                Notificações
              </TabsTrigger>
              <TabsTrigger value="backup" className="gap-2">
                <Key className="h-4 w-4" />
                Backup
              </TabsTrigger>
            </TabsList>

            {/* MFA Tab */}
            <TabsContent value="mfa" className="space-y-4">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <CardTitle className="flex items-center gap-2">
                        <Shield className="h-5 w-5 text-primary" />
                        Autenticação de Dois Fatores (TOTP)
                      </CardTitle>
                      <CardDescription>
                        Use um aplicativo autenticador como Google Authenticator ou Authy
                      </CardDescription>
                    </div>
                    <Badge variant={settings?.totp_enabled ? 'default' : 'secondary'}>
                      {settings?.totp_enabled ? 'Ativado' : 'Desativado'}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {settings?.totp_enabled ? (
                    <div className="space-y-4">
                      <div className="flex items-center gap-3 p-4 rounded-lg bg-green-500/10 border border-green-500/20">
                        <CheckCircle className="h-5 w-5 text-green-500" />
                        <div>
                          <p className="font-medium text-green-500">2FA está ativo</p>
                          <p className="text-sm text-muted-foreground">
                            Sua conta está protegida com autenticação de dois fatores
                          </p>
                        </div>
                      </div>
                      
                      <Button 
                        variant="destructive" 
                        onClick={handleDisableTOTP}
                        disabled={disabling}
                      >
                        {disabling ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Desativando...
                          </>
                        ) : (
                          'Desativar 2FA'
                        )}
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="flex items-center gap-3 p-4 rounded-lg bg-amber-500/10 border border-amber-500/20">
                        <AlertTriangle className="h-5 w-5 text-amber-500" />
                        <div>
                          <p className="font-medium text-amber-500">Recomendado ativar</p>
                          <p className="text-sm text-muted-foreground">
                            Adicione uma camada extra de proteção à sua conta
                          </p>
                        </div>
                      </div>

                      <Button onClick={handleEnrollTOTP} disabled={enrolling}>
                        {enrolling ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Configurando...
                          </>
                        ) : (
                          <>
                            <Shield className="mr-2 h-4 w-4" />
                            Ativar 2FA
                          </>
                        )}
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Notifications Tab */}
            <TabsContent value="notifications" className="space-y-4">
              <PushNotificationManager />
            </TabsContent>

            {/* Backup Codes Tab */}
            <TabsContent value="backup" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Key className="h-5 w-5 text-primary" />
                    Códigos de Backup
                  </CardTitle>
                  <CardDescription>
                    Use estes códigos para acessar sua conta caso perca acesso ao autenticador
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {settings?.backup_codes && settings.backup_codes.length > 0 ? (
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-2 p-4 rounded-lg bg-muted font-mono text-sm">
                        {settings.backup_codes.map((code, index) => (
                          <div key={index} className="p-2 bg-background rounded">
                            {code}
                          </div>
                        ))}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Cada código pode ser usado apenas uma vez.
                      </p>
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      Nenhum código de backup gerado ainda.
                    </p>
                  )}

                  <Button 
                    variant="outline" 
                    onClick={handleGenerateBackupCodes}
                    className="gap-2"
                  >
                    <RefreshCw className="h-4 w-4" />
                    {settings?.backup_codes ? 'Regenerar Códigos' : 'Gerar Códigos'}
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* TOTP Enrollment Modal */}
      <Dialog open={showEnrollModal} onOpenChange={setShowEnrollModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Configurar Autenticador</DialogTitle>
            <DialogDescription>
              Escaneie o QR code com seu aplicativo autenticador
            </DialogDescription>
          </DialogHeader>

          {enrollmentData && (
            <div className="space-y-6">
              {/* QR Code */}
              <div className="flex justify-center p-4 bg-white rounded-lg">
                <img 
                  src={enrollmentData.totp.qr_code} 
                  alt="QR Code" 
                  className="w-48 h-48"
                />
              </div>

              {/* Manual entry */}
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">
                  Ou digite manualmente:
                </Label>
                <div className="flex gap-2">
                  <Input 
                    value={enrollmentData.totp.secret} 
                    readOnly 
                    className="font-mono text-xs"
                  />
                  <Button 
                    variant="outline" 
                    size="icon"
                    onClick={() => {
                      navigator.clipboard.writeText(enrollmentData.totp.secret);
                      toast({ title: 'Copiado!' });
                    }}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* Verification */}
              <div className="space-y-2">
                <Label htmlFor="code">Digite o código de 6 dígitos</Label>
                <Input
                  id="code"
                  value={verificationCode}
                  onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder="000000"
                  className="text-center text-2xl tracking-widest font-mono"
                  maxLength={6}
                />
              </div>

              <Button 
                className="w-full" 
                onClick={handleVerifyEnrollment}
                disabled={verificationCode.length !== 6 || verifying}
              >
                {verifying ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Verificando...
                  </>
                ) : (
                  'Verificar e Ativar'
                )}
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Backup Codes Modal */}
      <Dialog open={showBackupCodes} onOpenChange={setShowBackupCodes}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Key className="h-5 w-5" />
              Seus Códigos de Backup
            </DialogTitle>
            <DialogDescription>
              Guarde estes códigos em um local seguro. Você precisará deles se perder acesso ao autenticador.
            </DialogDescription>
          </DialogHeader>

          {backupCodes && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-2 p-4 rounded-lg bg-muted font-mono text-sm">
                {backupCodes.map((code, index) => (
                  <div key={index} className="p-2 bg-background rounded text-center">
                    {code}
                  </div>
                ))}
              </div>

              <div className="flex gap-2">
                <Button variant="outline" className="flex-1" onClick={copyBackupCodes}>
                  <Copy className="mr-2 h-4 w-4" />
                  Copiar Códigos
                </Button>
                <Button className="flex-1" onClick={() => setShowBackupCodes(false)}>
                  Entendi, Guardei
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};

export default SecuritySettings;
