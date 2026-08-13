import { Target, FolderOpen, Download, FileSpreadsheet, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { QuizOption, CategoryOption } from './types';

interface Props {
  selectedCategoryId: string;
  onCategoryChange: (value: string) => void;
  selectedQuizId: string;
  onQuizChange: (value: string) => void;
  quizOptions: QuizOption[];
  categoryOptions: CategoryOption[];
  onExportCSV: () => void;
  onExportPDF: () => void;
}

const QuizStatsFilters = ({
  selectedCategoryId, onCategoryChange, selectedQuizId, onQuizChange,
  quizOptions, categoryOptions, onExportCSV, onExportPDF
}: Props) => (
  <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
      <div className="flex items-center gap-2">
        <FolderOpen className="h-4 w-4 text-muted-foreground" />
        <span className="text-sm text-muted-foreground">Categoria:</span>
        <Select value={selectedCategoryId} onValueChange={(value) => { onCategoryChange(value); }}>
          <SelectTrigger className="w-[200px]"><SelectValue placeholder="Todas as categorias" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas as categorias</SelectItem>
            {categoryOptions.map((cat) => (<SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>))}
          </SelectContent>
        </Select>
      </div>
      <div className="flex items-center gap-2">
        <Target className="h-4 w-4 text-muted-foreground" />
        <span className="text-sm text-muted-foreground">Quiz:</span>
        <Select value={selectedQuizId} onValueChange={onQuizChange}>
          <SelectTrigger className="w-[280px]"><SelectValue placeholder="Todos os quizzes" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os quizzes</SelectItem>
            {quizOptions.filter(q => selectedCategoryId === 'all' || q.categoryId === selectedCategoryId)
              .map((quiz) => (<SelectItem key={quiz.id} value={quiz.id}>{quiz.title} - {quiz.courseTitle}</SelectItem>))}
          </SelectContent>
        </Select>
      </div>
    </div>
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="gap-2"><Download className="h-4 w-4" />Exportar</Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={onExportCSV} className="gap-2 cursor-pointer"><FileSpreadsheet className="h-4 w-4" />Exportar CSV</DropdownMenuItem>
        <DropdownMenuItem onClick={onExportPDF} className="gap-2 cursor-pointer"><FileText className="h-4 w-4" />Exportar PDF</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  </div>
);

export default QuizStatsFilters;
