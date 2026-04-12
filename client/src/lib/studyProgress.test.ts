import { describe, it, expect } from 'vitest';
import {
  normalizeAnswer,
  isQuestionCorrect,
  calculateQuizScore,
  getAnsweredCount,
  getStudyCompletion,
  createEmptyModuleProgress,
} from './studyProgress';
import type { StudyModule, StudyQuestion } from '@/content/studyModules';

describe('studyProgress', () => {
  describe('normalizeAnswer', () => {
    it('should normalize text by removing accents', () => {
      expect(normalizeAnswer('Polícia')).toBe('policia');
      expect(normalizeAnswer('São Paulo')).toBe('sao paulo');
      expect(normalizeAnswer('Açúcar')).toBe('acucar');
    });

    it('should convert to lowercase', () => {
      expect(normalizeAnswer('POLÍCIA')).toBe('policia');
      expect(normalizeAnswer('Polícia')).toBe('policia');
    });

    it('should trim whitespace', () => {
      expect(normalizeAnswer('  polícia  ')).toBe('policia');
      expect(normalizeAnswer('\tpolícia\n')).toBe('policia');
    });

    it('should handle special characters', () => {
      expect(normalizeAnswer('Cônego')).toBe('conego');
      expect(normalizeAnswer('Mãe')).toBe('mae');
      expect(normalizeAnswer('Pão')).toBe('pao');
    });
  });

  describe('isQuestionCorrect', () => {
    describe('text questions', () => {
      it('should accept exact match after normalization', () => {
        const question: StudyQuestion = {
          id: '1',
          type: 'text',
          text: 'Qual é a capital do Amazonas?',
          acceptedAnswers: ['Manaus'],
        };
        expect(isQuestionCorrect(question, 'Manaus')).toBe(true);
        expect(isQuestionCorrect(question, 'manaus')).toBe(true);
        expect(isQuestionCorrect(question, 'MANAUS')).toBe(true);
      });

      it('should accept multiple accepted answers', () => {
        const question: StudyQuestion = {
          id: '2',
          type: 'text',
          text: 'Qual é a sigla da Polícia Militar?',
          acceptedAnswers: ['PM', 'PMAM', 'Polícia Militar'],
        };
        expect(isQuestionCorrect(question, 'PM')).toBe(true);
        expect(isQuestionCorrect(question, 'pmam')).toBe(true);
        expect(isQuestionCorrect(question, 'Polícia Militar')).toBe(true);
      });

      it('should reject incorrect answers', () => {
        const question: StudyQuestion = {
          id: '3',
          type: 'text',
          text: 'Qual é a capital do Amazonas?',
          acceptedAnswers: ['Manaus'],
        };
        expect(isQuestionCorrect(question, 'Belém')).toBe(false);
        expect(isQuestionCorrect(question, '')).toBe(false);
        expect(isQuestionCorrect(question, null)).toBe(false);
      });

      it('should handle null/undefined answers', () => {
        const question: StudyQuestion = {
          id: '4',
          type: 'text',
          text: 'Teste',
          acceptedAnswers: ['resposta'],
        };
        expect(isQuestionCorrect(question, null)).toBe(false);
        expect(isQuestionCorrect(question, undefined as any)).toBe(false);
      });
    });

    describe('single choice questions', () => {
      it('should accept correct option', () => {
        const question: StudyQuestion = {
          id: '5',
          type: 'single',
          text: 'Qual é a cor da bandeira?',
          options: [
            { id: 'a', text: 'Verde' },
            { id: 'b', text: 'Azul' },
            { id: 'c', text: 'Vermelho' },
          ],
          correctOptionIds: ['a'],
        };
        expect(isQuestionCorrect(question, 'a')).toBe(true);
      });

      it('should reject incorrect option', () => {
        const question: StudyQuestion = {
          id: '6',
          type: 'single',
          text: 'Qual é a cor da bandeira?',
          options: [
            { id: 'a', text: 'Verde' },
            { id: 'b', text: 'Azul' },
          ],
          correctOptionIds: ['a'],
        };
        expect(isQuestionCorrect(question, 'b')).toBe(false);
      });
    });

    describe('multiple choice questions', () => {
      it('should accept all correct options', () => {
        const question: StudyQuestion = {
          id: '7',
          type: 'multiple',
          text: 'Selecione as cores corretas',
          options: [
            { id: 'a', text: 'Verde' },
            { id: 'b', text: 'Azul' },
            { id: 'c', text: 'Vermelho' },
          ],
          correctOptionIds: ['a', 'c'],
        };
        expect(isQuestionCorrect(question, ['a', 'c'])).toBe(true);
        expect(isQuestionCorrect(question, ['c', 'a'])).toBe(true); // order doesn't matter
      });

      it('should reject partial selection', () => {
        const question: StudyQuestion = {
          id: '8',
          type: 'multiple',
          text: 'Selecione as cores corretas',
          options: [
            { id: 'a', text: 'Verde' },
            { id: 'b', text: 'Azul' },
            { id: 'c', text: 'Vermelho' },
          ],
          correctOptionIds: ['a', 'c'],
        };
        expect(isQuestionCorrect(question, ['a'])).toBe(false);
        expect(isQuestionCorrect(question, ['a', 'b'])).toBe(false);
      });

      it('should reject extra selections', () => {
        const question: StudyQuestion = {
          id: '9',
          type: 'multiple',
          text: 'Selecione as cores corretas',
          options: [
            { id: 'a', text: 'Verde' },
            { id: 'b', text: 'Azul' },
            { id: 'c', text: 'Vermelho' },
          ],
          correctOptionIds: ['a', 'c'],
        };
        expect(isQuestionCorrect(question, ['a', 'b', 'c'])).toBe(false);
      });
    });

    describe('boolean questions', () => {
      it('should accept correct boolean answer', () => {
        const question: StudyQuestion = {
          id: '10',
          type: 'boolean',
          text: 'A Polícia Militar foi fundada em 1837?',
          correctOptionIds: ['true'],
        };
        expect(isQuestionCorrect(question, 'true')).toBe(true);
      });

      it('should reject incorrect boolean answer', () => {
        const question: StudyQuestion = {
          id: '11',
          type: 'boolean',
          text: 'A Polícia Militar foi fundada em 1837?',
          correctOptionIds: ['true'],
        };
        expect(isQuestionCorrect(question, 'false')).toBe(false);
      });
    });
  });

  describe('calculateQuizScore', () => {
    it('should calculate score correctly', () => {
      const module: StudyModule = {
        slug: 'test',
        title: 'Test Module',
        description: 'Test',
        theme: 'Test',
        sourceTitle: 'Test',
        textPath: '/test.txt',
        pages: 10,
        estimatedMinutes: 30,
        difficulty: 'base',
        targets: [],
        objectives: [],
        quickFacts: [],
        sections: [],
        questions: [
          {
            id: '1',
            type: 'text',
            text: 'Q1',
            acceptedAnswers: ['A'],
          },
          {
            id: '2',
            type: 'text',
            text: 'Q2',
            acceptedAnswers: ['B'],
          },
          {
            id: '3',
            type: 'text',
            text: 'Q3',
            acceptedAnswers: ['C'],
          },
          {
            id: '4',
            type: 'text',
            text: 'Q4',
            acceptedAnswers: ['D'],
          },
        ],
      };

      const answers = {
        '1': 'A', // correct
        '2': 'X', // incorrect
        '3': 'C', // correct
        '4': null, // not answered
      };

      const result = calculateQuizScore(module, answers);
      expect(result.total).toBe(4);
      expect(result.correct).toBe(2);
      expect(result.percentage).toBe(50);
    });

    it('should handle all correct answers', () => {
      const module: StudyModule = {
        slug: 'test',
        title: 'Test Module',
        description: 'Test',
        theme: 'Test',
        sourceTitle: 'Test',
        textPath: '/test.txt',
        pages: 10,
        estimatedMinutes: 30,
        difficulty: 'base',
        targets: [],
        objectives: [],
        quickFacts: [],
        sections: [],
        questions: [
          { id: '1', type: 'text', text: 'Q1', acceptedAnswers: ['A'] },
          { id: '2', type: 'text', text: 'Q2', acceptedAnswers: ['B'] },
        ],
      };

      const answers = { '1': 'A', '2': 'B' };
      const result = calculateQuizScore(module, answers);
      expect(result.percentage).toBe(100);
    });

    it('should handle all incorrect answers', () => {
      const module: StudyModule = {
        slug: 'test',
        title: 'Test Module',
        description: 'Test',
        theme: 'Test',
        sourceTitle: 'Test',
        textPath: '/test.txt',
        pages: 10,
        estimatedMinutes: 30,
        difficulty: 'base',
        targets: [],
        objectives: [],
        quickFacts: [],
        sections: [],
        questions: [
          { id: '1', type: 'text', text: 'Q1', acceptedAnswers: ['A'] },
          { id: '2', type: 'text', text: 'Q2', acceptedAnswers: ['B'] },
        ],
      };

      const answers = { '1': 'X', '2': 'Y' };
      const result = calculateQuizScore(module, answers);
      expect(result.percentage).toBe(0);
    });

    it('should handle empty questions', () => {
      const module: StudyModule = {
        slug: 'test',
        title: 'Test Module',
        description: 'Test',
        theme: 'Test',
        sourceTitle: 'Test',
        textPath: '/test.txt',
        pages: 10,
        estimatedMinutes: 30,
        difficulty: 'base',
        targets: [],
        objectives: [],
        quickFacts: [],
        sections: [],
        questions: [],
      };

      const answers = {};
      const result = calculateQuizScore(module, answers);
      expect(result.total).toBe(0);
      expect(result.correct).toBe(0);
      expect(result.percentage).toBe(0);
    });
  });

  describe('getAnsweredCount', () => {
    it('should count answered questions', () => {
      const module: StudyModule = {
        slug: 'test',
        title: 'Test Module',
        description: 'Test',
        theme: 'Test',
        sourceTitle: 'Test',
        textPath: '/test.txt',
        pages: 10,
        estimatedMinutes: 30,
        difficulty: 'base',
        targets: [],
        objectives: [],
        quickFacts: [],
        sections: [],
        questions: [
          { id: '1', type: 'text', text: 'Q1', acceptedAnswers: ['A'] },
          { id: '2', type: 'text', text: 'Q2', acceptedAnswers: ['B'] },
          { id: '3', type: 'text', text: 'Q3', acceptedAnswers: ['C'] },
        ],
      };

      const answers = {
        '1': 'A',
        '2': null,
        '3': 'C',
      };

      expect(getAnsweredCount(module, answers)).toBe(2);
    });

    it('should not count empty string answers', () => {
      const module: StudyModule = {
        slug: 'test',
        title: 'Test Module',
        description: 'Test',
        theme: 'Test',
        sourceTitle: 'Test',
        textPath: '/test.txt',
        pages: 10,
        estimatedMinutes: 30,
        difficulty: 'base',
        targets: [],
        objectives: [],
        quickFacts: [],
        sections: [],
        questions: [
          { id: '1', type: 'text', text: 'Q1', acceptedAnswers: ['A'] },
          { id: '2', type: 'text', text: 'Q2', acceptedAnswers: ['B'] },
        ],
      };

      const answers = {
        '1': '  ',
        '2': 'B',
      };

      expect(getAnsweredCount(module, answers)).toBe(1);
    });

    it('should count non-empty array answers', () => {
      const module: StudyModule = {
        slug: 'test',
        title: 'Test Module',
        description: 'Test',
        theme: 'Test',
        sourceTitle: 'Test',
        textPath: '/test.txt',
        pages: 10,
        estimatedMinutes: 30,
        difficulty: 'base',
        targets: [],
        objectives: [],
        quickFacts: [],
        sections: [],
        questions: [
          { id: '1', type: 'multiple', text: 'Q1', options: [], correctOptionIds: ['a'] },
          { id: '2', type: 'multiple', text: 'Q2', options: [], correctOptionIds: ['b'] },
        ],
      };

      const answers = {
        '1': ['a', 'b'],
        '2': [],
      };

      expect(getAnsweredCount(module, answers)).toBe(1);
    });
  });

  describe('getStudyCompletion', () => {
    it('should calculate completion with 65% reading + 35% quiz', () => {
      const module: StudyModule = {
        slug: 'test',
        title: 'Test Module',
        description: 'Test',
        theme: 'Test',
        sourceTitle: 'Test',
        textPath: '/test.txt',
        pages: 10,
        estimatedMinutes: 30,
        difficulty: 'base',
        targets: [],
        objectives: [],
        quickFacts: [],
        sections: [
          { id: '1', title: 'Section 1', content: 'Content 1' },
          { id: '2', title: 'Section 2', content: 'Content 2' },
          { id: '3', title: 'Section 3', content: 'Content 3' },
          { id: '4', title: 'Section 4', content: 'Content 4' },
          { id: '5', title: 'Section 5', content: 'Content 5' },
        ],
        questions: [],
      };

      const progress = {
        completedSectionIds: ['1', '2', '3'], // 60% read
        answers: {},
        lastScore: 80, // 80% quiz
        bestScore: 80,
        lastSubmittedAt: null,
      };

      const result = getStudyCompletion(module, progress);
      expect(result.studied).toBe(3);
      expect(result.sectionCount).toBe(5);
      expect(result.studyPercent).toBe(60);
      expect(result.quizPercent).toBe(80);
      expect(result.overallPercent).toBe(67); // (60 * 0.65) + (80 * 0.35) = 39 + 28 = 67
    });

    it('should use studyUnitTarget override', () => {
      const module: StudyModule = {
        slug: 'test',
        title: 'Test Module',
        description: 'Test',
        theme: 'Test',
        sourceTitle: 'Test',
        textPath: '/test.txt',
        pages: 10,
        estimatedMinutes: 30,
        difficulty: 'base',
        targets: [],
        objectives: [],
        quickFacts: [],
        sections: [
          { id: '1', title: 'Section 1', content: 'Content 1' },
          { id: '2', title: 'Section 2', content: 'Content 2' },
        ],
        questions: [],
        studyUnitTarget: 10,
      };

      const progress = {
        completedSectionIds: ['1', '2'],
        answers: {},
        lastScore: 100,
        bestScore: 100,
        lastSubmittedAt: null,
      };

      const result = getStudyCompletion(module, progress);
      expect(result.sectionCount).toBe(10); // uses studyUnitTarget
      expect(result.studied).toBe(2);
      expect(result.studyPercent).toBe(20); // 2/10
    });

    it('should handle zero quiz score', () => {
      const module: StudyModule = {
        slug: 'test',
        title: 'Test Module',
        description: 'Test',
        theme: 'Test',
        sourceTitle: 'Test',
        textPath: '/test.txt',
        pages: 10,
        estimatedMinutes: 30,
        difficulty: 'base',
        targets: [],
        objectives: [],
        quickFacts: [],
        sections: [
          { id: '1', title: 'Section 1', content: 'Content 1' },
        ],
        questions: [],
      };

      const progress = {
        completedSectionIds: ['1'],
        answers: {},
        lastScore: 0,
        bestScore: 0,
        lastSubmittedAt: null,
      };

      const result = getStudyCompletion(module, progress);
      expect(result.quizPercent).toBe(0);
      expect(result.overallPercent).toBe(65); // (100 * 0.65) + (0 * 0.35) = 65
    });

    it('should handle null quiz score', () => {
      const module: StudyModule = {
        slug: 'test',
        title: 'Test Module',
        description: 'Test',
        theme: 'Test',
        sourceTitle: 'Test',
        textPath: '/test.txt',
        pages: 10,
        estimatedMinutes: 30,
        difficulty: 'base',
        targets: [],
        objectives: [],
        quickFacts: [],
        sections: [
          { id: '1', title: 'Section 1', content: 'Content 1' },
        ],
        questions: [],
      };

      const progress = {
        completedSectionIds: ['1'],
        answers: {},
        lastScore: null,
        bestScore: null,
        lastSubmittedAt: null,
      };

      const result = getStudyCompletion(module, progress);
      expect(result.quizPercent).toBe(0);
      expect(result.overallPercent).toBe(65); // (100 * 0.65) + (0 * 0.35) = 65
    });
  });

  describe('createEmptyModuleProgress', () => {
    it('should create empty progress object', () => {
      const progress = createEmptyModuleProgress();
      expect(progress.completedSectionIds).toEqual([]);
      expect(progress.answers).toEqual({});
      expect(progress.lastScore).toBe(null);
      expect(progress.bestScore).toBe(null);
      expect(progress.lastSubmittedAt).toBe(null);
    });
  });
});
