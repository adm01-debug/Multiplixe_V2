import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  User, 
  Target, 
  BookOpen, 
  Trophy, 
  Check, 
  ChevronRight,
  Sparkles,
  X
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Link } from 'react-router-dom';

interface CompletionStep {
  id: string;
  label: string;
  icon: React.ElementType;
  completed: boolean;
  action?: string;
  link?: string;
}

const ProfileCompletionBar = () => {
  const { user } = useAuth();
  const [steps, setSteps] = useState<CompletionStep[]>([]);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);

  useEffect(() => {
    if (!user) return;
    
    const checkCompletion = async () => {
      // Check dismissal state
      const dismissed = localStorage.getItem(`profile_bar_dismissed_${user.id}`);
      if (dismissed) {
        setIsDismissed(true);
        return;
      }

      // Check profile data
      const { data: profile } = await supabase
        .from('profiles')
        .select('full_name, avatar_url, department')
        .eq('user_id', user.id)
        .single();

      // Check course progress
      const { data: courseProgress } = await supabase
        .from('user_course_progress')
        .select('id')
        .eq('user_id', user.id)
        .limit(1);

      // Check achievements
      const { data: achievements } = await supabase
        .from('user_achievements')
        .select('id')
        .eq('user_id', user.id)
        .limit(1);

      const completionSteps: CompletionStep[] = [
        {
          id: 'profile',
          label: 'Completar perfil',
          icon: User,
          completed: !!(profile?.full_name && profile?.avatar_url),
          action: 'Adicione seu nome e foto',
          link: '/perfil',
        },
        {
          id: 'department',
          label: 'Selecionar departamento',
          icon: Target,
          completed: !!profile?.department,
          action: 'Escolha sua área',
          link: '/perfil',
        },
        {
          id: 'first-course',
          label: 'Iniciar primeiro curso',
          icon: BookOpen,
          completed: (courseProgress?.length ?? 0) > 0,
          action: 'Explore o catálogo',
          link: '/catalogo',
        },
        {
          id: 'first-achievement',
          label: 'Conquistar primeiro badge',
          icon: Trophy,
          completed: (achievements?.length ?? 0) > 0,
          action: 'Complete desafios',
          link: '/dashboard',
        },
      ];

      setSteps(completionSteps);
    };

    checkCompletion();
  }, [user]);

  const completedCount = steps.filter(s => s.completed).length;
  const totalSteps = steps.length;
  const progress = totalSteps > 0 ? (completedCount / totalSteps) * 100 : 0;
  const isComplete = completedCount === totalSteps;

  const handleDismiss = () => {
    if (user) {
      localStorage.setItem(`profile_bar_dismissed_${user.id}`, 'true');
    }
    setIsDismissed(true);
  };

  if (isDismissed || isComplete || steps.length === 0) return null;

  const nextStep = steps.find(s => !s.completed);

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="bg-gradient-to-r from-primary/10 via-accent/10 to-primary/10 border border-primary/20 rounded-2xl p-4 mb-6"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="font-semibold text-foreground">Complete seu perfil</h3>
            <p className="text-sm text-muted-foreground">
              {completedCount} de {totalSteps} etapas concluídas
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-xs"
          >
            {isExpanded ? 'Menos' : 'Ver todas'}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleDismiss}
            className="h-8 w-8 text-muted-foreground hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Progress bar */}
      <div className="mb-4">
        <Progress value={progress} className="h-2" />
      </div>

      {/* Steps */}
      <AnimatePresence>
        {isExpanded ? (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="grid grid-cols-2 md:grid-cols-4 gap-3"
          >
            {steps.map((step, index) => {
              const Icon = step.icon;
              return (
                <motion.div
                  key={step.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  {step.link ? (
                    <Link
                      to={step.link}
                      className={`block p-3 rounded-xl border transition-all ${
                        step.completed
                          ? 'bg-primary/10 border-primary/30'
                          : 'bg-background/50 border-border hover:border-primary/50'
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <div className={`w-6 h-6 rounded-lg flex items-center justify-center ${
                          step.completed ? 'bg-primary text-white' : 'bg-muted text-muted-foreground'
                        }`}>
                          {step.completed ? <Check className="w-3.5 h-3.5" /> : <Icon className="w-3.5 h-3.5" />}
                        </div>
                        <span className={`text-sm font-medium ${step.completed ? 'text-primary' : 'text-foreground'}`}>
                          {step.label}
                        </span>
                      </div>
                      {!step.completed && step.action && (
                        <p className="text-xs text-muted-foreground pl-8">{step.action}</p>
                      )}
                    </Link>
                  ) : (
                    <div className={`p-3 rounded-xl border ${
                      step.completed
                        ? 'bg-primary/10 border-primary/30'
                        : 'bg-background/50 border-border'
                    }`}>
                      <div className="flex items-center gap-2">
                        <div className={`w-6 h-6 rounded-lg flex items-center justify-center ${
                          step.completed ? 'bg-primary text-white' : 'bg-muted text-muted-foreground'
                        }`}>
                          {step.completed ? <Check className="w-3.5 h-3.5" /> : <Icon className="w-3.5 h-3.5" />}
                        </div>
                        <span className={`text-sm font-medium ${step.completed ? 'text-primary' : 'text-foreground'}`}>
                          {step.label}
                        </span>
                      </div>
                    </div>
                  )}
                </motion.div>
              );
            })}
          </motion.div>
        ) : nextStep ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            {nextStep.link ? (
              <Link
                to={nextStep.link}
                className="flex items-center justify-between p-3 rounded-xl bg-background/50 border border-border hover:border-primary/50 transition-all group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                    <nextStep.icon className="w-4 h-4 text-primary" />
                  </div>
                  <div>
                    <span className="text-sm font-medium text-foreground">{nextStep.label}</span>
                    {nextStep.action && (
                      <p className="text-xs text-muted-foreground">{nextStep.action}</p>
                    )}
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
              </Link>
            ) : (
              <div className="flex items-center gap-3 p-3 rounded-xl bg-background/50 border border-border">
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                  <nextStep.icon className="w-4 h-4 text-primary" />
                </div>
                <span className="text-sm font-medium text-foreground">{nextStep.label}</span>
              </div>
            )}
          </motion.div>
        ) : null}
      </AnimatePresence>
    </motion.div>
  );
};

export default ProfileCompletionBar;
