import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { toast } from 'sonner';
import type { CourseQuizStat, QuizRanking, OverallStats } from './types';

export const exportToCSV = (stats: CourseQuizStat[], overallStats: OverallStats) => {
  try {
    const headers = ['Curso', 'Quiz', 'Tentativas', 'Aprovações', 'Reprovações', 'Usuários Únicos', 'Média (%)', 'Taxa Aprovação (%)'];
    const rows: (string | number)[][] = stats.map(stat => [
      stat.courseTitle, stat.quizTitle, stat.totalAttempts, stat.passedAttempts,
      stat.totalAttempts - stat.passedAttempts, stat.uniqueUsers, stat.averageScore, stat.passingRate
    ]);
    rows.push([]);
    rows.push(['RESUMO GERAL', '', overallStats.totalAttempts, overallStats.totalPassed,
      overallStats.totalAttempts - overallStats.totalPassed, '', overallStats.averageScore, overallStats.overallPassingRate]);
    const csvContent = [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `estatisticas-quizzes-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast.success('CSV exportado com sucesso!');
  } catch { toast.error('Erro ao exportar CSV'); }
};

export const exportToPDF = (stats: CourseQuizStat[], rankings: QuizRanking[], overallStats: OverallStats) => {
  try {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    doc.setFontSize(18);
    doc.text('Estatísticas de Quizzes', pageWidth / 2, 20, { align: 'center' });
    doc.setFontSize(10);
    doc.text(`Gerado em: ${new Date().toLocaleDateString('pt-BR')}`, pageWidth / 2, 28, { align: 'center' });
    doc.setFontSize(14);
    doc.text('Resumo Geral', 14, 40);
    doc.setFontSize(10);
    doc.text(`Total de Tentativas: ${overallStats.totalAttempts}`, 14, 50);
    doc.text(`Aprovações: ${overallStats.totalPassed}`, 14, 56);
    doc.text(`Média Geral: ${overallStats.averageScore}%`, 14, 62);
    doc.text(`Taxa de Aprovação: ${overallStats.overallPassingRate}%`, 14, 68);
    doc.setFontSize(14);
    doc.text('Estatísticas por Curso', 14, 82);
    autoTable(doc, {
      startY: 88,
      head: [['Curso', 'Quiz', 'Tentativas', 'Aprovações', 'Média', 'Taxa Aprov.']],
      body: stats.map(stat => [
        stat.courseTitle.length > 25 ? stat.courseTitle.substring(0, 25) + '...' : stat.courseTitle,
        stat.quizTitle.length > 20 ? stat.quizTitle.substring(0, 20) + '...' : stat.quizTitle,
        stat.totalAttempts.toString(), stat.passedAttempts.toString(),
        `${stat.averageScore}%`, `${stat.passingRate}%`
      ]),
      theme: 'striped',
      headStyles: { fillColor: [59, 130, 246] },
      styles: { fontSize: 8 },
      columnStyles: { 0: { cellWidth: 45 }, 1: { cellWidth: 40 }, 2: { cellWidth: 22 }, 3: { cellWidth: 25 }, 4: { cellWidth: 20 }, 5: { cellWidth: 28 } }
    });
    if (rankings.length > 0) {
      doc.addPage();
      doc.setFontSize(14);
      doc.text('Rankings por Quiz', 14, 20);
      let yPos = 30;
      rankings.slice(0, 5).forEach((ranking) => {
        if (yPos > 250) { doc.addPage(); yPos = 20; }
        doc.setFontSize(11);
        doc.text(`${ranking.quizTitle} - ${ranking.courseTitle}`, 14, yPos);
        yPos += 6;
        ranking.topUsers.slice(0, 3).forEach((user, userIdx) => {
          doc.setFontSize(9);
          doc.text(`${userIdx + 1}º ${user.userName}: ${user.bestScore}%`, 20, yPos);
          yPos += 5;
        });
        yPos += 6;
      });
    }
    doc.save(`estatisticas-quizzes-${new Date().toISOString().split('T')[0]}.pdf`);
    toast.success('PDF exportado com sucesso!');
  } catch { toast.error('Erro ao exportar PDF'); }
};
