import { useMemo, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { COURSE_CSV_HEADERS, COURSE_CSV_TEMPLATE, applyExistingSlugs, parseCourseCsv, type CsvCourseRow } from '@/lib/courseCsv';
import { AlertCircle, CheckCircle2, Download, FileUp, Loader2, Upload } from 'lucide-react';
import { toast } from 'sonner';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  categories: { id: string; name: string }[];
  onImported: () => void;
}

interface ImportReport {
  created: number;
  failed: { line: number; title: string; message: string }[];
}

const CourseCsvImport = ({ open, onOpenChange, categories, onImported }: Props) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [rows, setRows] = useState<CsvCourseRow[]>([]);
  const [invalidCount, setInvalidCount] = useState(0);
  const [importing, setImporting] = useState(false);
  const [report, setReport] = useState<ImportReport | null>(null);

  const validRows = useMemo(() => rows.filter((row) => row.errors.length === 0), [rows]);

  const reset = () => {
    setFileName(null);
    setRows([]);
    setInvalidCount(0);
    setReport(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleClose = (next: boolean) => {
    if (importing) return;
    if (!next) reset();
    onOpenChange(next);
  };

  const handleFile = async (file: File | undefined) => {
    if (!file) return;
    setReport(null);
    setFileName(file.name);
    const text = await file.text();
    const parsed = parseCourseCsv(text, categories);
    const { data: existing } = await supabase.from('courses').select('slug');
    const merged = applyExistingSlugs(parsed.rows, (existing ?? []).map((course) => course.slug));
    setRows(merged.rows);
    setInvalidCount(merged.invalidCount);
    if (merged.rows.length === 0) {
      toast.error('Nenhuma linha de curso encontrada no arquivo');
    }
  };

  const handleDownloadTemplate = () => {
    const blob = new Blob(['\uFEFF' + COURSE_CSV_TEMPLATE], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = 'modelo-importacao-cursos.csv';
    anchor.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = async () => {
    if (validRows.length === 0 || importing) return;
    setImporting(true);
    const failures: ImportReport['failed'] = [];
    let created = 0;

    for (const row of validRows) {
      const { error } = await supabase.from('courses').insert({
        title: row.title,
        slug: row.slug,
        description: row.description,
        category_id: row.category_id,
        level: row.level,
        duration_minutes: row.duration_minutes,
        instructor_name: row.instructor_name,
        is_published: row.is_published,
        is_featured: row.is_featured,
      });
      if (error) {
        failures.push({ line: row.line, title: row.title, message: error.message });
      } else {
        created += 1;
      }
    }

    setReport({ created, failed: failures });
    if (created > 0) {
      onImported();
      toast.success(`${created} curso(s) importado(s)`);
    }
    if (failures.length > 0 && created === 0) {
      toast.error('Nenhum curso foi importado');
    }
    setImporting(false);
  };

  const previewRows = rows.slice(0, 50);

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Importar cursos via CSV</DialogTitle>
          <DialogDescription>
            Envie um arquivo com uma linha por curso. Colunas: {COURSE_CSV_HEADERS.join(', ')}. Separador ; , ou tab.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-3">
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv,text/csv,text/plain"
              className="sr-only"
              id="course-csv-input"
              onChange={(event) => handleFile(event.target.files?.[0])}
            />
            <Button variant="outline" onClick={() => fileInputRef.current?.click()} disabled={importing}>
              <FileUp className="h-4 w-4 mr-2" /> Escolher arquivo
            </Button>
            <Button variant="ghost" onClick={handleDownloadTemplate} disabled={importing}>
              <Download className="h-4 w-4 mr-2" /> Baixar modelo
            </Button>
            {fileName && <span className="text-sm text-muted-foreground">{fileName}</span>}
          </div>

          {rows.length > 0 && (
            <div className="flex flex-wrap items-center gap-2 text-sm">
              <Badge variant="secondary">{rows.length} linha(s)</Badge>
              <Badge className="bg-emerald-500/15 text-emerald-600 border-emerald-500/30" variant="outline">
                <CheckCircle2 className="h-3 w-3 mr-1" /> {validRows.length} valida(s)
              </Badge>
              {invalidCount > 0 && (
                <Badge className="bg-destructive/15 text-destructive border-destructive/30" variant="outline">
                  <AlertCircle className="h-3 w-3 mr-1" /> {invalidCount} com erro
                </Badge>
              )}
            </div>
          )}

          {rows.length > 0 && (
            <div className="rounded-xl border border-border/60 overflow-hidden">
              <div className="max-h-72 overflow-auto">
                <table className="w-full text-sm">
                  <thead className="bg-muted/50 sticky top-0">
                    <tr>
                      <th className="text-left px-3 py-2 font-medium">Linha</th>
                      <th className="text-left px-3 py-2 font-medium">Titulo</th>
                      <th className="text-left px-3 py-2 font-medium">Slug</th>
                      <th className="text-left px-3 py-2 font-medium">Categoria</th>
                      <th className="text-left px-3 py-2 font-medium">Nivel</th>
                      <th className="text-left px-3 py-2 font-medium">Min</th>
                      <th className="text-left px-3 py-2 font-medium">Situacao</th>
                    </tr>
                  </thead>
                  <tbody>
                    {previewRows.map((row) => (
                      <tr key={row.line} className="border-t border-border/40">
                        <td className="px-3 py-2 text-muted-foreground">{row.line}</td>
                        <td className="px-3 py-2">{row.title || '—'}</td>
                        <td className="px-3 py-2 text-muted-foreground">{row.slug || '—'}</td>
                        <td className="px-3 py-2 text-muted-foreground">{row.category_name ?? '—'}</td>
                        <td className="px-3 py-2 text-muted-foreground">{row.level}</td>
                        <td className="px-3 py-2 text-muted-foreground">{row.duration_minutes}</td>
                        <td className="px-3 py-2">
                          {row.errors.length === 0 ? (
                            <span className="text-emerald-600">OK</span>
                          ) : (
                            <span className="text-destructive">{row.errors.join('; ')}</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {rows.length > previewRows.length && (
                <p className="px-3 py-2 text-xs text-muted-foreground border-t border-border/40">
                  Mostrando as primeiras {previewRows.length} de {rows.length} linhas.
                </p>
              )}
            </div>
          )}

          {report && (
            <div className="rounded-xl border border-border/60 p-4 space-y-2 text-sm">
              <p className="font-medium text-foreground">Relatorio da importacao</p>
              <p className="text-emerald-600">{report.created} curso(s) criado(s)</p>
              {report.failed.length > 0 && (
                <div className="space-y-1">
                  <p className="text-destructive">{report.failed.length} falha(s)</p>
                  <ul className="list-disc pl-5 text-muted-foreground">
                    {report.failed.map((failure) => (
                      <li key={`${failure.line}-${failure.title}`}>
                        Linha {failure.line} — {failure.title}: {failure.message}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => handleClose(false)} disabled={importing}>Fechar</Button>
          <Button onClick={handleImport} disabled={validRows.length === 0 || importing}>
            {importing ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Upload className="h-4 w-4 mr-2" />}
            Importar {validRows.length > 0 ? `${validRows.length} curso(s)` : ''}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default CourseCsvImport;