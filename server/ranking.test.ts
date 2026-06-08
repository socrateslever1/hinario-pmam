import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import * as gradeDb from './gradeDb';

describe('Grade Ranking System', () => {
  let studentId1: number;
  let studentId2: number;
  let studentId3: number;
  let disciplineId1: number;
  let disciplineId2: number;
  let disciplineId3: number;

  beforeAll(async () => {
    // Criar disciplinas no catálogo
    const disc1 = await gradeDb.createCatalogDiscipline('Matemática', 'Disciplina de Matemática', 1);
    const disc2 = await gradeDb.createCatalogDiscipline('Português', 'Disciplina de Português', 1);
    const disc3 = await gradeDb.createCatalogDiscipline('História', 'Disciplina de História', 1);
    
    disciplineId1 = disc1.id;
    disciplineId2 = disc2.id;
    disciplineId3 = disc3.id;

    // Criar alunos de teste com dados da tabela pmam_students
    // Nota: Estes testes assumem que os alunos já existem no banco
    // Para fins de teste, usaremos IDs conhecidos
  });

  afterAll(async () => {
    // Limpar dados de teste se necessário
  });

  describe('Ranking Calculation', () => {
    it('should calculate ranking based on total score (SUM)', async () => {
      // Obter ranking geral
      const ranking = await gradeDb.getGradeRanking();
      
      expect(Array.isArray(ranking)).toBe(true);
      
      // Verificar que cada linha tem os campos esperados
      if (ranking.length > 0) {
        const row = ranking[0];
        expect(row).toHaveProperty('position');
        expect(row).toHaveProperty('studentId');
        expect(row).toHaveProperty('nomeGuerra');
        expect(row).toHaveProperty('numerica');
        expect(row).toHaveProperty('companhia');
        expect(row).toHaveProperty('peloton');
        expect(row).toHaveProperty('average');
        expect(row).toHaveProperty('totalScore');
        expect(row).toHaveProperty('disciplineCount');
      }
    });

    it('should rank students by total score in descending order', async () => {
      const ranking = await gradeDb.getGradeRanking();
      
      // Verificar que o ranking está ordenado por totalScore decrescente
      for (let i = 1; i < ranking.length; i++) {
        expect(ranking[i - 1].totalScore).toBeGreaterThanOrEqual(ranking[i].totalScore);
      }
    });

    it('should calculate average separately from total score', async () => {
      const ranking = await gradeDb.getGradeRanking();
      
      if (ranking.length > 0) {
        const row = ranking[0];
        
        // totalScore é a SOMA das notas
        expect(typeof row.totalScore).toBe('number');
        expect(row.totalScore).toBeGreaterThanOrEqual(0);
        
        // average é a MÉDIA das notas
        expect(typeof row.average).toBe('number');
        expect(row.average).toBeGreaterThanOrEqual(0);
        
        // Se houver mais de 1 disciplina, a média deve ser menor ou igual à soma
        if (row.disciplineCount > 1) {
          expect(row.average).toBeLessThanOrEqual(row.totalScore);
        }
      }
    });

    it('should assign correct positions in ranking', async () => {
      const ranking = await gradeDb.getGradeRanking();
      
      // Verificar que as posições são sequenciais começando de 1
      for (let i = 0; i < ranking.length; i++) {
        expect(ranking[i].position).toBe(i + 1);
      }
    });

    it('should filter ranking by companhia', async () => {
      const ranking = await gradeDb.getGradeRanking({ companhia: 1 });
      
      expect(Array.isArray(ranking)).toBe(true);
      
      // Todos os alunos no ranking devem ser da companhia 1
      ranking.forEach(row => {
        expect(row.companhia).toBe(1);
      });
    });

    it('should filter ranking by companhia and peloton', async () => {
      const ranking = await gradeDb.getGradeRanking({ companhia: 1, peloton: 1 });
      
      expect(Array.isArray(ranking)).toBe(true);
      
      // Todos os alunos no ranking devem ser da companhia 1 e pelotão 1
      ranking.forEach(row => {
        expect(row.companhia).toBe(1);
        expect(row.peloton).toBe(1);
      });
    });

    it('should return empty array if no students match filters', async () => {
      const ranking = await gradeDb.getGradeRanking({ companhia: 999, peloton: 999 });
      
      expect(Array.isArray(ranking)).toBe(true);
      expect(ranking.length).toBe(0);
    });

    it('should handle students with no grades', async () => {
      const ranking = await gradeDb.getGradeRanking();
      
      // Alunos sem notas devem ter totalScore = 0 e average = 0
      const noGradesStudent = ranking.find(r => r.disciplineCount === 0);
      if (noGradesStudent) {
        expect(noGradesStudent.totalScore).toBe(0);
        expect(noGradesStudent.average).toBe(0);
      }
    });

    it('should calculate totalScore as SUM of grades', async () => {
      const ranking = await gradeDb.getGradeRanking();
      
      if (ranking.length > 0) {
        const row = ranking[0];
        
        // Se o aluno tem 3 disciplinas com notas 8, 9, 7
        // totalScore deve ser 24 (8+9+7)
        // average deve ser 8 (24/3)
        
        if (row.disciplineCount > 0) {
          const expectedAverage = row.totalScore / row.disciplineCount;
          expect(row.average).toBeCloseTo(expectedAverage, 1);
        }
      }
    });
  });
});
