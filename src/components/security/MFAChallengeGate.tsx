import { useCallback, useEffect, useState, type FormEvent, type ReactNode } from 'react';
import { Loader2, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useMFA } from '@/hooks/useMFA';
import { codigoBackupValido } from '@/lib/backupCodes';
import { codigoTotpValido, precisaSegundoFator } from '@/lib/mfaGate';

interface Props {
  children: ReactNode;
}

/**
 * Bloqueia o app quando a conta tem 2FA ativado e a sessão ainda está em aal1
 * (só senha). Sem este gate o TOTP seria decorativo: a sessão de senha já
 * abriria todas as telas.
 *
 * Quem perdeu o autenticador entra com um código de backup (um por vez, o código
 * é consumido) e a liberação vale para a aba atual — fechar o navegador volta a
 * exigir o segundo fator.
 */
const MFAChallengeGate = ({ children }: Props) => {
  const { user, loading, signOut } = useAuth();
  const { consumeBackupCode } = useMFA();
  const [exigido, setExigido] = useState(false);
  const [checando, setChecando] = useState(true);
  const [modo, setModo] = useState<'totp' | 'backup'>('totp');
  const [codigo, setCodigo] = useState('');
  const [erro, setErro] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  const chaveBackup = user ? `mfa-backup-ok:${user.id}` : null;

  const avaliar = useCallback(async () => {
    const { data } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
    let liberadoPorBackup = false;
    try {
      liberadoPorBackup = !!chaveBackup && sessionStorage.getItem(chaveBackup) === '1';
    } catch {
      liberadoPorBackup = false;
    }
    setExigido(precisaSegundoFator(!!user, data?.currentLevel, data?.nextLevel) && !liberadoPorBackup);
    setChecando(false);
  }, [user, chaveBackup]);

  useEffect(() => {
    if (loading) return;
    void avaliar();
  }, [loading, avaliar]);

  useEffect(() => {
    // Dentro do callback do listener os métodos de auth travam: avaliar no próximo tick.
    const { data } = supabase.auth.onAuthStateChange(() => {
      setTimeout(() => {
        void avaliar();
      }, 0);
    });
    return () => data.subscription.unsubscribe();
  }, [avaliar]);

  const confirmar = async (evento: FormEvent) => {
    evento.preventDefault();
    if (!user) return;
    if (!codigoTotpValido(codigo)) {
      setErro('Digite os 6 dígitos do aplicativo autenticador.');
      return;
    }

    setEnviando(true);
    setErro(null);
    try {
      const { data: fatores } = await supabase.auth.mfa.listFactors();
      const fator = fatores?.totp?.find((f) => f.status === 'verified');
      if (!fator) {
        setErro('Nenhum autenticador verificado nesta conta.');
        return;
      }

      const { data: desafio, error: erroDesafio } = await supabase.auth.mfa.challenge({
        factorId: fator.id,
      });
      if (erroDesafio || !desafio) throw erroDesafio ?? new Error('challenge falhou');

      const { error: erroVerificacao } = await supabase.auth.mfa.verify({
        factorId: fator.id,
        challengeId: desafio.id,
        code: codigo.trim(),
      });
      if (erroVerificacao) throw erroVerificacao;

      await supabase
        .from('user_mfa_settings')
        .update({ last_mfa_at: new Date().toISOString() })
        .eq('user_id', user.id);

      setCodigo('');
      await avaliar();
    } catch {
      setErro('Código inválido ou expirado. Gere um novo código no aplicativo e tente novamente.');
    } finally {
      setEnviando(false);
    }
  };

  const confirmarBackup = async (evento: FormEvent) => {
    evento.preventDefault();
    if (!user) return;
    if (!codigoBackupValido(codigo)) {
      setErro('Digite um código de backup válido (8 caracteres).');
      return;
    }

    setEnviando(true);
    setErro(null);
    try {
      const consumiu = await consumeBackupCode(codigo);
      if (!consumiu) {
        setErro('Código de backup inválido ou já usado.');
        return;
      }

      try {
        if (chaveBackup) sessionStorage.setItem(chaveBackup, '1');
      } catch {
        // Sem sessionStorage a liberação vale só até o próximo recarregamento.
      }

      setCodigo('');
      await avaliar();
    } finally {
      setEnviando(false);
    }
  };

  if (loading || (user && checando)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!exigido) return <>{children}</>;

  const tamanhoMinimo = modo === 'totp' ? 6 : 8;

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
            <ShieldCheck className="h-6 w-6 text-primary" aria-hidden="true" />
          </div>
          <CardTitle>Verificação em duas etapas</CardTitle>
          <CardDescription>
            Sua conta usa autenticação de dois fatores. Informe os 6 dígitos do aplicativo autenticador para
            concluir o login.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={modo === 'totp' ? confirmar : confirmarBackup} className="space-y-4">
            {modo === 'totp' ? (
              <div className="flex justify-center">
                <InputOTP
                  maxLength={6}
                  value={codigo}
                  onChange={(valor) => {
                    setCodigo(valor);
                    setErro(null);
                  }}
                  disabled={enviando}
                  autoFocus
                >
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
            ) : (
              <Input
                value={codigo}
                onChange={(evento) => {
                  setCodigo(evento.target.value);
                  setErro(null);
                }}
                placeholder="XXXX-XXXX"
                aria-label="Código de backup"
                maxLength={9}
                disabled={enviando}
                autoFocus
                className="text-center tracking-widest"
              />
            )}
            {erro && (
              <p role="alert" className="text-center text-sm text-destructive">
                {erro}
              </p>
            )}
            <Button type="submit" className="w-full" disabled={enviando || codigo.trim().length < tamanhoMinimo}>
              {enviando && <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />}
              {modo === 'totp' ? 'Confirmar código' : 'Entrar com código de backup'}
            </Button>
            <Button
              type="button"
              variant="ghost"
              className="w-full"
              onClick={() => {
                setModo(modo === 'totp' ? 'backup' : 'totp');
                setCodigo('');
                setErro(null);
              }}
              disabled={enviando}
            >
              {modo === 'totp' ? 'Usar código de backup' : 'Voltar ao aplicativo autenticador'}
            </Button>
            <Button
              type="button"
              variant="ghost"
              className="w-full"
              onClick={() => {
                void signOut();
              }}
              disabled={enviando}
            >
              Sair da conta
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default MFAChallengeGate;