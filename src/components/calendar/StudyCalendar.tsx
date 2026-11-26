import { useMemo } from "react";
import { motion } from "framer-motion";
import { format, eachDayOfInterval, startOfMonth, endOfMonth, isSameDay, isSameMonth, isToday, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { ChevronLeft, ChevronRight, BookOpen, CheckCircle2, Trophy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

interface ScheduleItem {
  id: string;
  date: string;
  type: "lesson" | "quiz" | "achievement";
  title: string;
  completed?: boolean;
}

interface StudyCalendarProps {
  currentMonth: Date;
  onMonthChange: (date: Date) => void;
  scheduleItems: ScheduleItem[];
  onDayClick?: (date: Date) => void;
}

const StudyCalendar = ({
  currentMonth,
  onMonthChange,
  scheduleItems,
  onDayClick,
}: StudyCalendarProps) => {
  const days = useMemo(() => {
    const start = startOfMonth(currentMonth);
    const end = endOfMonth(currentMonth);
    return eachDayOfInterval({ start, end });
  }, [currentMonth]);

  const weekDays = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

  const getItemsForDay = (date: Date) => {
    return scheduleItems.filter((item) => {
      const itemDate = parseISO(item.date);
      return isSameDay(itemDate, date);
    });
  };

  const getItemIcon = (type: string) => {
    switch (type) {
      case "lesson":
        return <BookOpen className="w-3 h-3" />;
      case "quiz":
        return <CheckCircle2 className="w-3 h-3" />;
      case "achievement":
        return <Trophy className="w-3 h-3" />;
      default:
        return null;
    }
  };

  const getItemColor = (type: string, completed?: boolean) => {
    if (completed) return "bg-emerald-500";
    switch (type) {
      case "lesson":
        return "bg-primary";
      case "quiz":
        return "bg-amber-500";
      case "achievement":
        return "bg-purple-500";
      default:
        return "bg-muted";
    }
  };

  const previousMonth = () => {
    const prev = new Date(currentMonth);
    prev.setMonth(prev.getMonth() - 1);
    onMonthChange(prev);
  };

  const nextMonth = () => {
    const next = new Date(currentMonth);
    next.setMonth(next.getMonth() + 1);
    onMonthChange(next);
  };

  // Calculate padding days for the first week
  const firstDayOfMonth = startOfMonth(currentMonth).getDay();
  const paddingDays = Array(firstDayOfMonth).fill(null);

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">
            {format(currentMonth, "MMMM yyyy", { locale: ptBR })}
          </CardTitle>
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" aria-label="Mês anterior" onClick={previousMonth} className="h-8 w-8">
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="icon" aria-label="Próximo mês" onClick={nextMonth} className="h-8 w-8">
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {/* Week days header */}
        <div className="grid grid-cols-7 gap-1 mb-2">
          {weekDays.map((day) => (
            <div
              key={day}
              className="text-center text-xs font-medium text-muted-foreground py-2"
            >
              {day}
            </div>
          ))}
        </div>

        {/* Calendar grid */}
        <div className="grid grid-cols-7 gap-1">
          {/* Padding days */}
          {paddingDays.map((_, index) => (
            <div key={`pad-${index}`} className="aspect-square" />
          ))}

          {/* Actual days */}
          {days.map((day, index) => {
            const dayItems = getItemsForDay(day);
            const hasItems = dayItems.length > 0;
            const isCurrentDay = isToday(day);
            const isCurrentMonth = isSameMonth(day, currentMonth);

            return (
              <motion.button
                key={day.toISOString()}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.01 }}
                onClick={() => onDayClick?.(day)}
                className={cn(
                  "aspect-square relative p-1 rounded-lg transition-all",
                  "hover:bg-accent/50 focus:outline-none focus:ring-2 focus:ring-primary",
                  isCurrentDay && "ring-2 ring-primary",
                  !isCurrentMonth && "opacity-50"
                )}
              >
                <span
                  className={cn(
                    "text-sm font-medium",
                    isCurrentDay && "text-primary font-bold"
                  )}
                >
                  {format(day, "d")}
                </span>

                {/* Activity indicators */}
                {hasItems && (
                  <div className="absolute bottom-1 left-1/2 -translate-x-1/2 flex gap-0.5">
                    {dayItems.slice(0, 3).map((item, i) => (
                      <Tooltip key={item.id}>
                        <TooltipTrigger asChild>
                          <div
                            className={cn(
                              "w-1.5 h-1.5 rounded-full",
                              getItemColor(item.type, item.completed)
                            )}
                          />
                        </TooltipTrigger>
                        <TooltipContent side="top" className="text-xs">
                          <div className="flex items-center gap-1">
                            {getItemIcon(item.type)}
                            {item.title}
                          </div>
                        </TooltipContent>
                      </Tooltip>
                    ))}
                    {dayItems.length > 3 && (
                      <span className="text-[8px] text-muted-foreground">
                        +{dayItems.length - 3}
                      </span>
                    )}
                  </div>
                )}
              </motion.button>
            );
          })}
        </div>

        {/* Legend */}
        <div className="flex items-center justify-center gap-4 mt-4 pt-4 border-t border-border">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <div className="w-2 h-2 rounded-full bg-primary" />
            Aula
          </div>
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <div className="w-2 h-2 rounded-full bg-amber-500" />
            Quiz
          </div>
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <div className="w-2 h-2 rounded-full bg-purple-500" />
            Conquista
          </div>
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <div className="w-2 h-2 rounded-full bg-emerald-500" />
            Concluído
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default StudyCalendar;
