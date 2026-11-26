import { useState } from "react";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { CalendarCheck, CalendarPlus, Check, Clock, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { useCourses } from "@/hooks/useCachedQuery";
import { useStudySchedule, type StudyScheduleRow } from "@/hooks/useStudySchedule";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const DURATIONS = [15, 30, 45, 60, 90, 120];
const NO_COURSE = "none";

const StudySchedulePanel = () => {
  const { schedules, isLoading, createSchedule, isSaving, setCompleted, removeSchedule } = useStudySchedule();
  const { data: coursesData } = useCourses();
  const courses: Array<{ id: string; title: string }> = coursesData ?? [];

  const [open, setOpen] = useState(false);
  const [date, setDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [time, setTime] = useState("");
  const [duration, setDuration] = useState("30");
  const [courseId, setCourseId] = useState(NO_COURSE);

  const today = format(new Date(), "yyyy-MM-dd");
  const pending = schedules.filter((item) => !item.completed);
  const completed = schedules.filter((item) => item.completed).slice(-5).reverse();

  const labelFor = (item: StudyScheduleRow) =>
    `${item.courses?.title ?? "Estudo livre"} em ${format(parseISO(item.scheduled_date), "dd/MM")}`;

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!date) {
      toast.error("Escolha uma data para o estudo");
      return;
    }

    try {
      await createSchedule({
        scheduled_date: date,
        scheduled_time: time ? `${time}:00` : null,
        duration_minutes: Number(duration),
        course_id: courseId === NO_COURSE ? null : courseId,
      });
      setOpen(false);
      setTime("");
      setDuration("30");
      setCourseId(NO_COURSE);
    } catch {
      // o toast de erro já é exibido pelo hook
    }
  };

  const renderItem = (item: StudyScheduleRow) => (
    <li
      key={item.id}
      className="flex items-center gap-3 rounded-xl border border-border p-3"
    >
      <Button
        variant="ghost"
        size="icon"
        aria-pressed={item.completed}
        aria-label={
          item.completed
            ? `Reabrir ${labelFor(item)}`
            : `Marcar ${labelFor(item)} como concluído`
        }
        onClick={() => setCompleted(item.id, !item.completed)}
        className={cn(
          "h-8 w-8 shrink-0 rounded-lg border border-border",
          item.completed ? "text-emerald-500" : "text-muted-foreground"
        )}
      >
        <Check className="w-4 h-4" />
      </Button>

      <div className="flex-1 min-w-0">
        <p
          className={cn(
            "text-sm font-medium truncate text-foreground",
            item.completed && "line-through text-muted-foreground"
          )}
        >
          {item.courses?.title ?? "Estudo livre"}
        </p>
        <p className="text-xs text-muted-foreground flex flex-wrap items-center gap-x-3 gap-y-1">
          <span>{format(parseISO(item.scheduled_date), "dd 'de' MMMM", { locale: ptBR })}</span>
          {item.scheduled_time && (
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {item.scheduled_time.slice(0, 5)}
            </span>
          )}
          <span>{item.duration_minutes} min</span>
        </p>
      </div>

      <Button
        variant="ghost"
        size="icon"
        aria-label={`Remover agendamento de ${labelFor(item)}`}
        onClick={() => removeSchedule(item.id)}
        className="h-8 w-8 shrink-0 text-muted-foreground hover:text-destructive"
      >
        <Trash2 className="w-4 h-4" />
      </Button>
    </li>
  );

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between gap-2">
          <CardTitle className="text-lg flex items-center gap-2">
            <CalendarCheck className="w-5 h-5 text-primary" />
            Seus blocos de estudo
          </CardTitle>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="rounded-xl gap-2">
                <CalendarPlus className="w-4 h-4" />
                Agendar
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Agendar estudo</DialogTitle>
                <DialogDescription>
                  Escolha quando vai estudar. O bloco aparece aqui e pode ser marcado como concluído depois.
                </DialogDescription>
              </DialogHeader>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="study-course">Curso (opcional)</Label>
                  <Select value={courseId} onValueChange={setCourseId}>
                    <SelectTrigger id="study-course" className="rounded-xl">
                      <SelectValue placeholder="Escolha um curso" />
                    </SelectTrigger>
                    <SelectContent className="bg-popover z-50">
                      <SelectItem value={NO_COURSE}>Estudo livre</SelectItem>
                      {courses.map((course) => (
                        <SelectItem key={course.id} value={course.id}>
                          {course.title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label htmlFor="study-date">Data</Label>
                    <Input
                      id="study-date"
                      type="date"
                      required
                      min={today}
                      value={date}
                      onChange={(event) => setDate(event.target.value)}
                      className="rounded-xl"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="study-time">Hora (opcional)</Label>
                    <Input
                      id="study-time"
                      type="time"
                      value={time}
                      onChange={(event) => setTime(event.target.value)}
                      className="rounded-xl"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="study-duration">Duração</Label>
                  <Select value={duration} onValueChange={setDuration}>
                    <SelectTrigger id="study-duration" className="rounded-xl">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-popover z-50">
                      {DURATIONS.map((minutes) => (
                        <SelectItem key={minutes} value={String(minutes)}>
                          {minutes} minutos
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <DialogFooter>
                  <Button type="submit" disabled={isSaving} className="rounded-xl gap-2">
                    {isSaving ? "Agendando..." : "Agendar estudo"}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>

      <CardContent>
        {isLoading ? (
          <div className="space-y-2">
            <Skeleton className="h-14 w-full rounded-xl" />
            <Skeleton className="h-14 w-full rounded-xl" />
          </div>
        ) : pending.length === 0 && completed.length === 0 ? (
          <p className="text-sm text-muted-foreground py-6 text-center">
            Nenhum bloco de estudo agendado. Use "Agendar" para planejar sua próxima sessão.
          </p>
        ) : (
          <div className="space-y-4">
            {pending.length > 0 && (
              <ul className="space-y-2">{pending.map(renderItem)}</ul>
            )}
            {completed.length > 0 && (
              <div>
                <p className="text-xs font-medium text-muted-foreground mb-2">Concluídos</p>
                <ul className="space-y-2">{completed.map(renderItem)}</ul>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default StudySchedulePanel;