export interface CsvCourseRow {
  line: number;
  title: string;
  slug: string;
  description: string | null;
  category_name: string | null;
  category_id: string | null;
  level: string;
  duration_minutes: number;
  instructor_name: string | null;
  is_published: boolean;
  is_featured: boolean;
  errors: string[];
}

export interface CsvParseResult {
  rows: CsvCourseRow[];
  validCount: number;
  invalidCount: number;
}

export const COURSE_CSV_HEADERS = [
  'titulo',
  'slug',
  'descricao',
  'categoria',
  'nivel',
  'duracao_minutos',
  'instrutor',
  'publicado',
  'destacado',
];

const VALID_LEVELS = ['iniciante', 'intermediario', 'avancado'];
const LEVEL_ALIASES: Record<string, string> = {
  iniciante: 'iniciante',
  basico: 'iniciante',
  'básico': 'iniciante',
  intermediario: 'intermediario',
  'intermediário': 'intermediario',
  medio: 'intermediario',
  'médio': 'intermediario',
  avancado: 'avancado',
  'avançado': 'avancado',
  avancada: 'avancado',
};

export const COURSE_CSV_TEMPLATE = [
  COURSE_CSV_HEADERS.join(';'),
  'Atendimento nota 10;atendimento-nota-10;Tecnicas de atendimento ao cliente;Atendimento;iniciante;45;Ana Souza;sim;nao',
  'Vendas consultivas;vendas-consultivas;Como conduzir uma venda consultiva;Vendas;intermediario;60;Carlos Lima;nao;nao',
].join('\r\n');

export const slugify = (value: string): string =>
  value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

/** Detecta o separador mais provavel (; , ou tab) na primeira linha nao vazia. */
export const detectDelimiter = (text: string): string => {
  const firstLine = text.split(/\r?\n/).find((line) => line.trim().length > 0) ?? '';
  const candidates = [';', ',', '\t'];
  let best = ';';
  let bestCount = 0;
  for (const candidate of candidates) {
    const count = firstLine.split(candidate).length - 1;
    if (count > bestCount) {
      best = candidate;
      bestCount = count;
    }
  }
  return best;
};

/** Parser CSV/TSV que respeita aspas duplas, aspas escapadas ("") e quebras de linha dentro de campo. */
export const parseDelimited = (text: string, delimiter: string): string[][] => {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = '';
  let inQuotes = false;

  const normalized = text.replace(/^\uFEFF/, '');

  for (let i = 0; i < normalized.length; i += 1) {
    const char = normalized[i];
    if (inQuotes) {
      if (char === '"') {
        if (normalized[i + 1] === '"') {
          field += '"';
          i += 1;
        } else {
          inQuotes = false;
        }
      } else {
        field += char;
      }
      continue;
    }

    if (char === '"') {
      inQuotes = true;
    } else if (char === delimiter) {
      row.push(field);
      field = '';
    } else if (char === '\n') {
      row.push(field);
      rows.push(row);
      row = [];
      field = '';
    } else if (char !== '\r') {
      field += char;
    }
  }

  if (field.length > 0 || row.length > 0) {
    row.push(field);
    rows.push(row);
  }

  return rows.filter((parsedRow) => parsedRow.some((cell) => cell.trim().length > 0));
};

const parseBoolean = (value: string): boolean => {
  const normalized = value.trim().toLowerCase();
  return ['sim', 's', 'true', '1', 'yes', 'y', 'x'].includes(normalized);
};

export interface ImportCategory {
  id: string;
  name: string;
}

export const parseCourseCsv = (text: string, categories: ImportCategory[]): CsvParseResult => {
  const delimiter = detectDelimiter(text);
  const matrix = parseDelimited(text, delimiter);
  if (matrix.length === 0) {
    return { rows: [], validCount: 0, invalidCount: 0 };
  }

  const header = matrix[0].map((cell) => cell.trim().toLowerCase());
  const indexOf = (...names: string[]) => {
    for (const name of names) {
      const idx = header.indexOf(name);
      if (idx >= 0) return idx;
    }
    return -1;
  };

  const titleIdx = indexOf('titulo', 'título', 'title', 'curso');
  const slugIdx = indexOf('slug');
  const descriptionIdx = indexOf('descricao', 'descrição', 'description');
  const categoryIdx = indexOf('categoria', 'category');
  const levelIdx = indexOf('nivel', 'nível', 'level');
  const durationIdx = indexOf('duracao_minutos', 'duração_minutos', 'duracao', 'duração', 'duration_minutes');
  const instructorIdx = indexOf('instrutor', 'instructor', 'instructor_name');
  const publishedIdx = indexOf('publicado', 'published', 'is_published');
  const featuredIdx = indexOf('destacado', 'featured', 'is_featured');

  const categoryByName = new Map(categories.map((category) => [category.name.trim().toLowerCase(), category.id]));
  const seenSlugs = new Set<string>();

  const rows: CsvCourseRow[] = matrix.slice(1).map((cells, index) => {
    const cell = (idx: number) => (idx >= 0 && idx < cells.length ? cells[idx].trim() : '');
    const errors: string[] = [];

    const title = cell(titleIdx);
    if (!title) errors.push('Titulo obrigatorio');

    const rawSlug = cell(slugIdx);
    const slug = slugify(rawSlug || title);
    if (!slug) errors.push('Slug obrigatorio');

    const rawLevel = cell(levelIdx).toLowerCase();
    const level = rawLevel ? LEVEL_ALIASES[rawLevel] ?? rawLevel : 'iniciante';
    if (!VALID_LEVELS.includes(level)) {
      errors.push(`Nivel invalido (use ${VALID_LEVELS.join(', ')})`);
    }

    const rawDuration = cell(durationIdx).replace(/[^\d]/g, '');
    const duration = rawDuration ? Number.parseInt(rawDuration, 10) : 0;
    if (rawDuration && Number.isNaN(duration)) errors.push('Duracao invalida');

    const categoryName = cell(categoryIdx);
    const categoryId = categoryName ? categoryByName.get(categoryName.toLowerCase()) ?? null : null;
    if (categoryName && !categoryId) errors.push(`Categoria "${categoryName}" nao encontrada`);

    if (slug) {
      if (seenSlugs.has(slug)) errors.push('Slug repetido no arquivo');
      seenSlugs.add(slug);
    }

    return {
      line: index + 2,
      title,
      slug,
      description: cell(descriptionIdx) || null,
      category_name: categoryName || null,
      category_id: categoryId,
      level,
      duration_minutes: duration,
      instructor_name: cell(instructorIdx) || null,
      is_published: parseBoolean(cell(publishedIdx)),
      is_featured: parseBoolean(cell(featuredIdx)),
      errors,
    };
  });

  const invalidCount = rows.filter((row) => row.errors.length > 0).length;
  return { rows, validCount: rows.length - invalidCount, invalidCount };
};

/** Marca como invalidas as linhas cujo slug ja existe na base (courses.slug tem constraint unica). */
export const applyExistingSlugs = (rows: CsvCourseRow[], existingSlugs: string[]): CsvParseResult => {
  const taken = new Set(existingSlugs.map((slug) => slug.trim().toLowerCase()));
  const nextRows = rows.map((row) => {
    if (!taken.has(row.slug.toLowerCase()) || row.errors.includes('Slug ja existe na base')) {
      return row;
    }
    return { ...row, errors: [...row.errors, 'Slug ja existe na base'] };
  });
  const invalidCount = nextRows.filter((row) => row.errors.length > 0).length;
  return { rows: nextRows, validCount: nextRows.length - invalidCount, invalidCount };
};