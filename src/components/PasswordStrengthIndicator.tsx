import { useState, useEffect } from 'react';
import { Check, X, Loader2, ShieldAlert, ShieldCheck } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PasswordStrengthIndicatorProps {
  password: string;
  onBreachCheck?: (isBreached: boolean | null) => void;
}

const PasswordStrengthIndicator = ({ password, onBreachCheck }: PasswordStrengthIndicatorProps) => {
  const [breachStatus, setBreachStatus] = useState<'idle' | 'checking' | 'safe' | 'breached'>('idle');

  const checks = [
    { label: 'Mínimo 8 caracteres', valid: password.length >= 8 },
    { label: 'Letra maiúscula', valid: /[A-Z]/.test(password) },
    { label: 'Letra minúscula', valid: /[a-z]/.test(password) },
    { label: 'Número', valid: /[0-9]/.test(password) },
    { label: 'Caractere especial (!@#$%...)', valid: /[!@#$%^&*(),.?":{}|<>_\-+=[\]\\;'`~]/.test(password) },
  ];

  const validCount = checks.filter(c => c.valid).length;
  const allChecksValid = validCount === checks.length;

  // Check for breached passwords using Have I Been Pwned API (k-anonymity)
  useEffect(() => {
    if (!password || password.length < 8 || !allChecksValid) {
      setBreachStatus('idle');
      onBreachCheck?.(null);
      return;
    }

    const checkBreach = async () => {
      setBreachStatus('checking');
      
      try {
        // Create SHA-1 hash of password
        const encoder = new TextEncoder();
        const data = encoder.encode(password);
        const hashBuffer = await crypto.subtle.digest('SHA-1', data);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('').toUpperCase();
        
        // Use k-anonymity: send only first 5 chars of hash
        const prefix = hashHex.substring(0, 5);
        const suffix = hashHex.substring(5);
        
        const response = await fetch(`https://api.pwnedpasswords.com/range/${prefix}`);
        
        if (!response.ok) {
          setBreachStatus('idle');
          onBreachCheck?.(null);
          return;
        }
        
        const text = await response.text();
        const hashes = text.split('\n');
        
        // Check if our suffix is in the response
        const isBreached = hashes.some(line => {
          const [hashSuffix] = line.split(':');
          return hashSuffix.trim() === suffix;
        });
        
        setBreachStatus(isBreached ? 'breached' : 'safe');
        onBreachCheck?.(isBreached);
      } catch (error) {
        console.error('Error checking password breach:', error);
        setBreachStatus('idle');
        onBreachCheck?.(null);
      }
    };

    // Debounce the check
    const timer = setTimeout(checkBreach, 500);
    return () => clearTimeout(timer);
  }, [password, allChecksValid, onBreachCheck]);

  const getStrength = () => {
    if (validCount === 0) return { label: '', color: 'bg-muted', width: '0%' };
    if (validCount <= 2) return { label: 'Fraca', color: 'bg-destructive', width: '25%' };
    if (validCount <= 3) return { label: 'Regular', color: 'bg-warning', width: '50%' };
    if (validCount <= 4) return { label: 'Boa', color: 'bg-info', width: '75%' };
    if (breachStatus === 'breached') return { label: 'Comprometida', color: 'bg-destructive', width: '100%' };
    return { label: 'Forte', color: 'bg-success', width: '100%' };
  };

  const strength = getStrength();

  if (!password) return null;

  return (
    <div className="space-y-3 mt-2">
      {/* Progress bar */}
      <div className="space-y-1">
        <div className="flex justify-between text-xs">
          <span className="text-muted-foreground">Força da senha</span>
          <span className={cn(
            "font-medium",
            validCount <= 2 && "text-destructive",
            validCount === 3 && "text-warning",
            validCount === 4 && "text-info",
            validCount === 5 && breachStatus !== 'breached' && "text-success",
            breachStatus === 'breached' && "text-destructive"
          )}>
            {strength.label}
          </span>
        </div>
        <div className="h-1.5 bg-muted rounded-full overflow-hidden">
          <div 
            className={cn("h-full transition-all duration-300", strength.color)}
            style={{ width: strength.width }}
          />
        </div>
      </div>

      {/* Checklist */}
      <div className="grid grid-cols-2 gap-1.5">
        {checks.map((check, index) => (
          <div 
            key={index}
            className={cn(
              "flex items-center gap-1.5 text-xs transition-colors",
              check.valid ? "text-success" : "text-muted-foreground"
            )}
          >
            {check.valid ? (
              <Check className="h-3 w-3 flex-shrink-0" />
            ) : (
              <X className="h-3 w-3 flex-shrink-0" />
            )}
            <span>{check.label}</span>
          </div>
        ))}
      </div>

      {/* Breach check status */}
      {allChecksValid && (
        <div className={cn(
          "flex items-center gap-2 p-2.5 rounded-lg text-xs",
          breachStatus === 'checking' && "bg-muted/50 text-muted-foreground",
          breachStatus === 'safe' && "bg-success/10 text-success",
          breachStatus === 'breached' && "bg-destructive/10 text-destructive"
        )}>
          {breachStatus === 'checking' && (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Verificando em vazamentos conhecidos...</span>
            </>
          )}
          {breachStatus === 'safe' && (
            <>
              <ShieldCheck className="h-4 w-4" />
              <span>Senha não encontrada em vazamentos conhecidos</span>
            </>
          )}
          {breachStatus === 'breached' && (
            <>
              <ShieldAlert className="h-4 w-4" />
              <span>Esta senha foi exposta em vazamentos! Escolha outra.</span>
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default PasswordStrengthIndicator;
