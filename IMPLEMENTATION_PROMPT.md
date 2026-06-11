# Sistema de Xerife por Companhia/Pelotão - Prompt de Implementação

## Objetivo
Implementar sistema hierárquico de Xerifes (gerentes) com permissões baseadas em companhia/pelotão, permitindo que cada Xerife veja apenas seus dados e alunos.

---

## 1. Estrutura de Dados

### Schema Drizzle (drizzle/schema.ts)

```typescript
// Adicionar enums
export const xerifeLevelEnum = pgEnum('xerife_level', ['principal', 'companhia', 'peloton']);

// Atualizar tabela users
export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  email: text('email').unique().notNull(),
  name: text('name').notNull(),
  role: userRoleEnum('role').default('user').notNull(), // admin | user
  
  // Novos campos para Xerife
  xerifeLevel: xerifeLevelEnum('xerife_level'), // null = não é xerife
  companhia: integer('companhia'), // 1-5, null se não for xerife
  peloton: integer('peloton'), // 1-10, null se xerife de companhia
  
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// Tabela para datas de disciplinas por aluno
export const disciplineDates = pgTable('discipline_dates', {
  id: serial('id').primaryKey(),
  studentId: integer('student_id').references(() => students.id),
  disciplineId: integer('discipline_id').references(() => disciplines.id),
  scheduledDate: timestamp('scheduled_date'), // Data que o aluno marcou
  companhia: integer('companhia').notNull(), // 1-5
  peloton: integer('peloton').notNull(), // 1-10
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// Tabela de ranking
export const disciplineRanking = pgTable('discipline_ranking', {
  id: serial('id').primaryKey(),
  studentId: integer('student_id').references(() => students.id),
  disciplineId: integer('discipline_id').references(() => disciplines.id),
  score: integer('score').default(0),
  completedAt: timestamp('completed_at'),
  companhia: integer('companhia').notNull(),
  peloton: integer('peloton').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
});
```

---

## 2. Procedures tRPC (server/routers.ts)

### Gerenciamento de Xerife

```typescript
// Criar/editar Xerife
xerife: {
  create: protectedProcedure
    .input(z.object({
      email: z.string().email(),
      name: z.string(),
      level: z.enum(['principal', 'companhia', 'peloton']),
      companhia: z.number().min(1).max(5).optional(),
      peloton: z.number().min(1).max(10).optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      // Validar: apenas Xerife Principal pode criar
      if (ctx.user.role !== 'admin' || ctx.user.xerifeLevel !== 'principal') {
        throw new TRPCError({ code: 'FORBIDDEN' });
      }
      
      // Validar companhia/peloton
      if (input.level === 'companhia' && !input.companhia) {
        throw new TRPCError({ code: 'BAD_REQUEST', message: 'Companhia obrigatória' });
      }
      if (input.level === 'peloton' && (!input.companhia || !input.peloton)) {
        throw new TRPCError({ code: 'BAD_REQUEST', message: 'Companhia e pelotão obrigatórios' });
      }
      
      return db.insert(users).values({
        email: input.email,
        name: input.name,
        role: 'admin',
        xerifeLevel: input.level,
        companhia: input.companhia,
        peloton: input.peloton,
      });
    }),

  list: protectedProcedure.query(async ({ ctx }) => {
    // Xerife Principal vê todos
    if (ctx.user.xerifeLevel === 'principal') {
      return db.query.users.findMany({
        where: (users, { isNotNull }) => isNotNull(users.xerifeLevel),
      });
    }
    // Xerife de Companhia vê Xerifes de seu pelotão
    if (ctx.user.xerifeLevel === 'companhia') {
      return db.query.users.findMany({
        where: (users, { and, eq }) => and(
          eq(users.companhia, ctx.user.companhia),
          isNotNull(users.xerifeLevel),
        ),
      });
    }
    throw new TRPCError({ code: 'FORBIDDEN' });
  }),

  delete: protectedProcedure
    .input(z.object({ userId: z.number() }))
    .mutation(async ({ input, ctx }) => {
      if (ctx.user.xerifeLevel !== 'principal') {
        throw new TRPCError({ code: 'FORBIDDEN' });
      }
      return db.delete(users).where(eq(users.id, input.userId));
    }),
},

// Disciplinas com datas flexíveis
discipline: {
  getForStudent: protectedProcedure
    .input(z.object({ companhia: z.number(), peloton: z.number() }))
    .query(async ({ input, ctx }) => {
      // Validar acesso
      if (ctx.user.xerifeLevel === 'peloton' && 
          (ctx.user.companhia !== input.companhia || ctx.user.peloton !== input.peloton)) {
        throw new TRPCError({ code: 'FORBIDDEN' });
      }
      
      return db.query.disciplines.findMany({
        with: {
          dates: {
            where: (dates, { and, eq }) => and(
              eq(dates.companhia, input.companhia),
              eq(dates.peloton, input.peloton),
            ),
          },
        },
      });
    }),

  setStudentDate: protectedProcedure
    .input(z.object({
      disciplineId: z.number(),
      scheduledDate: z.date(),
      studentId: z.number(),
      companhia: z.number(),
      peloton: z.number(),
    }))
    .mutation(async ({ input, ctx }) => {
      // Aluno marca sua data OU Xerife marca para aluno
      const isStudent = ctx.user.id === input.studentId;
      const isXerife = ctx.user.xerifeLevel && 
        (ctx.user.xerifeLevel === 'principal' ||
         (ctx.user.xerifeLevel === 'companhia' && ctx.user.companhia === input.companhia) ||
         (ctx.user.xerifeLevel === 'peloton' && ctx.user.companhia === input.companhia && ctx.user.peloton === input.peloton));
      
      if (!isStudent && !isXerife) {
        throw new TRPCError({ code: 'FORBIDDEN' });
      }
      
      return db.insert(disciplineDates).values({
        studentId: input.studentId,
        disciplineId: input.disciplineId,
        scheduledDate: input.scheduledDate,
        companhia: input.companhia,
        peloton: input.peloton,
      }).onConflictDoUpdate({
        target: [disciplineDates.studentId, disciplineDates.disciplineId],
        set: { scheduledDate: input.scheduledDate },
      });
    }),
},

// Ranking (visível para todos)
ranking: {
  getGlobal: publicProcedure.query(async () => {
    return db.query.disciplineRanking.findMany({
      orderBy: (ranking, { desc }) => desc(ranking.score),
      limit: 100,
      with: { student: true },
    });
  }),

  getByCompanhia: publicProcedure
    .input(z.object({ companhia: z.number() }))
    .query(async ({ input }) => {
      return db.query.disciplineRanking.findMany({
        where: (ranking, { eq }) => eq(ranking.companhia, input.companhia),
        orderBy: (ranking, { desc }) => desc(ranking.score),
        limit: 100,
      });
    }),

  getByPeloton: publicProcedure
    .input(z.object({ companhia: z.number(), peloton: z.number() }))
    .query(async ({ input }) => {
      return db.query.disciplineRanking.findMany({
        where: (ranking, { and, eq }) => and(
          eq(ranking.companhia, input.companhia),
          eq(ranking.peloton, input.peloton),
        ),
        orderBy: (ranking, { desc }) => desc(ranking.score),
      });
    }),
},
```

---

## 3. Componentes Frontend (client/src/components)

### XerifeManager.tsx
```typescript
// Gerenciar Xerifes (apenas Xerife Principal)
// - Criar novo Xerife
// - Editar (companhia/pelotão)
// - Deletar
// - Listar com filtros
```

### DisciplineDatePicker.tsx
```typescript
// Aluno marca sua data para disciplina sem data fixa
// - Mostrar disciplinas sem data
// - DatePicker para marcar
// - Salvar automaticamente
```

### DisciplineRanking.tsx
```typescript
// Ranking visível para todos
// - Global (top 100)
// - Por Companhia
// - Por Pelotão
// - Atualização em tempo real
```

---

## 4. Controle de Acesso (middleware)

### Adicionar validação em context.ts
```typescript
// Função helper para validar acesso
export function validateXerifeAccess(
  user: User,
  targetCompanhia: number,
  targetPeloton?: number,
): boolean {
  if (user.xerifeLevel === 'principal') return true;
  if (user.xerifeLevel === 'companhia' && user.companhia === targetCompanhia) return true;
  if (user.xerifeLevel === 'peloton' && 
      user.companhia === targetCompanhia && 
      user.peloton === targetPeloton) return true;
  return false;
}
```

---

## 5. Fluxo de Dados

### Aluno
1. Login → vê disciplinas de seu pelotão
2. Disciplina sem data → marca sua data
3. Vê ranking de seu pelotão
4. Vê ranking global (opcional)

### Xerife de Pelotão
1. Login → vê alunos de seu pelotão
2. Pode editar data de disciplina de qualquer aluno
3. Vê ranking de seu pelotão
4. Vê ranking de sua companhia

### Xerife de Companhia
1. Login → vê todos os pelotões de sua companhia
2. Pode editar dados de qualquer pelotão
3. Vê ranking de sua companhia
4. Vê ranking global

### Xerife Principal (você)
1. Login → vê tudo
2. Cria/edita/deleta Xerifes
3. Edita qualquer dado
4. Vê todos os rankings

---

## 6. Testes (vitest)

```typescript
// server/xerife.test.ts
describe('Xerife System', () => {
  test('Xerife Principal cria Xerife de Companhia', async () => {
    // Arrange
    // Act
    // Assert
  });

  test('Xerife de Companhia não pode criar Xerife', async () => {
    // Deve retornar FORBIDDEN
  });

  test('Aluno marca data de disciplina', async () => {
    // Arrange
    // Act
    // Assert
  });

  test('Ranking filtra por companhia/pelotão', async () => {
    // Arrange
    // Act
    // Assert
  });
});
```

---

## 7. Migração (pnpm db:push)
```bash
# Executar após atualizar schema.ts
pnpm db:push
```

---

## 8. Ordem de Implementação

1. ✅ Atualizar schema (users + disciplineDates + disciplineRanking)
2. ✅ Criar procedures tRPC (xerife, discipline, ranking)
3. ✅ Implementar middleware de acesso
4. ✅ Criar componentes Frontend
5. ✅ Adicionar testes
6. ✅ Integrar ao Admin.tsx
7. ✅ Deploy e validar

---

## 9. Notas Importantes

- **Segurança:** Validar acesso em TODAS as procedures
- **Performance:** Indexar companhia/peloton/studentId
- **Offline:** Sincronizar ranking quando reconectar
- **Notificações:** Alertar Xerife quando aluno marcar data

---

## 10. Exemplo de Uso

```typescript
// Aluno marcando data
await trpc.discipline.setStudentDate.mutate({
  disciplineId: 1,
  scheduledDate: new Date('2026-06-15'),
  studentId: 123,
  companhia: 2,
  peloton: 5,
});

// Xerife vendo ranking de seu pelotão
const ranking = await trpc.ranking.getByPeloton.query({
  companhia: 2,
  peloton: 5,
});

// Xerife Principal criando novo Xerife
await trpc.xerife.create.mutate({
  email: 'xerife@example.com',
  name: 'João Silva',
  level: 'peloton',
  companhia: 2,
  peloton: 5,
});
```

---

## Conclusão

Este sistema permite:
- ✅ Controle granular por companhia/pelotão
- ✅ Datas flexíveis de disciplinas
- ✅ Ranking visível para todos
- ✅ Segurança com validação de acesso
- ✅ Escalabilidade para 5 companhias × 10 pelotões

**Tempo estimado:** 4-6 horas de implementação + testes
