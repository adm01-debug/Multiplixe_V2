import { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Bell, 
  BellOff, 
  Check, 
  X, 
  Smartphone,
  Monitor,
  Shield,
  Zap,
  Trophy,
  Flame
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { usePushNotifications } from '@/hooks/usePushNotifications';
import { toast } from 'sonner';

interface NotificationPreference {
  id: string;
  label: string;
  description: string;
  icon: typeof Bell;
  enabled: boolean;
}

const PushNotificationManager = () => {
  const { isSupported, permission, requestPermission, isEnabled } = usePushNotifications();
  const [preferences, setPreferences] = useState<NotificationPreference[]>([
    { 
      id: 'security', 
      label: 'Alertas de Segurança', 
      description: 'Novos dispositivos, tentativas de login',
      icon: Shield,
      enabled: true 
    },
    { 
      id: 'achievements', 
      label: 'Conquistas', 
      description: 'Quando desbloquear novas conquistas',
      icon: Trophy,
      enabled: true 
    },
    { 
      id: 'streaks', 
      label: 'Lembretes de Streak', 
      description: 'Antes de perder sua sequência',
      icon: Flame,
      enabled: true 
    },
    { 
      id: 'courses', 
      label: 'Novos Cursos', 
      description: 'Quando novos cursos forem lançados',
      icon: Zap,
      enabled: false 
    },
  ]);

  const handleTogglePreference = (id: string) => {
    setPreferences(prev => 
      prev.map(pref => 
        pref.id === id ? { ...pref, enabled: !pref.enabled } : pref
      )
    );
    
    // Save to localStorage
    const updated = preferences.find(p => p.id === id);
    if (updated) {
      localStorage.setItem(`notification_pref_${id}`, (!updated.enabled).toString());
      toast.success(`Preferência atualizada`);
    }
  };

  const handleEnableNotifications = async () => {
    const success = await requestPermission();
    if (success) {
      toast.success('Notificações ativadas!', {
        description: 'Você receberá alertas importantes no navegador',
      });
    }
  };

  if (!isSupported) {
    return (
      <div className="rounded-2xl border border-border bg-card/50 p-6">
        <div className="flex items-center gap-3 text-muted-foreground">
          <BellOff className="h-5 w-5" />
          <span className="text-sm">Seu navegador não suporta notificações push</span>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl border border-border bg-card/50 overflow-hidden"
    >
      {/* Header */}
      <div className="p-6 pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-gradient-to-br from-primary/10 to-accent/10 border border-primary/20">
              <Bell className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h3 className="font-display font-bold text-lg text-foreground">
                Notificações Push
              </h3>
              <p className="text-sm text-muted-foreground">
                Receba alertas em tempo real
              </p>
            </div>
          </div>

          {/* Status badge */}
          <div className={`
            flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium
            ${isEnabled 
              ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20' 
              : 'bg-muted text-muted-foreground border border-border'
            }
          `}>
            {isEnabled ? (
              <>
                <Check className="h-4 w-4" />
                <span>Ativadas</span>
              </>
            ) : (
              <>
                <BellOff className="h-4 w-4" />
                <span>Desativadas</span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Enable prompt or preferences */}
      {!isEnabled ? (
        <div className="px-6 pb-6">
          <div className="p-4 rounded-xl bg-primary/5 border border-primary/20 mb-4">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <Smartphone className="h-5 w-5 text-primary" />
              </div>
              <div className="flex-1">
                <p className="font-medium text-foreground mb-1">
                  Ative as notificações
                </p>
                <p className="text-sm text-muted-foreground mb-3">
                  Receba alertas de segurança, conquistas e lembretes diretamente no seu navegador
                </p>
                <Button 
                  onClick={handleEnableNotifications}
                  className="gap-2 bg-gradient-to-r from-primary to-accent"
                >
                  <Bell className="h-4 w-4" />
                  Ativar Notificações
                </Button>
              </div>
            </div>
          </div>

          {permission === 'denied' && (
            <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-sm text-destructive">
              <p className="font-medium">Notificações bloqueadas</p>
              <p className="text-xs mt-1">
                Para ativar, clique no ícone de cadeado na barra de endereço e permita notificações
              </p>
            </div>
          )}
        </div>
      ) : (
        <div className="px-6 pb-6 space-y-3">
          {preferences.map((pref) => {
            const Icon = pref.icon;
            return (
              <div
                key={pref.id}
                className="flex items-center justify-between p-4 rounded-xl bg-muted/30 border border-border/50"
              >
                <div className="flex items-center gap-3">
                  <div className={`
                    p-2 rounded-lg transition-colors
                    ${pref.enabled ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'}
                  `}>
                    <Icon className="h-4 w-4" />
                  </div>
                  <div>
                    <Label 
                      htmlFor={pref.id} 
                      className="font-medium text-foreground cursor-pointer"
                    >
                      {pref.label}
                    </Label>
                    <p className="text-xs text-muted-foreground">{pref.description}</p>
                  </div>
                </div>
                <Switch
                  id={pref.id}
                  checked={pref.enabled}
                  onCheckedChange={() => handleTogglePreference(pref.id)}
                />
              </div>
            );
          })}
        </div>
      )}

      {/* Device info */}
      {isEnabled && (
        <div className="px-6 pb-6">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Monitor className="h-3.5 w-3.5" />
            <span>Notificações ativas neste dispositivo</span>
          </div>
        </div>
      )}
    </motion.div>
  );
};

export default PushNotificationManager;
