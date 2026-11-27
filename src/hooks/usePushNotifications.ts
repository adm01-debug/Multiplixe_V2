import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from 'sonner';
import { inscricaoPushAtiva, inscreverParaPush, desinscreverDoPush, suportaPush } from '@/lib/pushSubscription';

interface SecurityAlert {
  id: string;
  alert_type: string;
  severity: string;
  title: string;
  description: string | null;
  created_at: string;
}

export const usePushNotifications = () => {
  const { user } = useAuth();
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [isSupported, setIsSupported] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);

  useEffect(() => {
    // Check if browser supports notifications
    const supported = suportaPush();
    setIsSupported(supported);
    
    if (supported) {
      setPermission(Notification.permission);
      void inscricaoPushAtiva().then(setIsSubscribed);
    }
  }, []);

  const requestPermission = useCallback(async (): Promise<boolean> => {
    if (!isSupported) {
      toast.error('Seu navegador não suporta notificações');
      return false;
    }

    try {
      const inscrito = await inscreverParaPush();
      const result = Notification.permission;
      setPermission(result);
      setIsSubscribed(inscrito);

      if (result === 'granted') {
        toast.success('Notificações ativadas com sucesso!');
        return true;
      } else if (result === 'denied') {
        toast.error('Permissão de notificações negada');
        return false;
      }
      return false;
    } catch {
      toast.error('Erro ao solicitar permissão de notificações');
      return false;
    }
  }, [isSupported, user]);

  const disableNotifications = useCallback(async (): Promise<boolean> => {
    const saiu = await desinscreverDoPush();
    if (saiu) {
      setIsSubscribed(false);
      toast.success('Notificações desativadas neste dispositivo');
    } else {
      toast.error('Não foi possível desativar as notificações');
    }
    return saiu;
  }, []);

  const showNotification = useCallback((title: string, options?: NotificationOptions) => {
    if (!isSupported || permission !== 'granted') {
      return;
    }

    try {
      const notification = new Notification(title, {
        icon: '/favicon.ico',
        badge: '/favicon.ico',
        tag: 'security-alert',
        requireInteraction: true,
        ...options
      });

      notification.onclick = () => {
        window.focus();
        notification.close();
        // Navigate to security dashboard
        window.location.href = '/seguranca';
      };

      // Auto close after 10 seconds
      setTimeout(() => notification.close(), 10000);
    } catch {
      // Silent fail for notification display
    }
  }, [isSupported, permission]);

  // Subscribe to real-time security alerts
  useEffect(() => {
    if (!user || permission !== 'granted') return;

    const channel = supabase
      .channel('security-alerts-realtime')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'security_alerts',
          filter: `user_id=eq.${user.id}`
        },
        (payload) => {
          const alert = payload.new as SecurityAlert;
          
          // Show browser notification
          showNotification(`🔔 ${alert.title}`, {
            body: alert.description || 'Novo alerta de segurança detectado',
            tag: `security-${alert.id}`,
            data: { alertId: alert.id }
          });

          // Also show toast for in-app notification
          toast.warning(alert.title, {
            description: alert.description || undefined,
            action: {
              label: 'Ver',
              onClick: () => window.location.href = '/seguranca'
            }
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, permission, showNotification]);

  return {
    isSupported,
    permission,
    requestPermission,
    showNotification,
    disableNotifications,
    isSubscribed,
    isEnabled: permission === 'granted' && isSubscribed
  };
};
