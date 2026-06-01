import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import * as gradeDb from './gradeDb';

describe('Grade Management System', () => {
  let studentId: number;
  let disciplineId: number;

  beforeAll(async () => {
    // Criar um aluno de teste
    const student = await gradeDb.createGradeStudent('1234', '123.456.789-10', 'João Silva');
    studentId = student.id;
  });

  afterAll(async () => {
    // Limpar dados de teste
    if (disciplineId) {
      await gradeDb.deleteDiscipline(disciplineId);
    }
  });

  describe('Student Management', () => {
    it('should create a new grade student', async () => {
      const student = await gradeDb.createGradeStudent('2345', '234.567.890-11', 'Maria Santos');
      expect(student).toBeDefined();
      expect(student.studentNumber).toBe('2345');
      expect(student.cpf).toBe('234.567.890-11');
      expect(student.fullName).toBe('Maria Santos');
    });

    it('should retrieve student by number and CPF', async () => {
      const student = await gradeDb.getGradeStudentByNumberAndCpf('1234', '123.456.789-10');
      expect(student).toBeDefined();
      expect(student?.studentNumber).toBe('1234');
      expect(student?.cpf).toBe('123.456.789-10');
    });

    it('should return null for non-existent student', async () => {
      const student = await gradeDb.getGradeStudentByNumberAndCpf('9999', '999.999.999-99');
      expect(student).toBeNull();
    });

    it('should retrieve student by ID', async () => {
      const student = await gradeDb.getGradeStudentById(studentId);
      expect(student).toBeDefined();
      expect(student?.id).toBe(studentId);
    });
  });

  describe('Discipline Management', () => {
    it('should create a new discipline', async () => {
      const discipline = await gradeDb.createDiscipline(
        studentId,
        'Direito Penal',
        'Prof. João Silva',
        85
      );
      disciplineId = discipline.id;
      expect(discipline).toBeDefined();
      expect(discipline.disciplineName).toBe('Direito Penal');
      expect(discipline.professorName).toBe('Prof. João Silva');
      expect(discipline.grade).toBe(85);
    });

    it('should retrieve disciplines by student ID', async () => {
      const disciplines = await gradeDb.getDisciplinesByStudentId(studentId);
      expect(Array.isArray(disciplines)).toBe(true);
      expect(disciplines.length).toBeGreaterThan(0);
      expect(disciplines[0].disciplineName).toBe('Direito Penal');
    });

    it('should update a discipline', async () => {
      await gradeDb.updateDiscipline(
        disciplineId,
        'Direito Penal Avançado',
        'Prof. Maria Santos',
        90
      );

      const disciplines = await gradeDb.getDisciplinesByStudentId(studentId);
      const updated = disciplines.find(d => d.id === disciplineId);
      expect(updated?.disciplineName).toBe('Direito Penal Avançado');
      expect(updated?.professorName).toBe('Prof. Maria Santos');
      expect(updated?.grade).toBe(90);
    });

    it('should calculate total grade', async () => {
      const total = await gradeDb.calculateTotalGrade(studentId);
      expect(typeof total).toBe('number');
      expect(total).toBeGreaterThanOrEqual(0);
      expect(total).toBeLessThanOrEqual(100);
    });

    it('should delete a discipline', async () => {
      const disciplinesBefore = await gradeDb.getDisciplinesByStudentId(studentId);
      const countBefore = disciplinesBefore.length;

      await gradeDb.deleteDiscipline(disciplineId);

      const disciplinesAfter = await gradeDb.getDisciplinesByStudentId(studentId);
      expect(disciplinesAfter.length).toBe(countBefore - 1);
    });
  });

  describe('Grade Calculation', () => {
    it('should calculate average grade correctly', async () => {
      // Criar múltiplas disciplinas
      await gradeDb.createDiscipline(studentId, 'Disciplina 1', 'Prof. A', 80);
      await gradeDb.createDiscipline(studentId, 'Disciplina 2', 'Prof. B', 90);
      await gradeDb.createDiscipline(studentId, 'Disciplina 3', 'Prof. C', 70);

      const total = await gradeDb.calculateTotalGrade(studentId);
      // Média de 80, 90, 70 = 80
      expect(total).toBeCloseTo(80, 0);
    });

    it('should handle empty grades', async () => {
      const newStudent = await gradeDb.createGradeStudent('5555', '555.555.555-55');
      const total = await gradeDb.calculateTotalGrade(newStudent.id);
      expect(total).toBe(0);
    });
  });
});
