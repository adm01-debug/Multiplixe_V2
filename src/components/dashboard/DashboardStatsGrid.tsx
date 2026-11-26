import { motion } from 'framer-motion';
import { ChevronRight, Info } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import IconTooltip from '@/components/ui/icon-tooltip';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.1, delayChildren: 0.1 } }
} as const;

const statCardVariants = {
  hidden: { opacity: 0, scale: 0.9 },
  visible: { opacity: 1, scale: 1, transition: { type: "spring" as const, stiffness: 100, damping: 15 } },
  hover: { y: -8, scale: 1.02, transition: { type: "spring" as const, stiffness: 400, damping: 25 } }
};

export interface StatItem {
  label: string;
  value: string | number;
  subtitle: string;
  icon: LucideIcon;
  gradient: string;
  glowColor: string;
  tooltip?: string;
}

interface Props {
  stats: StatItem[];
}

const DashboardStatsGrid = ({ stats }: Props) => (
  <motion.div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-12" variants={containerVariants} initial="hidden" animate="visible">
    {stats.map((stat) => {
      const IconComponent = stat.icon;
            const card = (
        <motion.div key={stat.label} variants={statCardVariants} whileHover="hover" whileTap={{ scale: 0.98 }}
          className={`group relative rounded-3xl bg-card/80 backdrop-blur-sm border border-border/50 p-6 overflow-hidden cursor-pointer ${stat.glowColor} neon-card`}>
          <div className={`absolute inset-0 bg-gradient-to-br ${stat.gradient} opacity-0 group-hover:opacity-10 dark:group-hover:opacity-20 transition-opacity duration-500`} />
          <div className="relative z-10">
            <div className="flex items-start justify-between mb-4">
              <motion.div className={`p-3 rounded-2xl bg-gradient-to-br ${stat.gradient} shadow-lg ${stat.glowColor} dark:shadow-[0_0_25px_currentColor]`}
                whileHover={{ scale: 1.1, rotate: 5 }} transition={{ type: "spring", stiffness: 400, damping: 17 }}>
                <IconComponent className="h-6 w-6 text-white" />
              </motion.div>
                    {stat.tooltip ? (
                      <IconTooltip label={stat.tooltip} side="left">
                        <span className="rounded-full p-1 text-muted-foreground/60 hover:text-primary transition-colors" aria-label={stat.tooltip}>
                          <Info className="h-4 w-4" />
                        </span>
                      </IconTooltip>
                    ) : (
                      <ChevronRight className="h-5 w-5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity neon-icon" />
                    )}
            </div>
            <motion.div className="text-4xl font-display font-bold text-foreground mb-1 dark:drop-shadow-[0_0_10px_currentColor]"
              initial={{ scale: 1 }} animate={{ scale: [1, 1.02, 1] }} transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}>
              {stat.value}
            </motion.div>
            <p className="text-sm font-medium text-muted-foreground mb-1">{stat.label}</p>
            <p className="text-xs text-muted-foreground/70">{stat.subtitle}</p>
          </div>
        </motion.div>
      );
            return card;
    })}
  </motion.div>
);

export default DashboardStatsGrid;
