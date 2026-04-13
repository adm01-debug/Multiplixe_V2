import { useState } from 'react';
import { Loader2 } from 'lucide-react';
import { useQuizStatsData } from './quiz-stats/useQuizStatsData';
import { exportToCSV, exportToPDF } from './quiz-stats/exportUtils';
import QuizStatsFilters from './quiz-stats/QuizStatsFilters';
import QuizStatsSummary from './quiz-stats/QuizStatsSummary';
import PerformanceDistribution from './quiz-stats/PerformanceDistribution';
import LowPerformanceAlerts from './quiz-stats/LowPerformanceAlerts';
import AlertHistoryPanel from './quiz-stats/AlertHistoryPanel';
import OverallStatsCards from './quiz-stats/OverallStatsCards';
import EvolutionChart from './quiz-stats/EvolutionChart';
import QuizComparisonChart from './quiz-stats/QuizComparisonChart';
import CourseStatsTable from './quiz-stats/CourseStatsTable';
import QuizRankings from './quiz-stats/QuizRankings';

export const QuizStats = () => {
  const [showAlertHistory, setShowAlertHistory] = useState(false);
  const {
    stats, dailyStats, rankings, alertHistory, loading,
    periodFilter, setPeriodFilter, selectedQuizId, setSelectedQuizId,
    selectedCategoryId, setSelectedCategoryId, quizOptions, categoryOptions,
    overallStats, registerAlert, resolveAlert
  } = useQuizStatsData();

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <QuizStatsFilters
        selectedCategoryId={selectedCategoryId}
        onCategoryChange={(v) => { setSelectedCategoryId(v); setSelectedQuizId('all'); }}
        selectedQuizId={selectedQuizId}
        onQuizChange={setSelectedQuizId}
        quizOptions={quizOptions}
        categoryOptions={categoryOptions}
        onExportCSV={() => exportToCSV(stats, overallStats)}
        onExportPDF={() => exportToPDF(stats, rankings, overallStats)}
      />
      <QuizStatsSummary stats={stats} overallStats={overallStats} />
      <PerformanceDistribution stats={stats} />
      <LowPerformanceAlerts
        stats={stats}
        onRegisterAlert={registerAlert}
        onToggleHistory={() => setShowAlertHistory(!showAlertHistory)}
        showAlertHistory={showAlertHistory}
      />
      {showAlertHistory && (
        <AlertHistoryPanel
          alertHistory={alertHistory}
          onClose={() => setShowAlertHistory(false)}
          onResolve={resolveAlert}
        />
      )}
      <OverallStatsCards overallStats={overallStats} />
      <EvolutionChart dailyStats={dailyStats} periodFilter={periodFilter} onPeriodChange={setPeriodFilter} />
      <QuizComparisonChart stats={stats} selectedQuizId={selectedQuizId} />
      <CourseStatsTable stats={stats} />
      <QuizRankings rankings={rankings} />
    </div>
  );
};
