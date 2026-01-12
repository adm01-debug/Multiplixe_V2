import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  X, 
  ChevronRight, 
  ChevronLeft,
  BookOpen,
  Trophy,
  Flame,
  Bell,
  Zap,
  Target,
  GraduationCap,
  Sparkles
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";

interface TutorialStep {
  id: string;
  title: string;
  description: string;
  icon: React.ElementType;
  gradient: string;
  targetSelector?: string;
  position?: "top" | "bottom" | "left" | "right" | "center";
}

const tutorialSteps: TutorialStep[] = [
  {
    id: "welcome",
    title: "Bem-vindo ao MULTIPLIXE! 🎉",
    description: "Vamos fazer um tour rápido pela plataforma para você aproveitar ao máximo sua experiência de aprendizado.",
    icon: GraduationCap,
    gradient: "from-primary to-accent",
    position: "center",
  },
  {
    id: "courses",
    title: "Explore os Cursos",
    description: "Acesse o catálogo com dezenas de cursos organizados por categoria e nível. Filtre por área de interesse para encontrar o conteúdo ideal para você.",
    icon: BookOpen,
    gradient: "from-accent to-warning",
    position: "center",
  },
  {
    id: "xp",
    title: "Ganhe XP e Suba de Nível",
    description: "Cada aula assistida, quiz completado e curso finalizado rende pontos de experiência. Acompanhe seu progresso e evolua!",
    icon: Zap,
    gradient: "from-emerald-500 to-teal-500",
    position: "center",
  },
  {
    id: "streaks",
    title: "Mantenha sua Sequência",
    description: "Estude todos os dias para manter sua sequência ativa. Quanto maior a sequência, mais XP bônus você ganha!",
    icon: Flame,
    gradient: "from-rose-500 to-orange-500",
    position: "center",
  },
  {
    id: "achievements",
    title: "Conquiste Badges",
    description: "Complete desafios e desbloqueie conquistas especiais. Mostre suas badges no seu perfil e no ranking!",
    icon: Trophy,
    gradient: "from-warning to-amber-500",
    position: "center",
  },
  {
    id: "challenges",
    title: "Desafios Diários",
    description: "Todos os dias novos desafios são disponibilizados. Complete-os para ganhar XP extra e recompensas exclusivas!",
    icon: Target,
    gradient: "from-primary to-secondary",
    position: "center",
  },
  {
    id: "notifications",
    title: "Fique por Dentro",
    description: "Ative as notificações para receber alertas sobre novos cursos, conquistas e lembretes de estudo.",
    icon: Bell,
    gradient: "from-info to-primary",
    position: "center",
  },
  {
    id: "complete",
    title: "Pronto para Começar!",
    description: "Você está pronto para iniciar sua jornada de aprendizado. Explore os cursos e comece a evoluir hoje mesmo!",
    icon: Sparkles,
    gradient: "from-primary to-accent",
    position: "center",
  },
];

interface OnboardingTutorialProps {
  onComplete: () => void;
  onSkip?: () => void;
}

const OnboardingTutorial = ({ onComplete, onSkip }: OnboardingTutorialProps) => {
  const { user } = useAuth();
  const [currentStep, setCurrentStep] = useState(0);
  const [isVisible, setIsVisible] = useState(true);

  const step = tutorialSteps[currentStep];
  const progress = ((currentStep + 1) / tutorialSteps.length) * 100;
  const isLastStep = currentStep === tutorialSteps.length - 1;
  const isFirstStep = currentStep === 0;

  const handleComplete = useCallback(() => {
    if (user) {
      localStorage.setItem(`tutorial_completed_${user.id}`, "true");
    }
    setIsVisible(false);
    setTimeout(onComplete, 300);
  }, [user, onComplete]);

  const handleSkip = useCallback(() => {
    if (user) {
      localStorage.setItem(`tutorial_skipped_${user.id}`, "true");
    }
    setIsVisible(false);
    setTimeout(() => {
      onSkip?.();
      onComplete();
    }, 300);
  }, [user, onSkip, onComplete]);

  const handleNext = useCallback(() => {
    if (isLastStep) {
      handleComplete();
    } else {
      setCurrentStep((prev) => prev + 1);
    }
  }, [isLastStep, handleComplete]);

  const handleBack = useCallback(() => {
    if (currentStep > 0) {
      setCurrentStep((prev) => prev - 1);
    }
  }, [currentStep]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight" || e.key === "Enter") {
        handleNext();
      } else if (e.key === "ArrowLeft" && !isFirstStep) {
        handleBack();
      } else if (e.key === "Escape") {
        handleSkip();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleNext, isFirstStep]);

  const Icon = step.icon;

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-center justify-center"
        >
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-background/90 backdrop-blur-md"
            onClick={handleSkip}
          />

          {/* Content */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="relative w-full max-w-lg mx-4"
          >
            <div className="bg-card border border-border rounded-3xl shadow-2xl overflow-hidden">
              {/* Progress bar */}
              <div className="h-1 bg-muted">
                <motion.div
                  className="h-full bg-gradient-to-r from-primary to-accent"
                  initial={{ width: 0 }}
                  animate={{ width: `${progress}%` }}
                  transition={{ duration: 0.3 }}
                />
              </div>

              {/* Skip button */}
              <Button
                variant="ghost"
                size="icon"
                onClick={handleSkip}
                className="absolute top-4 right-4 h-8 w-8 rounded-full hover:bg-muted"
                aria-label="Pular tutorial"
              >
                <X className="h-4 w-4" />
              </Button>

              {/* Content */}
              <div className="p-8 pt-6">
                {/* Step indicator */}
                <div className="flex items-center justify-center gap-1.5 mb-6">
                  {tutorialSteps.map((_, index) => (
                    <motion.div
                      key={index}
                      className={`h-1.5 rounded-full transition-all duration-300 ${
                        index === currentStep
                          ? "w-6 bg-primary"
                          : index < currentStep
                          ? "w-1.5 bg-primary/60"
                          : "w-1.5 bg-muted-foreground/30"
                      }`}
                      animate={index === currentStep ? { scale: [1, 1.1, 1] } : {}}
                      transition={{ duration: 0.3 }}
                    />
                  ))}
                </div>

                {/* Icon */}
                <AnimatePresence mode="wait">
                  <motion.div
                    key={currentStep}
                    initial={{ opacity: 0, scale: 0.8, rotate: -10 }}
                    animate={{ opacity: 1, scale: 1, rotate: 0 }}
                    exit={{ opacity: 0, scale: 0.8, rotate: 10 }}
                    transition={{ type: "spring", damping: 20 }}
                    className="flex justify-center mb-6"
                  >
                    <div className={`w-20 h-20 rounded-3xl bg-gradient-to-br ${step.gradient} flex items-center justify-center shadow-xl`}>
                      <Icon className="w-10 h-10 text-white" />
                    </div>
                  </motion.div>
                </AnimatePresence>

                {/* Text */}
                <AnimatePresence mode="wait">
                  <motion.div
                    key={currentStep}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.2 }}
                    className="text-center space-y-3 mb-8"
                  >
                    <h2 className="text-2xl font-display font-bold text-foreground">
                      {step.title}
                    </h2>
                    <p className="text-muted-foreground leading-relaxed">
                      {step.description}
                    </p>
                  </motion.div>
                </AnimatePresence>

                {/* Navigation */}
                <div className="flex items-center justify-between">
                  <Button
                    variant="ghost"
                    onClick={handleBack}
                    disabled={isFirstStep}
                    className="gap-2"
                  >
                    <ChevronLeft className="h-4 w-4" />
                    Voltar
                  </Button>

                  <span className="text-sm text-muted-foreground">
                    {currentStep + 1} / {tutorialSteps.length}
                  </span>

                  <Button
                    onClick={handleNext}
                    className={`gap-2 bg-gradient-to-r ${step.gradient} text-white hover:opacity-90`}
                  >
                    {isLastStep ? "Começar!" : "Próximo"}
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* Keyboard hints */}
              <div className="px-8 py-3 bg-muted/50 border-t border-border/50 flex items-center justify-center gap-4 text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <kbd className="px-1.5 py-0.5 bg-background rounded border text-[10px]">←</kbd>
                  <kbd className="px-1.5 py-0.5 bg-background rounded border text-[10px]">→</kbd>
                  navegar
                </span>
                <span className="flex items-center gap-1">
                  <kbd className="px-1.5 py-0.5 bg-background rounded border text-[10px]">ESC</kbd>
                  pular
                </span>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

// Hook to manage tutorial state
export const useOnboardingTutorial = () => {
  const { user } = useAuth();
  const [shouldShow, setShouldShow] = useState(false);

  useEffect(() => {
    if (user) {
      const completed = localStorage.getItem(`tutorial_completed_${user.id}`);
      const skipped = localStorage.getItem(`tutorial_skipped_${user.id}`);
      const onboardingDone = localStorage.getItem(`onboarding_completed_${user.id}`);
      
      // Show tutorial after onboarding is done, but only if not completed/skipped
      if (onboardingDone && !completed && !skipped) {
        setShouldShow(true);
      }
    }
  }, [user]);

  const startTutorial = () => setShouldShow(true);
  const completeTutorial = () => setShouldShow(false);

  const resetTutorial = () => {
    if (user) {
      localStorage.removeItem(`tutorial_completed_${user.id}`);
      localStorage.removeItem(`tutorial_skipped_${user.id}`);
      setShouldShow(true);
    }
  };

  return { shouldShow, startTutorial, completeTutorial, resetTutorial };
};

export default OnboardingTutorial;
