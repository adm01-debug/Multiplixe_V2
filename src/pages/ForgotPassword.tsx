import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Mail, ArrowLeft, Loader2, Shield, Clock } from 'lucide-react';
import { z } from 'zod';

const emailSchema = z.string().email('Email inválido').endsWith('@promobrindes.com.br', 'Use seu email corporativo @promobrindes.com.br');

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validar email
    const validation = emailSchema.safeParse(email);
    if (!validation.success) {
      setError(validation.error.errors[0].message);
      return;
    }

    setLoading(true);

    try {
      // Get user info if exists
      const { data: profileData } = await supabase
        .from('profiles')
        .select('user_id, full_name')
        .eq('user_id', (await supabase.auth.getUser()).data.user?.id || '')
        .maybeSingle();

      // Create a password reset request that needs approval
      const { error: insertError } = await supabase
        .from('password_reset_requests')
        .insert({
          user_id: profileData?.user_id || '00000000-0000-0000-0000-000000000000',
          user_email: email,
          user_name: profileData?.full_name || null,
          reason: reason.trim() || null,
          ip_address: null, // Would need edge function to get real IP
          user_agent: navigator.userAgent,
        });

      if (insertError) throw insertError;

      setSent(true);
      toast({
        title: 'Solicitação enviada!',
        description: 'Aguarde a aprovação do administrador.',
      });
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Tente novamente mais tarde.';
      toast({
        title: 'Erro ao enviar solicitação',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Helmet>
        <title>Recuperar Senha | MULTIPLIXE</title>
        <meta name="description" content="Recupere sua senha da plataforma MULTIPLIXE" />
      </Helmet>

      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-primary/5 p-4">
        <div className="absolute inset-0 bg-grid-pattern opacity-5" />
        
        <Card className="w-full max-w-md relative z-10 border-border/50 shadow-xl">
          <CardHeader className="text-center space-y-4">
            <div className="mx-auto w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center shadow-lg">
              <Shield className="h-8 w-8 text-primary-foreground" />
            </div>
            <CardTitle className="text-2xl font-bold">Recuperar Senha</CardTitle>
            <CardDescription>
              {sent 
                ? 'Sua solicitação foi enviada para aprovação'
                : 'Solicite a redefinição de senha ao administrador'
              }
            </CardDescription>
          </CardHeader>

          <CardContent>
            {sent ? (
              <div className="text-center space-y-4">
                <div className="mx-auto w-16 h-16 rounded-full bg-amber-500/10 flex items-center justify-center">
                  <Clock className="h-8 w-8 text-amber-500" />
                </div>
                <div className="space-y-2">
                  <p className="font-medium text-foreground">Aguardando Aprovação</p>
                  <p className="text-sm text-muted-foreground">
                    Sua solicitação foi enviada para o administrador.
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Você receberá um email em <strong>{email}</strong> quando for aprovada.
                  </p>
                </div>
                <div className="p-3 rounded-lg bg-muted/50 text-xs text-muted-foreground">
                  <p>⏱️ Tempo médio de aprovação: até 24 horas</p>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email Corporativo</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="seu.nome@promobrindes.com.br"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="pl-10"
                      required
                    />
                  </div>
                  {error && <p className="text-sm text-destructive">{error}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="reason">Motivo (opcional)</Label>
                  <Textarea
                    id="reason"
                    placeholder="Ex: Esqueci minha senha, preciso acessar para concluir treinamento urgente..."
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    rows={3}
                  />
                  <p className="text-xs text-muted-foreground">
                    Informar o motivo pode agilizar a aprovação
                  </p>
                </div>

                <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
                  <p className="text-sm text-amber-600 dark:text-amber-400">
                    <strong>⚠️ Aprovação necessária:</strong> Por segurança, sua solicitação será analisada por um administrador antes do envio do link de reset.
                  </p>
                </div>

                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Enviando...
                    </>
                  ) : (
                    'Solicitar Redefinição de Senha'
                  )}
                </Button>
              </form>
            )}
          </CardContent>

          <CardFooter>
            <Link 
              to="/auth" 
              className="w-full flex items-center justify-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              Voltar para o login
            </Link>
          </CardFooter>
        </Card>
      </div>
    </>
  );
};

export default ForgotPassword;
