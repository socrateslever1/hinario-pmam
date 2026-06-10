import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import * as gradeDb from './gradeDb';

function generateRandomNumber() {
  return Math.floor(Math.random() * 1000000).toString().padStart(4, '0');
}

function generateRandomCPF() {
  const parts = [
    Math.floor(Math.random() * 1000).toString().padStart(3, '0'),
    Math.floor(Math.random() * 1000).toString().padStart(3, '0'),
    Math.floor(Math.random() * 1000).toString().padStart(3, '0'),
    Math.floor(Math.random() * 100).toString().padStart(2, '0'),
  ];
  return parts.join('.');
}

describe('Grade Management System', () => {
  let studentId: number;
  let disciplineId: number;
  const testStudentNumber = generateRandomNumber();
  const testCPF = generateRandomCPF();

  beforeAll(async () => {
    // Criar um aluno de teste com número aleatório
    const student = await gradeDb.createGradeStudent(testStudentNumber, testCPF, 'João Silva');
    studentId = student.id;
  });

  afterAll(async () => {
    // Limpar dados de teste
    if (disciplineId) {
      try {
        await gradeDb.deleteDiscipline(disciplineId);
      } catch (e) {
        // Ignorar erro se já foi deletado
      }
    }
  });

  describe('Student Management', () => {
    it('should create a new grade student', async () => {
      const newNumber = generateRandomNumber();
      const newCPF = generateRandomCPF();
      const student = await gradeDb.createGradeStudent(newNumber, newCPF, 'Maria Santos');
      expect(student).toBeDefined();
      expect(student.studentNumber).toBe(newNumber);
      expect(student.cpf).toBe(newCPF);
      expect(student.fullName).toBe('Maria Santos');
    });

    it('should retrieve student by number and CPF', async () => {
      const student = await gradeDb.getGradeStudentByNumberAndCpf(testStudentNumber, testCPF);
      expect(student).toBeDefined();
      expect(student?.studentNumber).toBe(testStudentNumber);
      expect(student?.cpf).toBe(testCPF);
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
      const newNumber = generateRandomNumber();
      const newCPF = generateRandomCPF();
      const newStudent = await gradeDb.createGradeStudent(newNumber, newCPF);
      const total = await gradeDb.calculateTotalGrade(newStudent.id);
      expect(total).toBe(0);
    });
  });
});
