import { useNotificationPreferences } from '@/hooks/useNotificationPreferences';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Loader2 } from 'lucide-react';

export function NotificationPreferences() {
  const { preferences, isLoading, updatePreferences, isUpdating } = useNotificationPreferences();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Canais de Notificação</CardTitle>
          <CardDescription>
            Escolha como você deseja receber notificações
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <Label htmlFor="email">E-mail</Label>
            <Switch
              id="email"
              checked={preferences?.email_enabled ?? true}
              onCheckedChange={(checked) =>
                updatePreferences({ email_enabled: checked })
              }
              disabled={isUpdating}
            />
          </div>
          
          <div className="flex items-center justify-between">
            <Label htmlFor="push">Push Notifications</Label>
            <Switch
              id="push"
              checked={preferences?.push_enabled ?? true}
              onCheckedChange={(checked) =>
                updatePreferences({ push_enabled: checked })
              }
              disabled={isUpdating}
            />
          </div>
          
          <div className="flex items-center justify-between">
            <Label htmlFor="sms">SMS</Label>
            <Switch
              id="sms"
              checked={preferences?.sms_enabled ?? false}
              onCheckedChange={(checked) =>
                updatePreferences({ sms_enabled: checked })
              }
              disabled={isUpdating}
            />
          </div>
          
          <div className="flex items-center justify-between">
            <Label htmlFor="whatsapp">WhatsApp</Label>
            <Switch
              id="whatsapp"
              checked={preferences?.whatsapp_enabled ?? false}
              onCheckedChange={(checked) =>
                updatePreferences({ whatsapp_enabled: checked })
              }
              disabled={isUpdating}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Não Perturbe (DND)</CardTitle>
          <CardDescription>
            Configure horários em que não deseja receber notificações
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <Label htmlFor="dnd">Ativar DND</Label>
            <Switch
              id="dnd"
              checked={preferences?.dnd_enabled ?? false}
              onCheckedChange={(checked) =>
                updatePreferences({ dnd_enabled: checked })
              }
              disabled={isUpdating}
            />
          </div>
          
          {preferences?.dnd_enabled && (
            <div className="space-y-2">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label htmlFor="dnd-start">Início</Label>
                  <Input
                    id="dnd-start"
                    type="time"
                    value={preferences?.dnd_start_time || '22:00'}
                    onChange={(e) =>
                      updatePreferences({ dnd_start_time: e.target.value })
                    }
                    disabled={isUpdating}
                  />
                </div>
                <div>
                  <Label htmlFor="dnd-end">Fim</Label>
                  <Input
                    id="dnd-end"
                    type="time"
                    value={preferences?.dnd_end_time || '08:00'}
                    onChange={(e) =>
                      updatePreferences({ dnd_end_time: e.target.value })
                    }
                    disabled={isUpdating}
                  />
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Resumo Diário (Digest)</CardTitle>
          <CardDescription>
            Receba um resumo das notificações em um único e-mail
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <Label htmlFor="digest">Ativar Digest</Label>
            <Switch
              id="digest"
              checked={preferences?.digest_enabled ?? false}
              onCheckedChange={(checked) =>
                updatePreferences({ digest_enabled: checked })
              }
              disabled={isUpdating}
            />
          </div>
          
          {preferences?.digest_enabled && (
            <div>
              <Label htmlFor="digest-time">Horário</Label>
              <Input
                id="digest-time"
                type="time"
                value={preferences?.digest_time || '09:00'}
                onChange={(e) =>
                  updatePreferences({ digest_time: e.target.value })
                }
                disabled={isUpdating}
              />
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Contatos</CardTitle>
          <CardDescription>
            Configure seus números para receber SMS e WhatsApp
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="phone">Telefone (SMS)</Label>
            <Input
              id="phone"
              type="tel"
              placeholder="+55 11 99999-9999"
              value={preferences?.phone_number || ''}
              onChange={(e) =>
                updatePreferences({ phone_number: e.target.value })
              }
              disabled={isUpdating}
            />
          </div>
          
          <div>
            <Label htmlFor="whatsapp-number">WhatsApp</Label>
            <Input
              id="whatsapp-number"
              type="tel"
              placeholder="+55 11 99999-9999"
              value={preferences?.whatsapp_number || ''}
              onChange={(e) =>
                updatePreferences({ whatsapp_number: e.target.value })
              }
              disabled={isUpdating}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Agrupamento</CardTitle>
          <CardDescription>
            Agrupe notificações similares para reduzir volume
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <Label htmlFor="grouping">Ativar Agrupamento</Label>
            <Switch
              id="grouping"
              checked={preferences?.grouping_enabled ?? true}
              onCheckedChange={(checked) =>
                updatePreferences({ grouping_enabled: checked })
              }
              disabled={isUpdating}
            />
          </div>
          
          {preferences?.grouping_enabled && (
            <div>
              <Label htmlFor="grouping-window">Janela (minutos)</Label>
              <Input
                id="grouping-window"
                type="number"
                min="1"
                max="60"
                value={preferences?.grouping_window_minutes || 5}
                onChange={(e) =>
                  updatePreferences({ grouping_window_minutes: parseInt(e.target.value) })
                }
                disabled={isUpdating}
              />
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
