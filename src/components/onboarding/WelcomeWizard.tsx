import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight, ChevronLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

import {
  WelcomeStep, DepartmentStep, GoalsStep, StudyTimeStep, QuickWinStep
} from './WizardStepContent';

interface WelcomeWizardProps { onComplete: () => void; }

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
      case 0: return true;
      case 1: return department !== '';
      case 2: return selectedGoals.length > 0;
      case 3: return studyTime !== '';
      case 4: return true;
      default: return false;
    }
  };

  const toggleGoal = (goalId: string) => {
    setSelectedGoals(prev => prev.includes(goalId) ? prev.filter(id => id !== goalId) : [...prev, goalId]);
  };

  const handleComplete = async () => {
    if (!user) return;
    setIsSubmitting(true);
    try {
      const { error: profileError } = await supabase.from('profiles').upsert({ user_id: user.id, department, updated_at: new Date().toISOString() }, { onConflict: 'user_id' });
      if (profileError) throw profileError;
      localStorage.setItem(`onboarding_completed_${user.id}`, 'true');
      localStorage.setItem(`user_goals_${user.id}`, JSON.stringify(selectedGoals));
      localStorage.setItem(`study_time_${user.id}`, studyTime);
      const { default: confetti } = await import('canvas-confetti');
      confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 }, colors: ['#8B5CF6', '#EC4899', '#10B981', '#F59E0B'] });
      toast.success('Bem-vindo ao MULTIPLIXE! 🎉');
      onComplete();
    } catch { toast.error('Erro ao salvar configurações'); } finally { setIsSubmitting(false); }
  };

  const handleNext = () => { if (currentStep < totalSteps - 1) setCurrentStep(prev => prev + 1); else handleComplete(); };
  const handleBack = () => { if (currentStep > 0) setCurrentStep(prev => prev - 1); };

  const steps = [
    { title: 'Bem-vindo ao MULTIPLIXE! 🚀', subtitle: 'Vamos personalizar sua experiência de aprendizado', content: <WelcomeStep /> },
    { title: 'Qual é seu departamento?', subtitle: 'Isso nos ajuda a recomendar cursos relevantes', content: <DepartmentStep department={department} setDepartment={setDepartment} /> },
    { title: 'Quais são seus objetivos?', subtitle: 'Selecione todos que se aplicam', content: <GoalsStep selectedGoals={selectedGoals} toggleGoal={toggleGoal} /> },
    { title: 'Quanto tempo por dia?', subtitle: 'Defina sua meta diária de estudos', content: <StudyTimeStep studyTime={studyTime} setStudyTime={setStudyTime} /> },
    { title: 'Comece com uma Vitória Rápida! 🎯', subtitle: 'Escolha seu primeiro mini-curso (opcional)', content: <QuickWinStep selectedQuickWin={selectedQuickWin} setSelectedQuickWin={setSelectedQuickWin} /> },
  ];

  return (
    <div className="fixed inset-0 z-50 bg-background/95 backdrop-blur-sm">
      <div className="min-h-screen flex items-center justify-center p-4">
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="w-full max-w-2xl bg-card border border-border rounded-3xl shadow-2xl overflow-hidden">
          <div className="h-2 bg-muted"><motion.div className="h-full bg-gradient-to-r from-primary to-accent" initial={{ width: 0 }} animate={{ width: `${progress}%` }} transition={{ duration: 0.3 }} /></div>
          <div className="p-8">
            <div className="flex items-center justify-center gap-2 mb-8">
              {Array.from({ length: totalSteps }).map((_, index) => (<div key={index} className={`w-2.5 h-2.5 rounded-full transition-all duration-300 ${index === currentStep ? 'w-8 bg-primary' : index < currentStep ? 'bg-primary/60' : 'bg-muted-foreground/30'}`} />))}
            </div>
            <div className="text-center mb-8">
              <h2 className="text-2xl md:text-3xl font-display font-bold text-foreground mb-2">{steps[currentStep].title}</h2>
              <p className="text-muted-foreground">{steps[currentStep].subtitle}</p>
            </div>
            <AnimatePresence mode="wait"><div key={currentStep} className="mb-8">{steps[currentStep].content}</div></AnimatePresence>
            <div className="flex items-center justify-between pt-4 border-t border-border">
              <Button variant="ghost" onClick={handleBack} disabled={currentStep === 0} className="gap-2"><ChevronLeft className="h-4 w-4" />Voltar</Button>
              <span className="text-sm text-muted-foreground">Passo {currentStep + 1} de {totalSteps}</span>
              <Button onClick={handleNext} disabled={!canProceed() || isSubmitting} className="gap-2 bg-gradient-to-r from-primary to-accent hover:opacity-90">{currentStep === totalSteps - 1 ? (isSubmitting ? 'Salvando...' : 'Começar!') : 'Próximo'}<ChevronRight className="h-4 w-4" /></Button>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default WelcomeWizard;
