import { Check, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PasswordStrengthIndicatorProps {
  password: string;
}

const PasswordStrengthIndicator = ({ password }: PasswordStrengthIndicatorProps) => {
  const checks = [
    { label: 'Mínimo 8 caracteres', valid: password.length >= 8 },
    { label: 'Letra maiúscula', valid: /[A-Z]/.test(password) },
    { label: 'Letra minúscula', valid: /[a-z]/.test(password) },
    { label: 'Número', valid: /[0-9]/.test(password) },
    { label: 'Caractere especial', valid: /[!@#$%^&*(),.?":{}|<>]/.test(password) },
  ];

  const validCount = checks.filter(c => c.valid).length;
  
  const getStrength = () => {
    if (validCount === 0) return { label: '', color: 'bg-muted', width: '0%' };
    if (validCount <= 2) return { label: 'Fraca', color: 'bg-destructive', width: '33%' };
    if (validCount <= 4) return { label: 'Média', color: 'bg-warning', width: '66%' };
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
            validCount > 2 && validCount <= 4 && "text-warning",
            validCount === 5 && "text-success"
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
              <Check className="h-3 w-3" />
            ) : (
              <X className="h-3 w-3" />
            )}
            <span>{check.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default PasswordStrengthIndicator;
