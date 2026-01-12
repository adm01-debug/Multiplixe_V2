import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Download, FileText, Loader2, CheckCircle, Trophy, Clock, BookOpen, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useAuth } from "@/hooks/useAuth";
import { useUserXP } from "@/hooks/useUserXP";
import { useCertificates } from "@/hooks/useCertificates";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import jsPDF from "jspdf";

interface ExportProgressProps {
  trigger?: React.ReactNode;
}

const ExportProgress = ({ trigger }: ExportProgressProps) => {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();
  const { totalXP, currentLevel } = useUserXP();
  const { getUserCertificates } = useCertificates();

  const generatePDF = async () => {
    if (!user) return;

    setLoading(true);

    try {
      // Fetch additional data
      const [progressRes, achievementsRes, lessonsRes, streaksRes, userCertificates] = await Promise.all([
        supabase
          .from("user_course_progress")
          .select("*, courses(title, duration_minutes)")
          .eq("user_id", user.id),
        supabase
          .from("user_achievements")
          .select("*, achievements(*)")
          .eq("user_id", user.id),
        supabase
          .from("user_lesson_progress")
          .select("*")
          .eq("user_id", user.id)
          .eq("is_completed", true),
        supabase
          .from("user_streaks")
          .select("*")
          .eq("user_id", user.id)
          .single(),
        getUserCertificates(user.id),
      ]);

      const certificates = userCertificates || [];
      const userName = user.user_metadata?.full_name || user.email?.split("@")[0] || "Usuário";
      const coursesCompleted = progressRes.data?.filter((p) => p.progress_percentage === 100).length || 0;
      const coursesInProgress = progressRes.data?.filter((p) => p.progress_percentage < 100 && p.progress_percentage > 0).length || 0;
      const lessonsCompleted = lessonsRes.data?.length || 0;
      const achievementsUnlocked = achievementsRes.data?.length || 0;
      const currentStreak = streaksRes.data?.current_streak || 0;
      const longestStreak = streaksRes.data?.longest_streak || 0;

      // Calculate total hours
      const totalMinutes = progressRes.data?.reduce((acc, p) => {
        const duration = (p.courses as { duration_minutes?: number })?.duration_minutes || 0;
        return acc + (duration * (p.progress_percentage || 0)) / 100;
      }, 0) || 0;
      const totalHours = Math.round(totalMinutes / 60);

      // Create PDF
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();

      // Header
      doc.setFillColor(124, 58, 237);
      doc.rect(0, 0, pageWidth, 50, "F");
      
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(24);
      doc.setFont("helvetica", "bold");
      doc.text("MULTIPLIXE", pageWidth / 2, 25, { align: "center" });
      
      doc.setFontSize(12);
      doc.setFont("helvetica", "normal");
      doc.text("Relatório de Progresso", pageWidth / 2, 35, { align: "center" });

      // User Info
      doc.setTextColor(0, 0, 0);
      doc.setFontSize(16);
      doc.setFont("helvetica", "bold");
      doc.text(userName, 20, 70);
      
      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(100, 100, 100);
      doc.text(`Gerado em: ${new Date().toLocaleDateString("pt-BR")}`, 20, 78);
      doc.text(`Nível: ${currentLevel} | ${totalXP.toLocaleString()} XP`, 20, 85);

      // Stats Grid
      const statsY = 100;

      const stats = [
        { label: "Cursos Concluídos", value: coursesCompleted, icon: "🏆" },
        { label: "Cursos em Andamento", value: coursesInProgress, icon: "📚" },
        { label: "Aulas Assistidas", value: lessonsCompleted, icon: "▶️" },
        { label: "Horas de Estudo", value: totalHours, icon: "⏱️" },
        { label: "Conquistas", value: achievementsUnlocked, icon: "🎖️" },
        { label: "Certificados", value: certificates.length, icon: "📜" },
      ];

      stats.forEach((stat, i) => {
        const x = 20 + (i % 3) * 60;
        const y = statsY + Math.floor(i / 3) * 30;

        doc.setFillColor(248, 250, 252);
        doc.roundedRect(x - 5, y - 10, 55, 25, 3, 3, "F");

        doc.setTextColor(0, 0, 0);
        doc.setFontSize(14);
        doc.setFont("helvetica", "bold");
        doc.text(`${stat.icon} ${stat.value}`, x, y);

        doc.setFontSize(8);
        doc.setFont("helvetica", "normal");
        doc.setTextColor(100, 100, 100);
        doc.text(stat.label, x, y + 8);
      });

      // Streak Section
      const streakY = 180;
      doc.setFillColor(254, 243, 199);
      doc.roundedRect(15, streakY - 10, pageWidth - 30, 30, 5, 5, "F");

      doc.setTextColor(180, 83, 9);
      doc.setFontSize(12);
      doc.setFont("helvetica", "bold");
      doc.text(`🔥 Sequência Atual: ${currentStreak} dias`, 25, streakY + 5);
      doc.text(`⭐ Maior Sequência: ${longestStreak} dias`, 120, streakY + 5);

      // Certificates List
      if (certificates.length > 0) {
        const certY = 220;
        doc.setTextColor(0, 0, 0);
        doc.setFontSize(14);
        doc.setFont("helvetica", "bold");
        doc.text("📜 Certificados Conquistados", 20, certY);

        certificates.slice(0, 5).forEach((cert, i) => {
          doc.setFontSize(10);
          doc.setFont("helvetica", "normal");
          doc.setTextColor(60, 60, 60);
          doc.text(`• ${cert.course_title}`, 25, certY + 12 + i * 8);
          doc.setTextColor(120, 120, 120);
          doc.text(
            new Date(cert.issued_at).toLocaleDateString("pt-BR"),
            160,
            certY + 12 + i * 8
          );
        });

        if (certificates.length > 5) {
          doc.setTextColor(100, 100, 100);
          doc.text(`... e mais ${certificates.length - 5} certificados`, 25, certY + 12 + 5 * 8);
        }
      }

      // Footer
      const footerY = doc.internal.pageSize.getHeight() - 20;
      doc.setFillColor(248, 250, 252);
      doc.rect(0, footerY - 10, pageWidth, 30, "F");

      doc.setTextColor(100, 100, 100);
      doc.setFontSize(8);
      doc.text("MULTIPLIXE by Promo Brindes - Plataforma de Treinamento Corporativo", pageWidth / 2, footerY, { align: "center" });

      // Save
      doc.save(`progresso-${userName.toLowerCase().replace(/\s+/g, "-")}-${new Date().toISOString().split("T")[0]}.pdf`);
      toast.success("Relatório exportado com sucesso!");
      setOpen(false);
    } catch (error) {
      console.error("Error generating PDF:", error);
      toast.error("Erro ao gerar relatório");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" className="gap-2">
            <Download className="h-4 w-4" />
            Exportar Progresso
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            Exportar Progresso
          </DialogTitle>
          <DialogDescription>
            Gere um relatório PDF com seu progresso na plataforma
          </DialogDescription>
        </DialogHeader>

        {/* Preview */}
        <div className="space-y-4 py-4">
          <p className="text-sm text-muted-foreground">
            O relatório inclui:
          </p>
          <ul className="space-y-2">
            {[
              { icon: Trophy, text: "Cursos concluídos e em andamento" },
              { icon: Clock, text: "Horas totais de estudo" },
              { icon: BookOpen, text: "Aulas assistidas" },
              { icon: Zap, text: "XP e nível atual" },
              { icon: CheckCircle, text: "Conquistas e certificados" },
            ].map((item, i) => (
              <motion.li
                key={i}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.1 }}
                className="flex items-center gap-3 text-sm"
              >
                <item.icon className="h-4 w-4 text-primary" />
                {item.text}
              </motion.li>
            ))}
          </ul>
        </div>

        <Button onClick={generatePDF} disabled={loading} className="w-full gap-2">
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Gerando PDF...
            </>
          ) : (
            <>
              <Download className="h-4 w-4" />
              Baixar Relatório PDF
            </>
          )}
        </Button>
      </DialogContent>
    </Dialog>
  );
};

export default ExportProgress;
