import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Upload, 
  FileText, 
  AlertCircle, 
  CheckCircle2, 
  Download,
  X,
  FileWarning
} from 'lucide-react';
import { useState } from 'react';
import { importCSV, ImportResult, generateTemplateCSV } from '@/lib/csvImporter';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { z } from 'zod';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';

interface CSVImporterProps<T extends z.ZodRawShape> {
  schema: z.ZodObject<T>;
  onImport: (data: z.infer<z.ZodObject<T>>[]) => Promise<void>;
  entityName?: string;
  exampleData?: Partial<z.infer<z.ZodObject<T>>>[];
  maxErrors?: number;
}

/**
 * Componente completo para importação de CSV
 * 
 * Features:
 * - Upload de arquivo com drag & drop
 * - Validação com Zod schema
 * - Preview de dados válidos
 * - Lista detalhada de erros
 * - Download de template
 * - Progresso visual
 * - Feedback claro de sucesso/erro
 * 
 * @example
 * const schema = z.object({
 *   title: z.string().min(1, 'Título obrigatório'),
 *   description: z.string(),
 *   duration: z.coerce.number().positive('Duração deve ser positiva'),
 * });
 * 
 * <CSVImporter
 *   schema={schema}
 *   onImport={async (data) => {
 *     await supabase.from('courses').insert(data);
 *   }}
 *   entityName="cursos"
 *   exampleData={[{
 *     title: 'Curso Exemplo',
 *     description: 'Descrição do curso',
 *     duration: 60
 *   }]}
 * />
 */
export function CSVImporter<T extends z.ZodRawShape>({
  schema,
  onImport,
  entityName = 'registros',
  exampleData = [],
  maxErrors = 20,
}: CSVImporterProps<T>) {
  const [file, setFile] = useState<File | null>(null);
  const [result, setResult] = useState<ImportResult<z.infer<z.ZodObject<T>>> | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [progress, setProgress] = useState(0);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    setFile(selectedFile);
    setIsProcessing(true);
    setProgress(10);

    try {
      const importResult = await importCSV(selectedFile, schema, {
        trimValues: true,
        skipFirstRow: false,
      });
      
      setResult(importResult);
      setProgress(50);
    } catch (error) {
      console.error('Erro ao ler CSV:', error);
      alert('Erro ao ler arquivo CSV. Verifique o formato.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleConfirmImport = async () => {
    if (!result || result.validCount === 0) return;

    setIsImporting(true);
    setProgress(60);

    try {
      await onImport(result.success);
      setProgress(100);
      
      // Reset após sucesso
      setTimeout(() => {
        setFile(null);
        setResult(null);
        setProgress(0);
      }, 2000);
    } catch (error) {
      console.error('Erro ao importar:', error);
      alert('Erro ao importar dados. Tente novamente.');
    } finally {
      setIsImporting(false);
    }
  };

  const handleDownloadTemplate = () => {
    const template = generateTemplateCSV(schema, exampleData);
    const url = URL.createObjectURL(template);
    const a = document.createElement('a');
    a.href = url;
    a.download = `template_${entityName}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleReset = () => {
    setFile(null);
    setResult(null);
    setProgress(0);
  };

  return (
    <div className="space-y-4">
      {/* Header com ações */}
      <div className="flex gap-2">
        <label className="flex-1">
          <Input
            type="file"
            accept=".csv"
            onChange={handleFileChange}
            disabled={isProcessing || isImporting}
            className="cursor-pointer"
          />
        </label>
        
        <Button 
          variant="outline" 
          onClick={handleDownloadTemplate}
          title="Baixar template CSV"
        >
          <Download className="h-4 w-4 mr-2" />
          Template
        </Button>

        {file && (
          <Button 
            variant="ghost" 
            size="icon"
            onClick={handleReset}
            title="Limpar"
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>

      {/* Progresso */}
      {(isProcessing || isImporting) && (
        <Progress value={progress} className="h-2" />
      )}

      {/* Resultado da validação */}
      {result && (
        <div className="space-y-4">
          {/* Resumo */}
          <Alert variant={result.errorCount === 0 ? 'default' : 'destructive'}>
            {result.errorCount === 0 ? (
              <>
                <CheckCircle2 className="h-4 w-4" />
                <AlertTitle>Arquivo validado com sucesso!</AlertTitle>
                <AlertDescription>
                  {result.validCount} {entityName} válidos encontrados
                </AlertDescription>
              </>
            ) : (
              <>
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Arquivo com erros</AlertTitle>
                <AlertDescription className="space-y-1">
                  <div className="flex gap-4">
                    <Badge variant="default">
                      {result.validCount} válidos
                    </Badge>
                    <Badge variant="destructive">
                      {result.errorCount} erros
                    </Badge>
                  </div>
                  <p className="text-sm">
                    Corrija os erros abaixo e faça o upload novamente
                  </p>
                </AlertDescription>
              </>
            )}
          </Alert>

          {/* Lista de erros */}
          {result.errorCount > 0 && (
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-2 mb-3">
                  <FileWarning className="h-4 w-4 text-destructive" />
                  <h3 className="font-semibold">
                    Erros Encontrados ({result.errorCount})
                  </h3>
                </div>
                
                <ScrollArea className="h-60">
                  <div className="space-y-2">
                    {result.errors.slice(0, maxErrors).map((err, i) => (
                      <div 
                        key={i}
                        className="p-3 bg-destructive/10 rounded-md text-sm border border-destructive/20"
                      >
                        <div className="flex items-start gap-2">
                          <Badge variant="outline" className="mt-0.5">
                            Linha {err.row}
                          </Badge>
                          <div className="flex-1 space-y-1">
                            <div className="font-medium text-destructive">
                              Campo: {err.field}
                            </div>
                            <div className="text-muted-foreground">
                              Erro: {err.error}
                            </div>
                            {err.value !== undefined && (
                              <div className="text-xs text-muted-foreground">
                                Valor recebido: <code className="bg-muted px-1 rounded">
                                  {String(err.value) || '(vazio)'}
                                </code>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                    
                    {result.errorCount > maxErrors && (
                      <div className="text-center text-sm text-muted-foreground py-2">
                        + {result.errorCount - maxErrors} erros não exibidos
                      </div>
                    )}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          )}

          {/* Preview dos dados válidos (primeiros 5) */}
          {result.validCount > 0 && (
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-2 mb-3">
                  <FileText className="h-4 w-4 text-green-600" />
                  <h3 className="font-semibold">
                    Preview dos Dados ({Math.min(5, result.validCount)} de {result.validCount})
                  </h3>
                </div>
                
                <div className="space-y-2">
                  {result.success.slice(0, 5).map((item, i) => (
                    <div 
                      key={i}
                      className="p-3 bg-green-50 dark:bg-green-950 rounded-md text-sm border"
                    >
                      <pre className="text-xs overflow-x-auto">
                        {JSON.stringify(item, null, 2)}
                      </pre>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Botão de importação */}
          {result.validCount > 0 && (
            <Button 
              onClick={handleConfirmImport} 
              disabled={isImporting}
              className="w-full"
              size="lg"
            >
              <Upload className="h-4 w-4 mr-2" />
              {isImporting 
                ? 'Importando...' 
                : `Importar ${result.validCount} ${entityName}`
              }
            </Button>
          )}
        </div>
      )}

      {/* Empty state */}
      {!file && !result && (
        <div className="border-2 border-dashed rounded-lg p-12 text-center">
          <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <h3 className="font-semibold mb-2">
            Importar {entityName} via CSV
          </h3>
          <p className="text-sm text-muted-foreground mb-4">
            Selecione um arquivo CSV ou baixe o template para começar
          </p>
          <div className="flex gap-2 justify-center">
            <Button variant="outline" size="sm" onClick={handleDownloadTemplate}>
              <Download className="h-4 w-4 mr-2" />
              Baixar Template
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
