import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  GraduationCap, 
  Target, 
  Sparkles, 
  ChevronRight, 
  ChevronLeft,
  Trophy,
  Flame,
  BookOpen,
  Users,
  Zap,
  Check,
  Rocket,
  Clock,
  Star,
  Play,
  Gift
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import confetti from 'canvas-confetti';

interface WelcomeWizardProps {
  onComplete: () => void;
}

const departments = [
  { id: 'vendas', label: 'Vendas', icon: Target },
  { id: 'marketing', label: 'Marketing', icon: Sparkles },
  { id: 'atendimento', label: 'Atendimento ao Cliente', icon: Users },
  { id: 'logistica', label: 'Logística', icon: Rocket },
  { id: 'financeiro', label: 'Financeiro', icon: Zap },
  { id: 'rh', label: 'Recursos Humanos', icon: Users },
  { id: 'ti', label: 'Tecnologia', icon: BookOpen },
  { id: 'outro', label: 'Outro', icon: GraduationCap },
];

const goals = [
  { id: 'promocao', label: 'Conseguir uma promoção', icon: Trophy },
  { id: 'habilidades', label: 'Desenvolver novas habilidades', icon: Sparkles },
  { id: 'certificacao', label: 'Obter certificações', icon: GraduationCap },
  { id: 'produtividade', label: 'Aumentar produtividade', icon: Zap },
  { id: 'lideranca', label: 'Tornar-me líder', icon: Users },
];

const studyTimes = [
  { id: '15min', label: '15 minutos', description: 'Ritmo leve', xp: '+50 XP/dia' },
  { id: '30min', label: '30 minutos', description: 'Ritmo moderado', xp: '+100 XP/dia' },
  { id: '60min', label: '1 hora', description: 'Ritmo intenso', xp: '+200 XP/dia' },
  { id: 'flexivel', label: 'Flexível', description: 'Sem meta fixa', xp: 'XP variável' },
];

const quickWinCourses = [
  { id: 'intro-plataforma', title: 'Tour pela Plataforma', duration: '5 min', xp: 25, icon: Rocket },
  { id: 'primeiro-badge', title: 'Conquiste seu 1º Badge', duration: '10 min', xp: 50, icon: Trophy },
  { id: 'produtividade-101', title: 'Produtividade 101', duration: '8 min', xp: 40, icon: Zap },
];

const WelcomeWizard = ({ onComplete }: WelcomeWizardProps) => {
  const { user } = useAuth();
  const [currentStep, setCurrentStep] = useState(0);
  const [department, setDepartment] = useState('');
  const [selectedGoals, setSelectedGoals] = useState<string[]>([]);
  const [studyTime, setStudyTime] = useState('');
  const [selectedQuickWin, setSelectedQuickWin] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const totalSteps = 5;
  const progress = ((currentStep + 1) / totalSteps) * 100;

  const canProceed = () => {
    switch (currentStep) {
      case 0: return true; // Welcome step
      case 1: return department !== '';
      case 2: return selectedGoals.length > 0;
      case 3: return studyTime !== '';
      case 4: return true; // Quick win step (optional selection)
      default: return false;
    }
  };

  const handleNext = () => {
    if (currentStep < totalSteps - 1) {
      setCurrentStep(prev => prev + 1);
    } else {
      handleComplete();
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const handleComplete = async () => {
    if (!user) return;
    
    setIsSubmitting(true);
    
    try {
      // Update profile with department
      const { error: profileError } = await supabase
        .from('profiles')
        .upsert({
          user_id: user.id,
          department,
          updated_at: new Date().toISOString(),
        }, { onConflict: 'user_id' });

      if (profileError) throw profileError;

      // Mark onboarding as complete in localStorage
      localStorage.setItem(`onboarding_completed_${user.id}`, 'true');
      localStorage.setItem(`user_goals_${user.id}`, JSON.stringify(selectedGoals));
      localStorage.setItem(`study_time_${user.id}`, studyTime);

      // Celebrate!
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#8B5CF6', '#EC4899', '#10B981', '#F59E0B'],
      });

      toast.success('Bem-vindo ao MULTIPLIXE! 🎉');
      onComplete();
    } catch (error) {
      console.error('Error completing onboarding:', error);
      toast.error('Erro ao salvar configurações');
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleGoal = (goalId: string) => {
    setSelectedGoals(prev => 
      prev.includes(goalId) 
        ? prev.filter(id => id !== goalId)
        : [...prev, goalId]
    );
  };

  const steps = [
    // Step 0: Welcome
    {
      title: 'Bem-vindo ao MULTIPLIXE! 🚀',
      subtitle: 'Vamos personalizar sua experiência de aprendizado',
      content: (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center space-y-8"
        >
          <div className="relative w-32 h-32 mx-auto">
            <div className="absolute inset-0 bg-gradient-to-r from-primary to-accent rounded-full blur-2xl opacity-50 animate-pulse" />
            <div className="relative w-full h-full bg-gradient-to-br from-primary to-accent rounded-full flex items-center justify-center">
              <GraduationCap className="h-16 w-16 text-white" />
            </div>
          </div>
          
          <div className="space-y-4">
            <p className="text-lg text-muted-foreground max-w-md mx-auto">
              Em apenas <span className="font-bold text-primary">3 passos</span>, vamos configurar 
              tudo para maximizar seu aprendizado.
            </p>
            
            <div className="flex items-center justify-center gap-6 pt-4">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <BookOpen className="h-4 w-4 text-primary" />
                <span>Cursos personalizados</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Trophy className="h-4 w-4 text-amber-500" />
                <span>Conquistas e XP</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Flame className="h-4 w-4 text-rose-500" />
                <span>Streaks de estudo</span>
              </div>
            </div>
          </div>
        </motion.div>
      ),
    },
    // Step 1: Department
    {
      title: 'Qual é seu departamento?',
      subtitle: 'Isso nos ajuda a recomendar cursos relevantes',
      content: (
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-3"
        >
          {departments.map((dept) => {
            const Icon = dept.icon;
            const isSelected = department === dept.id;
            return (
              <button
                key={dept.id}
                onClick={() => setDepartment(dept.id)}
                className={`
                  relative p-4 rounded-xl border-2 transition-all duration-200
                  flex flex-col items-center gap-2 text-center
                  ${isSelected 
                    ? 'border-primary bg-primary/10 shadow-lg shadow-primary/20' 
                    : 'border-border hover:border-primary/50 hover:bg-muted/50'
                  }
                `}
              >
                {isSelected && (
                  <div className="absolute top-2 right-2">
                    <Check className="h-4 w-4 text-primary" />
                  </div>
                )}
                <div className={`
                  w-12 h-12 rounded-xl flex items-center justify-center
                  ${isSelected ? 'bg-primary text-white' : 'bg-muted text-muted-foreground'}
                `}>
                  <Icon className="h-6 w-6" />
                </div>
                <span className={`text-sm font-medium ${isSelected ? 'text-primary' : 'text-foreground'}`}>
                  {dept.label}
                </span>
              </button>
            );
          })}
        </motion.div>
      ),
    },
    // Step 2: Goals
    {
      title: 'Quais são seus objetivos?',
      subtitle: 'Selecione todos que se aplicam',
      content: (
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="space-y-3"
        >
          {goals.map((goal) => {
            const Icon = goal.icon;
            const isSelected = selectedGoals.includes(goal.id);
            return (
              <button
                key={goal.id}
                onClick={() => toggleGoal(goal.id)}
                className={`
                  w-full p-4 rounded-xl border-2 transition-all duration-200
                  flex items-center gap-4 text-left
                  ${isSelected 
                    ? 'border-primary bg-primary/10 shadow-lg shadow-primary/20' 
                    : 'border-border hover:border-primary/50 hover:bg-muted/50'
                  }
                `}
              >
                <div className={`
                  w-12 h-12 rounded-xl flex items-center justify-center shrink-0
                  ${isSelected ? 'bg-primary text-white' : 'bg-muted text-muted-foreground'}
                `}>
                  <Icon className="h-6 w-6" />
                </div>
                <span className={`text-base font-medium ${isSelected ? 'text-primary' : 'text-foreground'}`}>
                  {goal.label}
                </span>
                {isSelected && (
                  <Check className="h-5 w-5 text-primary ml-auto" />
                )}
              </button>
            );
          })}
        </motion.div>
      ),
    },
    // Step 3: Study time
    {
      title: 'Quanto tempo por dia?',
      subtitle: 'Defina sua meta diária de estudos',
      content: (
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="grid grid-cols-2 gap-4"
        >
          {studyTimes.map((time) => {
            const isSelected = studyTime === time.id;
            return (
              <button
                key={time.id}
                onClick={() => setStudyTime(time.id)}
                className={`
                  relative p-6 rounded-xl border-2 transition-all duration-200
                  flex flex-col items-center gap-2 text-center
                  ${isSelected 
                    ? 'border-primary bg-primary/10 shadow-lg shadow-primary/20' 
                    : 'border-border hover:border-primary/50 hover:bg-muted/50'
                  }
                `}
              >
                {isSelected && (
                  <div className="absolute top-3 right-3">
                    <Check className="h-5 w-5 text-primary" />
                  </div>
                )}
                <span className={`text-2xl font-bold ${isSelected ? 'text-primary' : 'text-foreground'}`}>
                  {time.label}
                </span>
                <span className="text-sm text-muted-foreground">
                  {time.description}
                </span>
                <span className={`text-xs font-semibold ${isSelected ? 'text-primary' : 'text-muted-foreground'}`}>
                  {time.xp}
                </span>
              </button>
            );
          })}
        </motion.div>
      ),
    },
    // Step 4: Quick Win - First Course
    {
      title: 'Comece com uma Vitória Rápida! 🎯',
      subtitle: 'Escolha seu primeiro mini-curso (opcional)',
      content: (
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="space-y-4"
        >
          <div className="bg-gradient-to-r from-primary/10 to-accent/10 rounded-2xl p-4 border border-primary/20 mb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
                <Gift className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="font-semibold text-foreground">Bônus de Boas-Vindas!</p>
                <p className="text-sm text-muted-foreground">Complete um mini-curso e ganhe XP extra</p>
              </div>
            </div>
          </div>
          
          {quickWinCourses.map((course) => {
            const Icon = course.icon;
            const isSelected = selectedQuickWin === course.id;
            return (
              <motion.button
                key={course.id}
                onClick={() => setSelectedQuickWin(course.id)}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className={`
                  w-full p-5 rounded-xl border-2 transition-all duration-200
                  flex items-center gap-4 text-left
                  ${isSelected 
                    ? 'border-primary bg-primary/10 shadow-lg shadow-primary/20' 
                    : 'border-border hover:border-primary/50 hover:bg-muted/50'
                  }
                `}
              >
                <div className={`
                  w-14 h-14 rounded-xl flex items-center justify-center shrink-0
                  ${isSelected ? 'bg-gradient-to-br from-primary to-accent text-white' : 'bg-muted text-muted-foreground'}
                `}>
                  <Icon className="h-7 w-7" />
                </div>
                <div className="flex-1">
                  <span className={`text-base font-semibold ${isSelected ? 'text-primary' : 'text-foreground'}`}>
                    {course.title}
                  </span>
                  <div className="flex items-center gap-3 mt-1 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" />
                      {course.duration}
                    </span>
                    <span className="flex items-center gap-1 text-primary font-semibold">
                      <Star className="w-3.5 h-3.5" />
                      +{course.xp} XP
                    </span>
                  </div>
                </div>
                {isSelected ? (
                  <Check className="h-6 w-6 text-primary shrink-0" />
                ) : (
                  <Play className="h-6 w-6 text-muted-foreground shrink-0" />
                )}
              </motion.button>
            );
          })}
          
          <button
            onClick={() => setSelectedQuickWin('')}
            className="w-full text-center text-sm text-muted-foreground hover:text-foreground transition-colors py-2"
          >
            Pular por agora, quero explorar sozinho
          </button>
        </motion.div>
      ),
    },
  ];

  return (
    <div className="fixed inset-0 z-50 bg-background/95 backdrop-blur-sm">
      <div className="min-h-screen flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-2xl bg-card border border-border rounded-3xl shadow-2xl overflow-hidden"
        >
          {/* Progress bar */}
          <div className="h-2 bg-muted">
            <motion.div
              className="h-full bg-gradient-to-r from-primary to-accent"
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>

          {/* Content */}
          <div className="p-8">
            {/* Step indicator */}
            <div className="flex items-center justify-center gap-2 mb-8">
              {Array.from({ length: totalSteps }).map((_, index) => (
                <div
                  key={index}
                  className={`
                    w-2.5 h-2.5 rounded-full transition-all duration-300
                    ${index === currentStep 
                      ? 'w-8 bg-primary' 
                      : index < currentStep 
                        ? 'bg-primary/60' 
                        : 'bg-muted-foreground/30'
                    }
                  `}
                />
              ))}
            </div>

            {/* Title */}
            <div className="text-center mb-8">
              <h2 className="text-2xl md:text-3xl font-display font-bold text-foreground mb-2">
                {steps[currentStep].title}
              </h2>
              <p className="text-muted-foreground">
                {steps[currentStep].subtitle}
              </p>
            </div>

            {/* Step content */}
            <AnimatePresence mode="wait">
              <div key={currentStep} className="mb-8">
                {steps[currentStep].content}
              </div>
            </AnimatePresence>

            {/* Navigation */}
            <div className="flex items-center justify-between pt-4 border-t border-border">
              <Button
                variant="ghost"
                onClick={handleBack}
                disabled={currentStep === 0}
                className="gap-2"
              >
                <ChevronLeft className="h-4 w-4" />
                Voltar
              </Button>

              <span className="text-sm text-muted-foreground">
                Passo {currentStep + 1} de {totalSteps}
              </span>

              <Button
                onClick={handleNext}
                disabled={!canProceed() || isSubmitting}
                className="gap-2 bg-gradient-to-r from-primary to-accent hover:opacity-90"
              >
                {currentStep === totalSteps - 1 ? (
                  isSubmitting ? 'Salvando...' : 'Começar!'
                ) : (
                  'Próximo'
                )}
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default WelcomeWizard;
