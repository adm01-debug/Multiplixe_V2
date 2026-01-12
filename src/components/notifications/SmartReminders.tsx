import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Bell,
  Clock,
  Flame,
  BookOpen,
  X,
  Calendar,
  Target,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";

interface ReminderSettings {
  studyReminder: boolean;
  studyTime: string;
  streakReminder: boolean;
  streakTime: string;
  weeklyGoalReminder: boolean;
  newCourseReminder: boolean;
}

const defaultSettings: ReminderSettings = {
  studyReminder: true,
  studyTime: "19:00",
  streakReminder: true,
  streakTime: "21:00",
  weeklyGoalReminder: true,
  newCourseReminder: true,
};

const timeOptions = [
  "06:00", "07:00", "08:00", "09:00", "10:00", "11:00",
  "12:00", "13:00", "14:00", "15:00", "16:00", "17:00",
  "18:00", "19:00", "20:00", "21:00", "22:00", "23:00",
];

const SmartReminders = () => {
  const { user } = useAuth();
  const [settings, setSettings] = useState<ReminderSettings>(defaultSettings);
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    if (!user) return;

    // Load saved settings from localStorage
    const saved = localStorage.getItem(`reminder_settings_${user.id}`);
    if (saved) {
      try {
        setSettings(JSON.parse(saved));
      } catch (e) {
        console.error("Error parsing reminder settings:", e);
      }
    }
  }, [user]);

  const updateSetting = <K extends keyof ReminderSettings>(
    key: K,
    value: ReminderSettings[K]
  ) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
    setHasChanges(true);
  };

  const saveSettings = () => {
    if (!user) return;

    localStorage.setItem(
      `reminder_settings_${user.id}`,
      JSON.stringify(settings)
    );
    setHasChanges(false);
    toast.success("Configurações de lembretes salvas!");
  };

  const requestNotificationPermission = async () => {
    if (!("Notification" in window)) {
      toast.error("Seu navegador não suporta notificações");
      return;
    }

    if (Notification.permission === "granted") {
      toast.success("Notificações já estão ativadas!");
      return;
    }

    const permission = await Notification.requestPermission();
    if (permission === "granted") {
      toast.success("Notificações ativadas!");
    } else {
      toast.error("Permissão de notificações negada");
    }
  };

  const reminderConfig = [
    {
      id: "study",
      title: "Lembrete de Estudo",
      description: "Receba um lembrete diário para estudar",
      icon: BookOpen,
      gradient: "from-primary to-accent",
      enabledKey: "studyReminder" as keyof ReminderSettings,
      timeKey: "studyTime" as keyof ReminderSettings,
    },
    {
      id: "streak",
      title: "Proteção de Streak",
      description: "Aviso antes de perder sua sequência",
      icon: Flame,
      gradient: "from-rose-500 to-orange-500",
      enabledKey: "streakReminder" as keyof ReminderSettings,
      timeKey: "streakTime" as keyof ReminderSettings,
    },
    {
      id: "weekly",
      title: "Metas Semanais",
      description: "Lembrete sobre suas metas da semana",
      icon: Target,
      gradient: "from-emerald-500 to-teal-500",
      enabledKey: "weeklyGoalReminder" as keyof ReminderSettings,
    },
    {
      id: "newCourse",
      title: "Novos Cursos",
      description: "Notificação quando novos cursos são lançados",
      icon: Sparkles,
      gradient: "from-amber-500 to-yellow-500",
      enabledKey: "newCourseReminder" as keyof ReminderSettings,
    },
  ];

  return (
    <Card className="border-border/50">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-gradient-to-br from-primary/10 to-accent/10">
              <Bell className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-lg">Lembretes Inteligentes</CardTitle>
              <p className="text-sm text-muted-foreground">
                Configure seus lembretes de estudo
              </p>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={requestNotificationPermission}
            className="gap-2"
          >
            <Bell className="h-4 w-4" />
            Ativar Notificações
          </Button>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {reminderConfig.map((reminder, index) => {
          const Icon = reminder.icon;
          const isEnabled = settings[reminder.enabledKey] as boolean;

          return (
            <motion.div
              key={reminder.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className={`p-4 rounded-xl border transition-all ${
                isEnabled
                  ? "border-primary/30 bg-primary/5"
                  : "border-border/50 bg-background"
              }`}
            >
              <div className="flex items-start gap-4">
                {/* Icon */}
                <div
                  className={`w-11 h-11 rounded-xl flex items-center justify-center bg-gradient-to-br ${reminder.gradient} shrink-0`}
                >
                  <Icon className="h-5 w-5 text-white" />
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <h4 className="font-medium text-foreground">
                      {reminder.title}
                    </h4>
                    <Switch
                      checked={isEnabled}
                      onCheckedChange={(checked) =>
                        updateSetting(reminder.enabledKey, checked)
                      }
                    />
                  </div>
                  <p className="text-sm text-muted-foreground mb-3">
                    {reminder.description}
                  </p>

                  {/* Time selector */}
                  {reminder.timeKey && isEnabled && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="flex items-center gap-3"
                    >
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <Select
                        value={settings[reminder.timeKey] as string}
                        onValueChange={(value) =>
                          updateSetting(reminder.timeKey!, value)
                        }
                      >
                        <SelectTrigger className="w-[120px] h-9">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {timeOptions.map((time) => (
                            <SelectItem key={time} value={time}>
                              {time}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </motion.div>
                  )}
                </div>
              </div>
            </motion.div>
          );
        })}

        {/* Save button */}
        <AnimatePresence>
          {hasChanges && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
            >
              <Button onClick={saveSettings} className="w-full gap-2">
                Salvar Configurações
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </CardContent>
    </Card>
  );
};

export default SmartReminders;
