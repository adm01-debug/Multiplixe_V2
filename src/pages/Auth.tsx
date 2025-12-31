import { useState, useEffect, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { toast } from 'sonner';
import { z } from 'zod';
import PasswordStrengthIndicator from '@/components/PasswordStrengthIndicator';
import {
  GraduationCap, 
  Mail, 
  Lock, 
  User, 
  Loader2, 
  Sparkles, 
  ArrowRight,
  Rocket,
  Star,
  Zap,
  BookOpen,
  Trophy,
  Eye,
  EyeOff,
  ShieldAlert
} from 'lucide-react';

const emailSchema = z.string()
  .email('Email inválido')
  .refine(
    (email) => email.endsWith('@promobrindes.com.br'),
    'Apenas emails @promobrindes.com.br são permitidos'
  );

const passwordSchema = z.string()
  .min(8, 'A senha deve ter pelo menos 8 caracteres')
  .regex(/[A-Z]/, 'Deve conter letra maiúscula')
  .regex(/[a-z]/, 'Deve conter letra minúscula')
  .regex(/[0-9]/, 'Deve conter número')
  .regex(/[!@#$%^&*(),.?":{}|<>]/, 'Deve conter caractere especial');

const fullNameSchema = z.string()
  .min(2, 'Nome deve ter pelo menos 2 caracteres')
  .max(100, 'Nome muito longo');

const Auth = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading, signIn, signUp } = useAuth();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string; fullName?: string }>({});
  const [isSignUp, setIsSignUp] = useState(false);
  const [isPasswordBreached, setIsPasswordBreached] = useState<boolean | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [lockoutSeconds, setLockoutSeconds] = useState(0);
  const [attemptCount, setAttemptCount] = useState(0);

  useEffect(() => {
    if (user) {
      navigate('/dashboard');
    }
  }, [user, navigate]);

  // Countdown timer for lockout
  useEffect(() => {
    if (lockoutSeconds <= 0) return;
    
    const timer = setInterval(() => {
      setLockoutSeconds(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    
    return () => clearInterval(timer);
  }, [lockoutSeconds]);

  // Check lockout status when email changes
  const checkLockoutStatus = useCallback(async (emailToCheck: string) => {
    if (!emailToCheck || isSignUp) return;
    
    try {
      const { data, error } = await supabase.rpc('check_login_allowed', { 
        p_email: emailToCheck 
      });
      
      if (!error && data && data.length > 0) {
        const result = data[0];
        if (!result.is_allowed) {
          setLockoutSeconds(result.remaining_seconds);
          setAttemptCount(result.attempt_count);
        } else {
          setLockoutSeconds(0);
          setAttemptCount(result.attempt_count);
        }
      }
    } catch (err) {
      console.error('Error checking lockout status:', err);
    }
  }, [isSignUp]);

  // Debounce email check
  useEffect(() => {
    const timer = setTimeout(() => {
      if (email && !isSignUp) {
        checkLockoutStatus(email);
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [email, isSignUp, checkLockoutStatus]);

  const formatLockoutTime = (seconds: number): string => {
    if (seconds >= 60) {
      const mins = Math.floor(seconds / 60);
      const secs = seconds % 60;
      return `${mins}m ${secs}s`;
    }
    return `${seconds}s`;
  };

  const validateForm = (isSignUpMode: boolean) => {
    const newErrors: { email?: string; password?: string; fullName?: string } = {};
    
    const emailResult = emailSchema.safeParse(email);
    if (!emailResult.success) {
      newErrors.email = emailResult.error.errors[0].message;
    }
    
    const passwordResult = passwordSchema.safeParse(password);
    if (!passwordResult.success) {
      newErrors.password = passwordResult.error.errors[0].message;
    }
    
    if (isSignUpMode) {
      const nameResult = fullNameSchema.safeParse(fullName);
      if (!nameResult.success) {
        newErrors.fullName = nameResult.error.errors[0].message;
      }
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm(false)) return;
    
    // Check if currently locked out
    if (lockoutSeconds > 0) {
      toast.error(`Conta temporariamente bloqueada. Tente novamente em ${formatLockoutTime(lockoutSeconds)}.`);
      return;
    }
    
    setLoading(true);
    const { error } = await signIn(email, password);
    
    if (error) {
      // Record failed attempt
      try {
        const { data } = await supabase.rpc('record_failed_login', { 
          p_email: email,
          p_ip_address: null
        });
        
        if (data && data.length > 0) {
          const result = data[0];
          setAttemptCount(result.total_attempts);
          
          if (result.is_locked) {
            setLockoutSeconds(result.lockout_seconds);
            toast.error(`Muitas tentativas. Conta bloqueada por ${formatLockoutTime(result.lockout_seconds)}.`);
          } else if (result.total_attempts >= 3) {
            toast.error(`Email ou senha incorretos. ${5 - result.total_attempts} tentativas restantes.`);
          } else if (error.message.includes('Invalid login credentials')) {
            toast.error('Email ou senha incorretos');
          } else if (error.message.includes('Email not confirmed')) {
            toast.error('Por favor, confirme seu email antes de fazer login');
          } else {
            toast.error('Erro ao fazer login. Tente novamente.');
          }
        }
      } catch (err) {
        console.error('Error recording failed login:', err);
        toast.error('Erro ao fazer login. Tente novamente.');
      }
    } else {
      // Reset attempts on successful login
      try {
        await supabase.rpc('reset_login_attempts', { p_email: email });
      } catch (err) {
        console.error('Error resetting login attempts:', err);
      }
      toast.success('Bem-vindo(a) de volta!');
    }
    
    setLoading(false);
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm(true)) return;
    
    // Block if password is breached
    if (isPasswordBreached) {
      toast.error('Esta senha foi encontrada em vazamentos. Por favor, escolha outra senha.');
      return;
    }
    
    setLoading(true);
    const { error } = await signUp(email, password, fullName);
    setLoading(false);
    
    if (error) {
      if (error.message.includes('User already registered')) {
        toast.error('Este email já está cadastrado. Tente fazer login.');
      } else {
        toast.error('Erro ao criar conta. Tente novamente.');
      }
    } else {
      toast.success('Conta criada com sucesso! Bem-vindo(a) à MULTIPLIXE!');
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="relative">
            <div className="w-16 h-16 rounded-full bg-gradient-to-r from-primary to-secondary animate-spin-slow" />
            <div className="absolute inset-2 bg-background rounded-full" />
            <Loader2 className="absolute inset-0 m-auto h-6 w-6 animate-spin text-primary" />
          </div>
          <p className="text-muted-foreground font-medium animate-pulse">Carregando...</p>
        </div>
      </div>
    );
  }

  const features = [
    { icon: BookOpen, label: "Cursos exclusivos", color: "from-primary to-secondary" },
    { icon: Trophy, label: "Certificados", color: "from-amber-500 to-orange-500" },
    { icon: Rocket, label: "Evolua na carreira", color: "from-emerald-500 to-teal-500" },
  ];

  return (
    <div className="min-h-screen flex">
      {/* Left Panel - Decorative */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden">
        {/* Background gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary via-secondary to-accent" />
        
        {/* Mesh pattern */}
        <div className="absolute inset-0" style={{ backgroundImage: 'var(--gradient-mesh)', opacity: 0.3 }} />
        
        {/* Decorative circles */}
        <div className="absolute top-20 left-20 w-72 h-72 bg-white/10 rounded-full blur-3xl" />
        <div className="absolute bottom-20 right-20 w-96 h-96 bg-white/10 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/3 w-48 h-48 bg-white/5 rounded-full blur-2xl" />

        {/* Floating icons */}
        <div className="absolute top-24 right-24 w-14 h-14 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center animate-bounce-subtle">
          <Star className="h-7 w-7 text-white" />
        </div>
        <div className="absolute top-40 left-32 w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center animate-bounce-subtle" style={{ animationDelay: '0.3s' }}>
          <Zap className="h-6 w-6 text-white" />
        </div>
        <div className="absolute bottom-40 left-24 w-16 h-16 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center animate-bounce-subtle" style={{ animationDelay: '0.6s' }}>
          <Rocket className="h-8 w-8 text-white" />
        </div>

        {/* Content */}
        <div className="relative z-10 flex flex-col justify-center p-12 xl:p-20">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-3 mb-12">
            <div className="p-3 bg-white/20 backdrop-blur-sm rounded-2xl">
              <GraduationCap className="h-10 w-10 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-display font-bold text-white">MULTIPLIXE</h1>
              <p className="text-sm text-white/70">by Promo Brindes</p>
            </div>
          </Link>

          <h2 className="text-4xl xl:text-5xl font-display font-bold text-white mb-6 leading-tight">
            Desenvolva suas <br />
            <span className="text-white/90">habilidades</span> e <br />
            <span className="relative">
              cresça conosco
              <svg className="absolute -bottom-2 left-0 w-full" viewBox="0 0 200 12" fill="none">
                <path d="M2 10C50 4 150 4 198 10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" className="text-white/40" />
              </svg>
            </span>
          </h2>
          
          <p className="text-lg text-white/80 mb-10 max-w-md leading-relaxed">
            Plataforma exclusiva de treinamento para colaboradores Promo Brindes. Aprenda, evolua e alcance novos patamares.
          </p>

          {/* Features */}
          <div className="flex flex-wrap gap-3">
            {features.map((feature, index) => (
              <div 
                key={index} 
                className="flex items-center gap-2 px-4 py-2.5 bg-white/10 backdrop-blur-sm rounded-full"
              >
                <feature.icon className="h-5 w-5 text-white" />
                <span className="text-sm font-medium text-white">{feature.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right Panel - Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-12">
        <div className="w-full max-w-md">
          {/* Mobile Logo */}
          <div className="lg:hidden text-center mb-10">
            <Link to="/" className="inline-flex items-center gap-3 mb-4">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-primary to-secondary rounded-2xl blur-lg opacity-50" />
                <div className="relative p-3 bg-gradient-to-r from-primary to-secondary rounded-2xl">
                  <GraduationCap className="h-8 w-8 text-white" />
                </div>
              </div>
              <div className="text-left">
                <h1 className="text-xl font-display font-bold text-foreground">MULTIPLIXE</h1>
                <p className="text-xs text-muted-foreground">by Promo Brindes</p>
              </div>
            </Link>
          </div>

          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 rounded-full mb-6">
              <Sparkles className="h-4 w-4 text-primary" />
              <span className="text-sm font-semibold text-primary">
                {isSignUp ? 'Crie sua conta' : 'Bem-vindo de volta'}
              </span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-display font-bold text-foreground mb-2">
              {isSignUp ? 'Junte-se a nós' : 'Acesse sua conta'}
            </h2>
            <p className="text-muted-foreground">
              {isSignUp 
                ? 'Comece sua jornada de aprendizado hoje' 
                : 'Continue sua jornada de aprendizado'}
            </p>
          </div>

          {/* Tab Toggle */}
          <div className="flex p-1.5 bg-muted/50 rounded-2xl mb-8">
            <button
              onClick={() => setIsSignUp(false)}
              className={`flex-1 py-3 px-4 rounded-xl text-sm font-semibold transition-all duration-300 ${
                !isSignUp 
                  ? 'bg-card shadow-md text-foreground' 
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Entrar
            </button>
            <button
              onClick={() => setIsSignUp(true)}
              className={`flex-1 py-3 px-4 rounded-xl text-sm font-semibold transition-all duration-300 ${
                isSignUp 
                  ? 'bg-card shadow-md text-foreground' 
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Cadastrar
            </button>
          </div>

          {/* Lockout Alert */}
          {!isSignUp && lockoutSeconds > 0 && (
            <Alert variant="destructive" className="mb-6">
              <ShieldAlert className="h-4 w-4" />
              <AlertDescription className="ml-2">
                <span className="font-medium">Conta temporariamente bloqueada.</span>
                <br />
                Muitas tentativas de login falhadas. Tente novamente em{' '}
                <span className="font-bold">{formatLockoutTime(lockoutSeconds)}</span>.
              </AlertDescription>
            </Alert>
          )}

          {/* Attempts Warning */}
          {!isSignUp && attemptCount >= 3 && attemptCount < 5 && lockoutSeconds === 0 && (
            <Alert variant="default" className="mb-6 border-warning bg-warning/10">
              <ShieldAlert className="h-4 w-4 text-warning" />
              <AlertDescription className="ml-2 text-warning">
                Atenção: {5 - attemptCount} tentativas restantes antes do bloqueio temporário.
              </AlertDescription>
            </Alert>
          )}

          {/* Form */}
          <form onSubmit={isSignUp ? handleSignUp : handleSignIn} className="space-y-5">
            {/* Full Name - Only for signup */}
            {isSignUp && (
              <div className="space-y-2 animate-fade-in">
                <Label htmlFor="fullName" className="text-foreground font-medium">
                  Nome completo
                </Label>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                  <Input
                    id="fullName"
                    type="text"
                    placeholder="Seu nome completo"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="h-12 pl-12 rounded-xl border-border/50 bg-muted/30 focus:bg-card transition-colors"
                  />
                </div>
                {errors.fullName && (
                  <p className="text-sm text-destructive flex items-center gap-1">
                    <span className="inline-block w-1 h-1 rounded-full bg-destructive" />
                    {errors.fullName}
                  </p>
                )}
              </div>
            )}

            {/* Email */}
            <div className="space-y-2">
              <Label htmlFor="email" className="text-foreground font-medium">
                Email corporativo
              </Label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  placeholder="seu.nome@promobrindes.com.br"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="h-12 pl-12 rounded-xl border-border/50 bg-muted/30 focus:bg-card transition-colors"
                />
              </div>
              {errors.email && (
                <p className="text-sm text-destructive flex items-center gap-1">
                  <span className="inline-block w-1 h-1 rounded-full bg-destructive" />
                  {errors.email}
                </p>
              )}
            </div>

            {/* Password */}
            <div className="space-y-2">
              <Label htmlFor="password" className="text-foreground font-medium">
                Senha
              </Label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder={isSignUp ? "Crie uma senha forte" : "••••••••"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="h-12 pl-12 pr-12 rounded-xl border-border/50 bg-muted/30 focus:bg-card transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5" />
                  ) : (
                    <Eye className="h-5 w-5" />
                  )}
                </button>
              </div>
              {isSignUp && <PasswordStrengthIndicator password={password} onBreachCheck={setIsPasswordBreached} />}
              {errors.password && (
                <p className="text-sm text-destructive flex items-center gap-1">
                  <span className="inline-block w-1 h-1 rounded-full bg-destructive" />
                  {errors.password}
                </p>
              )}
            </div>

            {/* Forgot Password Link */}
            {!isSignUp && (
              <div className="text-center">
                <Link 
                  to="/forgot-password" 
                  className="text-sm text-primary hover:text-primary/80 hover:underline transition-colors"
                >
                  Esqueceu sua senha?
                </Link>
              </div>
            )}
            <Button 
              type="submit" 
              disabled={loading}
              className="w-full h-12 btn-gradient rounded-xl text-base font-semibold gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  {isSignUp ? 'Criando conta...' : 'Entrando...'}
                </>
              ) : (
                <>
                  {isSignUp ? 'Criar conta' : 'Entrar'}
                  <ArrowRight className="h-5 w-5" />
                </>
              )}
            </Button>
          </form>

          {/* Footer */}
          <p className="text-center text-sm text-muted-foreground mt-8">
            Plataforma exclusiva para colaboradores{' '}
            <span className="font-semibold text-foreground">Promo Brindes</span>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Auth;
