import { motion } from "framer-motion";
import { 
  BookOpen, 
  Trophy, 
  Users, 
  Bell, 
  FileText, 
  Search,
  MessageSquare,
  Flame,
  Target,
  Route,
  BarChart,
  Heart,
  PenLine,
  Flag
} from "lucide-react";
import { Button } from "@/components/ui/button";

interface EmptyStateProps {
  type: 
    | "courses" 
    | "progress" 
    | "achievements" 
    | "notifications" 
    | "certificates" 
    | "search" 
    | "discussions" 
    | "leaderboard"
    | "streaks"
    | "challenges"
    | "learning-paths"
    | "analytics"
    | "favorites"
    | "notes"
    | "goals";
  title?: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
}

const emptyStateConfigs = {
  courses: {
    icon: BookOpen,
    title: "Nenhum curso encontrado",
    description: "Não encontramos cursos com esses filtros. Tente ajustar sua busca ou explore nosso catálogo completo.",
    actionLabel: "Ver todos os cursos",
    gradient: "from-primary to-accent",
    illustration: (
      <svg className="w-32 h-32 text-muted-foreground/20" viewBox="0 0 200 200" fill="none">
        <rect x="30" y="60" width="140" height="100" rx="8" stroke="currentColor" strokeWidth="4"/>
        <path d="M30 85h140" stroke="currentColor" strokeWidth="4"/>
        <circle cx="100" cy="130" r="20" stroke="currentColor" strokeWidth="4"/>
        <path d="M95 130l5 5 10-10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
        <rect x="50" y="40" width="100" height="25" rx="4" stroke="currentColor" strokeWidth="3"/>
      </svg>
    ),
  },
  progress: {
    icon: Target,
    title: "Nenhum curso em andamento",
    description: "Você ainda não começou nenhum curso. Explore nosso catálogo e comece sua jornada de aprendizado!",
    actionLabel: "Explorar cursos",
    gradient: "from-accent to-warning",
    illustration: (
      <svg className="w-32 h-32 text-muted-foreground/20" viewBox="0 0 200 200" fill="none">
        <circle cx="100" cy="100" r="70" stroke="currentColor" strokeWidth="4"/>
        <circle cx="100" cy="100" r="50" stroke="currentColor" strokeWidth="4"/>
        <circle cx="100" cy="100" r="30" stroke="currentColor" strokeWidth="4"/>
        <circle cx="100" cy="100" r="10" fill="currentColor"/>
        <path d="M100 30v-15M170 100h15M100 170v15M30 100h-15" stroke="currentColor" strokeWidth="3"/>
      </svg>
    ),
  },
  achievements: {
    icon: Trophy,
    title: "Nenhuma conquista ainda",
    description: "Complete cursos, mantenha sua sequência de estudos e interaja com a plataforma para desbloquear conquistas!",
    actionLabel: "Ver como ganhar",
    gradient: "from-warning to-primary",
    illustration: (
      <svg className="w-32 h-32 text-muted-foreground/20" viewBox="0 0 200 200" fill="none">
        <path d="M100 30l15 30h35l-28 22 10 35-32-22-32 22 10-35-28-22h35z" stroke="currentColor" strokeWidth="4" strokeLinejoin="round"/>
        <rect x="70" y="130" width="60" height="40" rx="4" stroke="currentColor" strokeWidth="4"/>
        <path d="M85 130v-10a15 15 0 0130 0v10" stroke="currentColor" strokeWidth="4"/>
      </svg>
    ),
  },
  notifications: {
    icon: Bell,
    title: "Nenhuma notificação",
    description: "Você está em dia! Novas notificações sobre cursos, conquistas e atualizações aparecerão aqui.",
    gradient: "from-primary to-secondary",
    illustration: (
      <svg className="w-32 h-32 text-muted-foreground/20" viewBox="0 0 200 200" fill="none">
        <path d="M100 40c-25 0-45 20-45 45v35l-15 15h120l-15-15v-35c0-25-20-45-45-45z" stroke="currentColor" strokeWidth="4"/>
        <path d="M85 135v5c0 8.3 6.7 15 15 15s15-6.7 15-15v-5" stroke="currentColor" strokeWidth="4"/>
        <circle cx="130" cy="55" r="15" stroke="currentColor" strokeWidth="3"/>
        <path d="M125 55h10M130 50v10" stroke="currentColor" strokeWidth="2"/>
      </svg>
    ),
  },
  certificates: {
    icon: FileText,
    title: "Nenhum certificado ainda",
    description: "Complete cursos para receber certificados digitais verificáveis que você pode adicionar ao seu currículo!",
    actionLabel: "Ver cursos",
    gradient: "from-accent to-primary",
    illustration: (
      <svg className="w-32 h-32 text-muted-foreground/20" viewBox="0 0 200 200" fill="none">
        <rect x="35" y="45" width="130" height="90" rx="6" stroke="currentColor" strokeWidth="4"/>
        <path d="M55 75h90M55 95h60M55 115h40" stroke="currentColor" strokeWidth="3" strokeLinecap="round"/>
        <circle cx="135" cy="145" r="25" stroke="currentColor" strokeWidth="4"/>
        <path d="M125 145l7 7 13-13" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),
  },
  search: {
    icon: Search,
    title: "Nenhum resultado encontrado",
    description: "Não encontramos nada com esse termo. Tente usar palavras-chave diferentes ou verifique a ortografia.",
    actionLabel: "Limpar busca",
    gradient: "from-primary to-info",
    illustration: (
      <svg className="w-32 h-32 text-muted-foreground/20" viewBox="0 0 200 200" fill="none">
        <circle cx="85" cy="85" r="45" stroke="currentColor" strokeWidth="4"/>
        <path d="M120 120l40 40" stroke="currentColor" strokeWidth="6" strokeLinecap="round"/>
        <path d="M70 85h30M85 70v30" stroke="currentColor" strokeWidth="3" strokeLinecap="round"/>
      </svg>
    ),
  },
  discussions: {
    icon: MessageSquare,
    title: "Nenhuma discussão ainda",
    description: "Seja o primeiro a iniciar uma conversa! Tire dúvidas, compartilhe conhecimento e ajude seus colegas.",
    actionLabel: "Iniciar discussão",
    gradient: "from-info to-primary",
    illustration: (
      <svg className="w-32 h-32 text-muted-foreground/20" viewBox="0 0 200 200" fill="none">
        <path d="M40 50h90a10 10 0 0110 10v50a10 10 0 01-10 10h-40l-25 20v-20h-25a10 10 0 01-10-10v-50a10 10 0 0110-10z" stroke="currentColor" strokeWidth="4"/>
        <path d="M70 130h70a10 10 0 0110 10v30a10 10 0 01-10 10h-15v15l-20-15h-35a10 10 0 01-10-10v-30a10 10 0 0110-10z" stroke="currentColor" strokeWidth="4"/>
        <circle cx="65" cy="85" r="5" fill="currentColor"/>
        <circle cx="90" cy="85" r="5" fill="currentColor"/>
        <circle cx="115" cy="85" r="5" fill="currentColor"/>
      </svg>
    ),
  },
  leaderboard: {
    icon: Users,
    title: "Ranking em construção",
    description: "O ranking será atualizado assim que mais colaboradores começarem a estudar. Seja um dos primeiros!",
    actionLabel: "Começar a estudar",
    gradient: "from-warning to-accent",
    illustration: (
      <svg className="w-32 h-32 text-muted-foreground/20" viewBox="0 0 200 200" fill="none">
        <rect x="30" y="100" width="40" height="70" rx="4" stroke="currentColor" strokeWidth="4"/>
        <rect x="80" y="60" width="40" height="110" rx="4" stroke="currentColor" strokeWidth="4"/>
        <rect x="130" y="80" width="40" height="90" rx="4" stroke="currentColor" strokeWidth="4"/>
        <circle cx="100" cy="35" r="15" stroke="currentColor" strokeWidth="3"/>
        <path d="M95 35l5 5 10-10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),
  },
  streaks: {
    icon: Flame,
    title: "Comece sua sequência!",
    description: "Estude todos os dias para construir sua sequência de estudos e ganhar XP bônus!",
    actionLabel: "Estudar agora",
    gradient: "from-rose-500 to-orange-500",
    illustration: (
      <svg className="w-32 h-32 text-muted-foreground/20" viewBox="0 0 200 200" fill="none">
        <path d="M100 30c-10 40-40 60-40 100 0 30 20 50 40 50s40-20 40-50c0-40-30-60-40-100z" stroke="currentColor" strokeWidth="4"/>
        <path d="M100 90c-5 20-15 30-15 50 0 12 7 20 15 20s15-8 15-20c0-20-10-30-15-50z" stroke="currentColor" strokeWidth="3"/>
      </svg>
    ),
  },
  challenges: {
    icon: Target,
    title: "Nenhum desafio ativo",
    description: "Os desafios diários renovam todos os dias. Volte amanhã para novos desafios e recompensas!",
    gradient: "from-emerald-500 to-teal-500",
    illustration: (
      <svg className="w-32 h-32 text-muted-foreground/20" viewBox="0 0 200 200" fill="none">
        <circle cx="100" cy="100" r="60" stroke="currentColor" strokeWidth="4"/>
        <path d="M100 40v20M160 100h-20M100 160v-20M40 100h20" stroke="currentColor" strokeWidth="3"/>
        <path d="M100 70v60l30 20" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),
  },
  "learning-paths": {
    icon: Route,
    title: "Nenhuma trilha disponível",
    description: "Novas trilhas de aprendizado serão adicionadas em breve. Fique atento às novidades!",
    gradient: "from-primary to-accent",
    illustration: (
      <svg className="w-32 h-32 text-muted-foreground/20" viewBox="0 0 200 200" fill="none">
        <path d="M40 160c20-40 60-40 60-80s40-40 60 0" stroke="currentColor" strokeWidth="4" strokeLinecap="round"/>
        <circle cx="40" cy="160" r="10" stroke="currentColor" strokeWidth="3"/>
        <circle cx="100" cy="80" r="10" stroke="currentColor" strokeWidth="3"/>
        <circle cx="160" cy="80" r="10" fill="currentColor"/>
        <path d="M155 75l10 5-5 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
      </svg>
    ),
  },
  analytics: {
    icon: BarChart,
    title: "Sem dados ainda",
    description: "Complete mais cursos e quizzes para ver suas estatísticas detalhadas e áreas de conhecimento.",
    actionLabel: "Explorar cursos",
    gradient: "from-info to-accent",
    illustration: (
      <svg className="w-32 h-32 text-muted-foreground/20" viewBox="0 0 200 200" fill="none">
        <rect x="35" y="130" width="25" height="40" rx="4" stroke="currentColor" strokeWidth="4"/>
        <rect x="75" y="100" width="25" height="70" rx="4" stroke="currentColor" strokeWidth="4"/>
        <rect x="115" y="70" width="25" height="100" rx="4" stroke="currentColor" strokeWidth="4"/>
        <path d="M45 110l40-30 40 10 30-50" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
        <circle cx="155" cy="40" r="8" stroke="currentColor" strokeWidth="3"/>
      </svg>
    ),
  },
  favorites: {
    icon: Heart,
    title: "Sem favoritos ainda",
    description: "Marque cursos com o coração para acessá-los rapidamente. Comece explorando o catálogo!",
    actionLabel: "Explorar cursos",
    gradient: "from-rose-500 to-pink-500",
    illustration: (
      <svg className="w-32 h-32 text-muted-foreground/20" viewBox="0 0 200 200" fill="none">
        <path d="M100 170s-60-35-60-85a35 35 0 0160-25 35 35 0 0160 25c0 50-60 85-60 85z" stroke="currentColor" strokeWidth="4" strokeLinejoin="round"/>
        <path d="M70 80c0-10 8-18 18-18" stroke="currentColor" strokeWidth="3" strokeLinecap="round"/>
      </svg>
    ),
  },
  notes: {
    icon: PenLine,
    title: "Nenhuma anotação ainda",
    description: "Tome notas durante as aulas para revisar pontos importantes e fixar o aprendizado!",
    gradient: "from-amber-500 to-orange-500",
    illustration: (
      <svg className="w-32 h-32 text-muted-foreground/20" viewBox="0 0 200 200" fill="none">
        <rect x="45" y="30" width="100" height="140" rx="6" stroke="currentColor" strokeWidth="4"/>
        <path d="M65 60h70M65 85h70M65 110h70M65 135h45" stroke="currentColor" strokeWidth="3" strokeLinecap="round"/>
        <path d="M140 145l20-20 10 10-20 20-15 5z" stroke="currentColor" strokeWidth="3" strokeLinejoin="round"/>
      </svg>
    ),
  },
  goals: {
    icon: Flag,
    title: "Nenhuma meta definida",
    description: "Defina metas semanais ou mensais para se manter motivado e medir seu progresso!",
    actionLabel: "Definir meta",
    gradient: "from-emerald-500 to-teal-500",
    illustration: (
      <svg className="w-32 h-32 text-muted-foreground/20" viewBox="0 0 200 200" fill="none">
        <path d="M60 30v140" stroke="currentColor" strokeWidth="4" strokeLinecap="round"/>
        <path d="M60 35h90l-20 25 20 25H60" stroke="currentColor" strokeWidth="4" strokeLinejoin="round"/>
        <circle cx="60" cy="170" r="8" fill="currentColor"/>
      </svg>
    ),
  },
};

const EmptyState = ({
  type,
  title,
  description,
  actionLabel,
  onAction,
}: EmptyStateProps) => {
  const config = emptyStateConfigs[type];
  const Icon = config.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="flex flex-col items-center justify-center py-16 px-6 text-center"
    >
      {/* Illustration */}
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.1, duration: 0.4 }}
        className="relative mb-6"
      >
        {config.illustration}
        
        {/* Icon overlay */}
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.3, type: "spring", stiffness: 200 }}
          className={`absolute -bottom-2 -right-2 w-12 h-12 rounded-xl bg-gradient-to-br ${config.gradient} flex items-center justify-center shadow-lg`}
        >
          <Icon className="w-6 h-6 text-white" />
        </motion.div>
      </motion.div>

      {/* Text */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="space-y-2 max-w-md"
      >
        <h3 className="text-xl font-display font-bold text-foreground">
          {title || config.title}
        </h3>
        <p className="text-muted-foreground leading-relaxed">
          {description || config.description}
        </p>
      </motion.div>

      {/* Action Button */}
      {(actionLabel || ('actionLabel' in config && config.actionLabel)) && onAction && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mt-6"
        >
          <Button
            onClick={onAction}
            className={`bg-gradient-to-r ${config.gradient} text-white hover:opacity-90`}
          >
            {actionLabel || ('actionLabel' in config ? config.actionLabel : '')}
          </Button>
        </motion.div>
      )}
    </motion.div>
  );
};

export default EmptyState;
