import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useGoals, GoalType, goalTypeLabels, goalTypeIcons } from "@/hooks/useGoals";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Target,
  Plus,
  Trophy,
  Flame,
  Trash2,
  Loader2,
  CheckCircle,
  Calendar,
} from "lucide-react";
import { format, differenceInDays } from "date-fns";
import { ptBR } from "date-fns/locale";

const GoalsWidget = () => {
  const { activeGoals, createGoal, deleteGoal, isCreating, isLoading } = useGoals();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [goalType, setGoalType] = useState<GoalType>("xp_day");
  const [targetValue, setTargetValue] = useState("");

  const handleCreateGoal = () => {
    if (targetValue && parseInt(targetValue) > 0) {
      createGoal({ goalType, targetValue: parseInt(targetValue) });
      setTargetValue("");
      setIsDialogOpen(false);
    }
  };

  const getGradient = (type: GoalType) => {
    switch (type) {
      case "courses_month":
        return "from-amber-500 to-orange-500";
      case "hours_week":
        return "from-blue-500 to-cyan-500";
      case "xp_day":
        return "from-emerald-500 to-teal-500";
      case "lessons_week":
        return "from-purple-500 to-pink-500";
      default:
        return "from-primary to-secondary";
    }
  };

  if (isLoading) {
    return (
      <div className="p-6 rounded-2xl bg-card/50 border border-border/50 animate-pulse">
        <div className="h-6 w-32 bg-muted rounded mb-4" />
        <div className="h-20 bg-muted rounded" />
      </div>
    );
  }

  return (
    <div className="p-6 rounded-2xl bg-card/80 border border-border/50 neon-card">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-gradient-to-br from-emerald-500/10 to-teal-500/10 border border-emerald-500/20">
            <Target className="h-5 w-5 text-emerald-500" />
          </div>
          <div>
            <h3 className="font-display font-bold text-foreground">Minhas Metas</h3>
            <p className="text-sm text-muted-foreground">
              {activeGoals.length} meta{activeGoals.length !== 1 ? "s" : ""} ativa{activeGoals.length !== 1 ? "s" : ""}
            </p>
          </div>
        </div>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="gap-2 rounded-xl">
              <Plus className="h-4 w-4" />
              Nova Meta
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Target className="h-5 w-5 text-primary" />
                Criar Nova Meta
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Tipo de Meta</label>
                <Select value={goalType} onValueChange={(v) => setGoalType(v as GoalType)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {(Object.keys(goalTypeLabels) as GoalType[]).map((type) => (
                      <SelectItem key={type} value={type}>
                        <span className="flex items-center gap-2">
                          <span>{goalTypeIcons[type]}</span>
                          {goalTypeLabels[type]}
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Valor Alvo</label>
                <Input
                  type="number"
                  min="1"
                  value={targetValue}
                  onChange={(e) => setTargetValue(e.target.value)}
                  placeholder="Ex: 100"
                />
              </div>
              <Button 
                onClick={handleCreateGoal} 
                disabled={isCreating || !targetValue}
                className="w-full gap-2"
              >
                {isCreating ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Trophy className="h-4 w-4" />
                )}
                Criar Meta
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <AnimatePresence mode="popLayout">
        {activeGoals.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-8"
          >
            <Flame className="h-12 w-12 mx-auto mb-3 text-muted-foreground/30" />
            <p className="text-muted-foreground">Nenhuma meta ativa</p>
            <p className="text-sm text-muted-foreground">Crie uma meta para se manter motivado!</p>
          </motion.div>
        ) : (
          <div className="space-y-4">
            {activeGoals.slice(0, 3).map((goal) => {
              const progress = Math.min((goal.current_value / goal.target_value) * 100, 100);
              const daysLeft = differenceInDays(new Date(goal.end_date), new Date());
              const gradient = getGradient(goal.goal_type as GoalType);

              return (
                <motion.div
                  key={goal.id}
                  layout
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -50 }}
                  className="group p-4 rounded-xl bg-muted/30 border border-border/30 hover:border-border/50 transition-colors"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg bg-gradient-to-br ${gradient}`}>
                        <span className="text-lg">{goalTypeIcons[goal.goal_type as GoalType]}</span>
                      </div>
                      <div>
                        <p className="font-medium text-foreground">
                          {goalTypeLabels[goal.goal_type as GoalType]}
                        </p>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <Calendar className="h-3 w-3" />
                          {daysLeft > 0 ? `${daysLeft} dias restantes` : "Vence hoje"}
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => deleteGoal(goal.id)}
                      className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg hover:bg-destructive/10 text-destructive transition-all"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">
                        {goal.current_value} / {goal.target_value}
                      </span>
                      <span className="font-semibold text-foreground">{Math.round(progress)}%</span>
                    </div>
                    <Progress value={progress} className="h-2" />
                    
                    {progress >= 100 && (
                      <div className="flex items-center gap-2 text-emerald-500 text-sm font-medium">
                        <CheckCircle className="h-4 w-4" />
                        Meta atingida!
                      </div>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default GoalsWidget;
