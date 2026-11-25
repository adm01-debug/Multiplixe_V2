import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Save, Loader2, Settings, Mail, Target, Zap } from 'lucide-react';
import { toast } from 'sonner';
import { usePlatformSettings, useUpdatePlatformSettings } from '@/hooks/usePlatformSettings';
import {
  ALLOWED_EMAIL_DOMAINS_KEY,
  DEFAULT_QUIZ_DEFAULTS,
  DEFAULT_XP_REWARDS,
  QUIZ_DEFAULTS_KEY,
  XP_REWARDS_KEY,
  allowedDomainsFrom,
  domainsToInput,
  parseDomainsInput,
  platformSettingsSchema,
  quizDefaultsFrom,
  xpRewardsFrom,
} from '@/lib/platformSettings';

interface SettingsForm {
  domains: string;
  passingScore: number;
  quizXp: number;
  cooldownHours: number;
  lessonXp: number;
  courseXp: number;
}

const fallbackForm = (): SettingsForm => ({
  domains: domainsToInput(allowedDomainsFrom(undefined)),
  passingScore: DEFAULT_QUIZ_DEFAULTS.passing_score,
  quizXp: DEFAULT_QUIZ_DEFAULTS.xp_reward,
  cooldownHours: DEFAULT_QUIZ_DEFAULTS.cooldown_hours,
  lessonXp: DEFAULT_XP_REWARDS.lesson_completed,
  courseXp: DEFAULT_XP_REWARDS.course_completed,
});

export default function PlatformSettingsTab() {
  const { settings, isLoading } = usePlatformSettings();
  const { saveSettings, isSaving } = useUpdatePlatformSettings();
  const [form, setForm] = useState<SettingsForm>(fallbackForm);

  useEffect(() => {
    if (isLoading) return;
    const quizDefaults = quizDefaultsFrom(settings[QUIZ_DEFAULTS_KEY]);
    const xpRewards = xpRewardsFrom(settings[XP_REWARDS_KEY]);
    setForm({
      domains: domainsToInput(allowedDomainsFrom(settings[ALLOWED_EMAIL_DOMAINS_KEY])),
      passingScore: quizDefaults.passing_score,
      quizXp: quizDefaults.xp_reward,
      cooldownHours: quizDefaults.cooldown_hours,
      lessonXp: xpRewards.lesson_completed,
      courseXp: xpRewards.course_completed,
    });
  }, [settings, isLoading]);

  const update = <K extends keyof SettingsForm>(field: K, value: SettingsForm[K]) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  const handleSave = () => {
    const parsed = platformSettingsSchema.safeParse({
      allowed_email_domains: parseDomainsInput(form.domains),
      quiz_defaults: {
        passing_score: Number(form.passingScore),
        xp_reward: Number(form.quizXp),
        cooldown_hours: Number(form.cooldownHours),
      },
      xp_rewards: {
        lesson_completed: Number(form.lessonXp),
        course_completed: Number(form.courseXp),
      },
    });

    if (!parsed.success) {
      toast.error(parsed.error.errors[0]?.message ?? 'Configuração inválida');
      return;
    }

    saveSettings([
      { key: ALLOWED_EMAIL_DOMAINS_KEY, value: parsed.data.allowed_email_domains, description: 'Domínios de e-mail aceitos no login e no cadastro' },
      {
        key: QUIZ_DEFAULTS_KEY,
        value: {
          ...parsed.data.quiz_defaults,
          time_limit_seconds: quizDefaultsFrom(settings[QUIZ_DEFAULTS_KEY]).time_limit_seconds,
        },
        description: 'Valores iniciais de um quiz novo',
      },
      { key: XP_REWARDS_KEY, value: parsed.data.xp_rewards, description: 'XP concedido por ação concluída' },
    ]);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12 text-muted-foreground">
        <Loader2 className="h-5 w-5 animate-spin mr-2" /> Carregando configurações...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <Settings className="h-5 w-5" /> Configurações da Plataforma
          </h2>
          <p className="text-sm text-muted-foreground">
            Regras de negócio aplicadas sem novo deploy. Alterações valem para todo mundo na próxima tela aberta.
          </p>
        </div>
        <Button onClick={handleSave} disabled={isSaving}>
          {isSaving ? <Loader2 className="h-4 w-4 mr-1.5 animate-spin" /> : <Save className="h-4 w-4 mr-1.5" />}
          Salvar
        </Button>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="rounded-lg border bg-card p-4 space-y-3">
          <div className="flex items-center gap-2 font-medium"><Mail className="h-4 w-4" /> Domínios de e-mail</div>
          <div className="space-y-2">
            <Label htmlFor="domains">Domínios permitidos (separados por vírgula)</Label>
            <Input
              id="domains"
              value={form.domains}
              onChange={(e) => update('domains', e.target.value)}
              placeholder="promobrindes.com.br, outraempresa.com.br"
            />
            <p className="text-xs text-muted-foreground">
              Quem tentar entrar com outro domínio é bloqueado na tela de login.
            </p>
          </div>
        </div>

        <div className="rounded-lg border bg-card p-4 space-y-3">
          <div className="flex items-center gap-2 font-medium"><Target className="h-4 w-4" /> Padrões de quiz</div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="passing">Nota mínima (%)</Label>
              <Input id="passing" type="number" min={0} max={100} value={form.passingScore} onChange={(e) => update('passingScore', Number(e.target.value))} />
            </div>
            <div>
              <Label htmlFor="quizXp">XP do quiz</Label>
              <Input id="quizXp" type="number" min={0} max={10000} value={form.quizXp} onChange={(e) => update('quizXp', Number(e.target.value))} />
            </div>
            <div className="col-span-2">
              <Label htmlFor="cooldown">Cooldown (horas)</Label>
              <Input id="cooldown" type="number" min={0} max={720} value={form.cooldownHours} onChange={(e) => update('cooldownHours', Number(e.target.value))} />
            </div>
          </div>
          <p className="text-xs text-muted-foreground">Usados ao criar um quiz novo.</p>
        </div>

        <div className="rounded-lg border bg-card p-4 space-y-3">
          <div className="flex items-center gap-2 font-medium"><Zap className="h-4 w-4" /> XP por ação</div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="lessonXp">Aula concluída</Label>
              <Input id="lessonXp" type="number" min={0} max={10000} value={form.lessonXp} onChange={(e) => update('lessonXp', Number(e.target.value))} />
            </div>
            <div>
              <Label htmlFor="courseXp">Curso concluído</Label>
              <Input id="courseXp" type="number" min={0} max={10000} value={form.courseXp} onChange={(e) => update('courseXp', Number(e.target.value))} />
            </div>
          </div>
          <p className="text-xs text-muted-foreground">
            Depois de salvar, o XP já conquistado pelos alunos não muda — só as próximas aulas e cursos concluídos.
          </p>
        </div>
      </div>
    </div>
  );
}
