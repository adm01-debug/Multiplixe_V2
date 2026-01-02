import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface PushSubscriptionState {
  isSupported: boolean;
  isSubscribed: boolean;
  isLoading: boolean;
  permission: NotificationPermission;
}

export function usePushNotifications() {
  const [state, setState] = useState<PushSubscriptionState>({
    isSupported: false,
    isSubscribed: false,
    isLoading: true,
    permission: 'default',
  });

  useEffect(() => {
    checkPushSupport();
  }, []);

  const checkPushSupport = async () => {
    if (!('Notification' in window)) {
      setState(prev => ({ ...prev, isSupported: false, isLoading: false }));
      return;
    }

    if (!('serviceWorker' in navigator)) {
      setState(prev => ({ ...prev, isSupported: false, isLoading: false }));
      return;
    }

    setState(prev => ({ 
      ...prev, 
      isSupported: true, 
      permission: Notification.permission 
    }));

    // Verificar se já está subscrito
    const subscription = await getExistingSubscription();
    setState(prev => ({ 
      ...prev, 
      isSubscribed: !!subscription,
      isLoading: false 
    }));
  };

  const getExistingSubscription = async () => {
    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();
      return subscription;
    } catch (error) {
      console.error('Error checking subscription:', error);
      return null;
    }
  };

  const requestPermission = async () => {
    if (!state.isSupported) {
      toast.error('Push notifications não suportadas neste navegador');
      return false;
    }

    setState(prev => ({ ...prev, isLoading: true }));

    try {
      const permission = await Notification.requestPermission();
      setState(prev => ({ ...prev, permission }));

      if (permission !== 'granted') {
        toast.error('Permissão para notificações negada');
        setState(prev => ({ ...prev, isLoading: false }));
        return false;
      }

      toast.success('Permissão concedida!');
      return true;
    } catch (error) {
      console.error('Error requesting permission:', error);
      toast.error('Erro ao solicitar permissão');
      setState(prev => ({ ...prev, isLoading: false }));
      return false;
    }
  };

  const subscribe = async () => {
    if (!state.isSupported) {
      toast.error('Push notifications não suportadas');
      return null;
    }

    if (state.permission !== 'granted') {
      const granted = await requestPermission();
      if (!granted) return null;
    }

    setState(prev => ({ ...prev, isLoading: true }));

    try {
      // Registrar Service Worker
      const registration = await navigator.serviceWorker.register('/sw.js', {
        scope: '/',
      });

      await navigator.serviceWorker.ready;

      // Criar subscription
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(
          import.meta.env.VITE_VAPID_PUBLIC_KEY || ''
        ),
      });

      // Salvar no banco
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error('User not authenticated');
      }

      const { error } = await supabase
        .from('push_subscriptions')
        .upsert({
          user_id: user.id,
          subscription: JSON.stringify(subscription.toJSON()),
          endpoint: subscription.endpoint,
          created_at: new Date().toISOString(),
        }, {
          onConflict: 'user_id',
        });

      if (error) throw error;

      setState(prev => ({ 
        ...prev, 
        isSubscribed: true,
        isLoading: false 
      }));

      toast.success('Push notifications ativadas!');
      return subscription;

    } catch (error) {
      console.error('Error subscribing:', error);
      toast.error('Erro ao ativar push notifications');
      setState(prev => ({ ...prev, isLoading: false }));
      return null;
    }
  };

  const unsubscribe = async () => {
    setState(prev => ({ ...prev, isLoading: true }));

    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();

      if (subscription) {
        await subscription.unsubscribe();
      }

      // Remover do banco
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user) {
        await supabase
          .from('push_subscriptions')
          .delete()
          .eq('user_id', user.id);
      }

      setState(prev => ({ 
        ...prev, 
        isSubscribed: false,
        isLoading: false 
      }));

      toast.success('Push notifications desativadas');
      return true;

    } catch (error) {
      console.error('Error unsubscribing:', error);
      toast.error('Erro ao desativar push notifications');
      setState(prev => ({ ...prev, isLoading: false }));
      return false;
    }
  };

  const testNotification = () => {
    if (state.permission !== 'granted') {
      toast.error('Permissão não concedida');
      return;
    }

    new Notification('🔔 Teste de Notificação', {
      body: 'Push notifications estão funcionando!',
      icon: '/icon-192.png',
      badge: '/badge-72.png',
      tag: 'test-notification',
    });
  };

  return {
    ...state,
    requestPermission,
    subscribe,
    unsubscribe,
    testNotification,
  };
}

// Helper: Converter VAPID key
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding)
    .replace(/\-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

// SQL Migration para push_subscriptions
export const pushSubscriptionsMigration = `
-- Tabela para armazenar subscriptions de push
CREATE TABLE IF NOT EXISTS push_subscriptions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  subscription JSONB NOT NULL,
  endpoint TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Index
CREATE INDEX idx_push_subscriptions_user_id ON push_subscriptions(user_id);
CREATE INDEX idx_push_subscriptions_endpoint ON push_subscriptions(endpoint);

-- RLS
ALTER TABLE push_subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own subscriptions"
  ON push_subscriptions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own subscriptions"
  ON push_subscriptions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own subscriptions"
  ON push_subscriptions FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own subscriptions"
  ON push_subscriptions FOR DELETE
  USING (auth.uid() = user_id);
`;
