import { describe, expect, it } from 'vitest';
import {
  COURSE_CSV_HEADERS,
  COURSE_CSV_TEMPLATE,
  applyExistingSlugs,
  detectDelimiter,
  parseCourseCsv,
  parseDelimited,
  slugify,
} from '@/lib/courseCsv';

const categories = [
  { id: 'cat-atendimento', name: 'Atendimento' },
  { id: 'cat-vendas', name: 'Vendas' },
];

describe('courseCsv', () => {
  it('usa ; como separador no modelo e bate com os cabecalhos declarados', () => {
    expect(COURSE_CSV_TEMPLATE.split('\r\n')[0]).toBe(COURSE_CSV_HEADERS.join(';'));
    expect(detectDelimiter(COURSE_CSV_TEMPLATE)).toBe(';');
  });

  it('respeita aspas, aspas escapadas e quebras de linha dentro do campo', () => {
    const csv = 'titulo;descricao\n"Curso, completo";"Linha 1\nLinha ""2"""';
    const matrix = parseDelimited(csv, ';');
    expect(matrix[1][0]).toBe('Curso, completo');
    expect(matrix[1][1]).toBe('Linha 1\nLinha "2"');
  });

  it('gera slug a partir do titulo quando a coluna vem vazia', () => {
    expect(slugify('Atendimento Nota 10!')).toBe('atendimento-nota-10');
    const result = parseCourseCsv(
      'titulo;slug;categoria;nivel;duracao_minutos\nAtendimento Nota 10;;Atendimento;básico;45',
      categories,
    );
    expect(result.rows[0].slug).toBe('atendimento-nota-10');
    expect(result.rows[0].level).toBe('iniciante');
    expect(result.rows[0].category_id).toBe('cat-atendimento');
    expect(result.rows[0].errors).toEqual([]);
    expect(result.validCount).toBe(1);
  });

  it('marca erro quando categoria nao existe, nivel invalido ou titulo vazio', () => {
    const csv = [
      'titulo;slug;categoria;nivel',
      'Curso A;curso-a;Inexistente;iniciante',
      'Curso B;curso-b;Vendas;expert',
      ';curso-c;Vendas;iniciante',
    ].join('\n');
    const result = parseCourseCsv(csv, categories);
    expect(result.invalidCount).toBe(3);
    expect(result.rows[0].errors.join()).toContain('Categoria');
    expect(result.rows[1].errors.join()).toContain('Nivel invalido');
    expect(result.rows[2].errors.join()).toContain('Titulo obrigatorio');
  });

  it('detecta slug repetido dentro do mesmo arquivo', () => {
    const csv = [
      'titulo;slug;categoria;nivel',
      'Curso A;mesmo-slug;Vendas;iniciante',
      'Curso B;mesmo-slug;Vendas;iniciante',
    ].join('\n');
    const result = parseCourseCsv(csv, categories);
    expect(result.rows[1].errors.join()).toContain('Slug repetido');
    expect(result.validCount).toBe(1);
  });

  it('interpreta publicacao e destaque em sim/nao', () => {
    const csv = [
      'titulo;slug;publicado;destacado',
      'Curso A;curso-a;sim;nao',
      'Curso B;curso-b;nao;sim',
    ].join('\n');
    const result = parseCourseCsv(csv, categories);
    expect(result.rows[0].is_published).toBe(true);
    expect(result.rows[0].is_featured).toBe(false);
    expect(result.rows[1].is_published).toBe(false);
    expect(result.rows[1].is_featured).toBe(true);
  });

  it('invalida linhas cujo slug ja existe na base', () => {
    const csv = 'titulo;slug\nCurso A;ja-existe\nCurso B;novo-slug';
    const parsed = parseCourseCsv(csv, categories);
    const merged = applyExistingSlugs(parsed.rows, ['ja-existe']);
    expect(merged.rows[0].errors).toContain('Slug ja existe na base');
    expect(merged.rows[1].errors).toEqual([]);
    expect(merged.validCount).toBe(1);
    expect(merged.invalidCount).toBe(1);
  });

  it('aceita arquivo com virgula como separador', () => {
    const csv = 'titulo,slug,categoria,nivel\nCurso A,curso-a,Vendas,iniciante';
    const result = parseCourseCsv(csv, categories);
    expect(result.validCount).toBe(1);
    expect(result.rows[0].category_id).toBe('cat-vendas');
  });
});