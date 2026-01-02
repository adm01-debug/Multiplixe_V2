import Papa from 'papaparse';
import { z } from 'zod';

export interface ImportResult<T> {
  success: T[];
  errors: ImportError[];
  total: number;
  validCount: number;
  errorCount: number;
}

export interface ImportError {
  row: number;
  field: string;
  value: any;
  error: string;
}

export interface ImportOptions {
  skipFirstRow?: boolean;
  delimiter?: string;
  encoding?: string;
  trimValues?: boolean;
}

/**
 * Importa arquivo CSV e valida com Zod schema
 * 
 * Features:
 * - Parse com Papaparse
 * - Validação completa com Zod
 * - Relatório detalhado de erros
 * - Suporte a diferentes encodings
 * - Trim automático de valores
 * 
 * @param file - Arquivo CSV
 * @param schema - Zod schema para validação
 * @param options - Opções de importação
 * @returns Promise com resultado da importação
 * 
 * @example
 * const schema = z.object({
 *   nome: z.string().min(1, 'Nome obrigatório'),
 *   email: z.string().email('Email inválido'),
 *   idade: z.coerce.number().positive('Idade deve ser positiva'),
 * });
 * 
 * const result = await importCSV(file, schema, {
 *   trimValues: true,
 *   skipFirstRow: false
 * });
 * 
 * console.log(`${result.validCount} válidos, ${result.errorCount} erros`);
 */
export async function importCSV<T>(
  file: File,
  schema: z.ZodSchema<T>,
  options: ImportOptions = {}
): Promise<ImportResult<T>> {
  const {
    skipFirstRow = false,
    delimiter = ',',
    encoding = 'UTF-8',
    trimValues = true,
  } = options;

  return new Promise((resolve, reject) => {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      delimiter,
      encoding,
      transformHeader: (header: string) => {
        return trimValues ? header.trim() : header;
      },
      transform: (value: string) => {
        return trimValues ? value.trim() : value;
      },
      complete: (results) => {
        try {
          const success: T[] = [];
          const errors: ImportError[] = [];
          
          const dataToProcess = skipFirstRow 
            ? results.data.slice(1) 
            : results.data;
          
          dataToProcess.forEach((row: any, index: number) => {
            try {
              // Validar com Zod
              const validated = schema.parse(row);
              success.push(validated);
            } catch (error) {
              if (error instanceof z.ZodError) {
                error.errors.forEach((err) => {
                  errors.push({
                    row: skipFirstRow ? index + 2 : index + 1,
                    field: err.path.join('.'),
                    value: err.path.reduce((obj, key) => obj?.[key], row),
                    error: err.message,
                  });
                });
              }
            }
          });

          resolve({
            success,
            errors,
            total: dataToProcess.length,
            validCount: success.length,
            errorCount: errors.length,
          });
        } catch (error) {
          reject(error);
        }
      },
      error: (error) => {
        reject(new Error(`Erro ao ler CSV: ${error.message}`));
      },
    });
  });
}

/**
 * Gera CSV de template com campos do schema
 * 
 * @param schema - Zod schema
 * @param exampleData - Dados de exemplo (opcional)
 * @returns Blob do CSV
 * 
 * @example
 * const template = generateTemplateCSV(schema, [{
 *   nome: 'João Silva',
 *   email: 'joao@email.com',
 *   idade: 30
 * }]);
 * 
 * // Download
 * const url = URL.createObjectURL(template);
 * const a = document.createElement('a');
 * a.href = url;
 * a.download = 'template.csv';
 * a.click();
 */
export function generateTemplateCSV<T extends z.ZodRawShape>(
  schema: z.ZodObject<T>,
  exampleData: Partial<z.infer<z.ZodObject<T>>>[] = []
): Blob {
  const shape = schema.shape;
  const headers = Object.keys(shape);
  
  const rows = [
    headers.join(','),
    ...exampleData.map(row => 
      headers.map(key => {
        const value = row[key as keyof typeof row] ?? '';
        // Escapar vírgulas e aspas
        const stringValue = String(value);
        if (stringValue.includes(',') || stringValue.includes('"')) {
          return `"${stringValue.replace(/"/g, '""')}"`;
        }
        return stringValue;
      }).join(',')
    ),
  ];
  
  return new Blob([rows.join('\n')], { type: 'text/csv;charset=utf-8;' });
}

/**
 * Valida uma única linha do CSV
 * Útil para validação em tempo real
 * 
 * @param row - Objeto com dados da linha
 * @param schema - Zod schema
 * @returns Resultado da validação
 */
export function validateRow<T>(
  row: any,
  schema: z.ZodSchema<T>
): { success: true; data: T } | { success: false; errors: z.ZodError } {
  try {
    const data = schema.parse(row);
    return { success: true, data };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, errors: error };
    }
    throw error;
  }
}
