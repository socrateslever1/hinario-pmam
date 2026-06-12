import { useState } from "react";
import Navbar from "@/components/Navbar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function XerifeSystemDocs() {
  const [activeSection, setActiveSection] = useState("visao-geral");

  const sections = [
    { id: "visao-geral", label: "Visão Geral" },
    { id: "arquitetura", label: "Arquitetura" },
    { id: "schema", label: "Schema" },
    { id: "procedures", label: "Procedures" },
    { id: "componentes", label: "Componentes" },
    { id: "fluxo", label: "Fluxo de Dados" },
    { id: "implementacao", label: "Implementação" },
    { id: "testes", label: "Testes" },
  ];

  return (
    <div className="min-h-screen bg-[#f5f2e8]">
      <Navbar />
      
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-[#1a3a2a] mb-2">
            🎖️ Sistema de Xerife por Companhia/Pelotão
          </h1>
          <p className="text-lg text-gray-600">
            Documentação Completa de Implementação
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Sidebar Navigation */}
          <div className="lg:col-span-1">
            <Card className="sticky top-20">
              <CardHeader>
                <CardTitle className="text-sm">Navegação</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {sections.map((section) => (
                  <Button
                    key={section.id}
                    variant={activeSection === section.id ? "default" : "ghost"}
                    className="w-full justify-start text-sm"
                    onClick={() => setActiveSection(section.id)}
                  >
                    {section.label}
                  </Button>
                ))}
              </CardContent>
            </Card>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            {activeSection === "visao-geral" && (
              <Card>
                <CardHeader>
                  <CardTitle>📋 Visão Geral</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p>
                    O <strong>Sistema de Xerife por Companhia/Pelotão</strong> é uma solução hierárquica de gerenciamento que permite controle granular de acesso baseado em estrutura militar.
                  </p>
                  
                  <div>
                    <h3 className="font-bold mb-2">Objetivos Principais</h3>
                    <ul className="list-disc list-inside space-y-1">
                      <li>Permitir que cada Xerife veja apenas seus dados</li>
                      <li>Disciplinas sem data fixa: aluno marca sua data particular</li>
                      <li>Ranking visível para todos</li>
                      <li>Controle de acesso granular e seguro</li>
                    </ul>
                  </div>

                  <div>
                    <h3 className="font-bold mb-2">Estrutura Hierárquica</h3>
                    <div className="bg-[#1a3a2a] text-white p-4 rounded-lg space-y-2">
                      <div>👨‍💼 Xerife Principal (Você)</div>
                      <div className="ml-4">→ 🎖️ Xerife de Companhia (5 existem)</div>
                      <div className="ml-8">→ 📍 Xerife de Pelotão (10 por companhia)</div>
                      <div className="ml-12">→ 👨‍🎓 Alunos (Múltiplos)</div>
                    </div>
                  </div>

                  <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
                    <strong>⏱️ Tempo de Implementação:</strong> 4-6 horas<br/>
                    <strong>📊 Escala:</strong> 5 companhias × 10 pelotões = até 50 Xerifes
                  </div>
                </CardContent>
              </Card>
            )}

            {activeSection === "arquitetura" && (
              <Card>
                <CardHeader>
                  <CardTitle>🏗️ Arquitetura</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <h3 className="font-bold mb-2">Stack Tecnológico</h3>
                    <div className="space-y-2">
                      <div className="flex justify-between p-2 bg-gray-100 rounded">
                        <span>Frontend</span>
                        <span>React 19 + Tailwind 4</span>
                      </div>
                      <div className="flex justify-between p-2 bg-gray-100 rounded">
                        <span>Backend</span>
                        <span>Express 4 + tRPC 11</span>
                      </div>
                      <div className="flex justify-between p-2 bg-gray-100 rounded">
                        <span>Database</span>
                        <span>TiDB/MySQL</span>
                      </div>
                      <div className="flex justify-between p-2 bg-gray-100 rounded">
                        <span>ORM</span>
                        <span>Drizzle</span>
                      </div>
                      <div className="flex justify-between p-2 bg-gray-100 rounded">
                        <span>Auth</span>
                        <span>Manus OAuth</span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="font-bold mb-2">Fluxo de Requisição</h3>
                    <pre className="bg-gray-800 text-green-400 p-4 rounded overflow-x-auto text-sm">
{`Usuário (Frontend)
    ↓
tRPC Hook (useQuery/useMutation)
    ↓
Express Router (/api/trpc)
    ↓
Procedure tRPC
    ↓
Validação de Acesso (ctx.user)
    ↓
Query/Mutation no Database
    ↓
Resposta Type-Safe
    ↓
Frontend atualiza UI`}
                    </pre>
                  </div>
                </CardContent>
              </Card>
            )}

            {activeSection === "schema" && (
              <Card>
                <CardHeader>
                  <CardTitle>📊 Schema do Banco de Dados</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <h3 className="font-bold mb-2">Tabela: users</h3>
                    <pre className="bg-gray-800 text-green-400 p-4 rounded overflow-x-auto text-sm">
{`xerifeLevel: xerifeLevelEnum('xerife_level'),
  // 'principal' | 'companhia' | 'peloton'
companhia: integer('companhia'), // 1-5
peloton: integer('peloton'), // 1-10`}
                    </pre>
                  </div>

                  <div>
                    <h3 className="font-bold mb-2">Tabela: discipline_dates</h3>
                    <pre className="bg-gray-800 text-green-400 p-4 rounded overflow-x-auto text-sm">
{`studentId: integer('student_id'),
disciplineId: integer('discipline_id'),
scheduledDate: timestamp('scheduled_date'),
companhia: integer('companhia'),
peloton: integer('peloton')`}
                    </pre>
                  </div>

                  <div>
                    <h3 className="font-bold mb-2">Tabela: discipline_ranking</h3>
                    <pre className="bg-gray-800 text-green-400 p-4 rounded overflow-x-auto text-sm">
{`studentId: integer('student_id'),
disciplineId: integer('discipline_id'),
score: integer('score'),
completedAt: timestamp('completed_at'),
companhia: integer('companhia'),
peloton: integer('peloton')`}
                    </pre>
                  </div>
                </CardContent>
              </Card>
            )}

            {activeSection === "procedures" && (
              <Card>
                <CardHeader>
                  <CardTitle>⚙️ Procedures tRPC</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <h3 className="font-bold mb-2">xerife.create</h3>
                    <p className="text-sm mb-2">Criar novo Xerife (apenas Xerife Principal)</p>
                    <pre className="bg-gray-800 text-green-400 p-4 rounded overflow-x-auto text-sm">
{`Input:
{
  email: string,
  name: string,
  level: 'principal' | 'companhia' | 'peloton',
  companhia?: number (1-5),
  peloton?: number (1-10)
}`}
                    </pre>
                  </div>

                  <div>
                    <h3 className="font-bold mb-2">discipline.setStudentDate</h3>
                    <p className="text-sm mb-2">Marcar data de disciplina (aluno ou Xerife)</p>
                    <pre className="bg-gray-800 text-green-400 p-4 rounded overflow-x-auto text-sm">
{`Input:
{
  disciplineId: number,
  scheduledDate: Date,
  studentId: number,
  companhia: number,
  peloton: number
}`}
                    </pre>
                  </div>

                  <div>
                    <h3 className="font-bold mb-2">ranking.getByPeloton</h3>
                    <p className="text-sm mb-2">Obter ranking de um pelotão (público)</p>
                    <pre className="bg-gray-800 text-green-400 p-4 rounded overflow-x-auto text-sm">
{`Input:
{
  companhia: number (1-5),
  peloton: number (1-10)
}

Output: Array de alunos ordenados por score`}
                    </pre>
                  </div>
                </CardContent>
              </Card>
            )}

            {activeSection === "componentes" && (
              <Card>
                <CardHeader>
                  <CardTitle>🎨 Componentes Frontend</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div className="border-l-4 border-[#c4a84b] pl-4">
                      <h3 className="font-bold">XerifeManager.tsx</h3>
                      <p className="text-sm text-gray-600">Gerenciar Xerifes (apenas Xerife Principal)</p>
                      <ul className="text-sm list-disc list-inside mt-1">
                        <li>Criar novo Xerife</li>
                        <li>Editar (companhia/pelotão)</li>
                        <li>Deletar</li>
                        <li>Listar com filtros</li>
                      </ul>
                    </div>

                    <div className="border-l-4 border-[#c4a84b] pl-4">
                      <h3 className="font-bold">DisciplineDatePicker.tsx</h3>
                      <p className="text-sm text-gray-600">Aluno marca sua data para disciplina</p>
                      <ul className="text-sm list-disc list-inside mt-1">
                        <li>Mostrar disciplinas sem data</li>
                        <li>DatePicker para marcar</li>
                        <li>Salvar automaticamente</li>
                      </ul>
                    </div>

                    <div className="border-l-4 border-[#c4a84b] pl-4">
                      <h3 className="font-bold">DisciplineRanking.tsx</h3>
                      <p className="text-sm text-gray-600">Ranking visível para todos</p>
                      <ul className="text-sm list-disc list-inside mt-1">
                        <li>Global (top 100)</li>
                        <li>Por Companhia</li>
                        <li>Por Pelotão</li>
                      </ul>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {activeSection === "fluxo" && (
              <Card>
                <CardHeader>
                  <CardTitle>📊 Fluxo de Dados</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <h3 className="font-bold mb-2">Permissões por Nível</h3>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm border-collapse">
                        <thead>
                          <tr className="bg-[#1a3a2a] text-white">
                            <th className="border p-2 text-left">Ação</th>
                            <th className="border p-2 text-left">Aluno</th>
                            <th className="border p-2 text-left">Xerife Pelotão</th>
                            <th className="border p-2 text-left">Xerife Companhia</th>
                            <th className="border p-2 text-left">Xerife Principal</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr>
                            <td className="border p-2">Marcar data</td>
                            <td className="border p-2">✓ Própria</td>
                            <td className="border p-2">✓ Qualquer</td>
                            <td className="border p-2">✓ Qualquer</td>
                            <td className="border p-2">✓ Qualquer</td>
                          </tr>
                          <tr className="bg-gray-50">
                            <td className="border p-2">Ver ranking</td>
                            <td className="border p-2">✓ Pelotão</td>
                            <td className="border p-2">✓ Pelotão</td>
                            <td className="border p-2">✓ Companhia</td>
                            <td className="border p-2">✓ Global</td>
                          </tr>
                          <tr>
                            <td className="border p-2">Criar Xerife</td>
                            <td className="border p-2">✗</td>
                            <td className="border p-2">✗</td>
                            <td className="border p-2">✗</td>
                            <td className="border p-2">✓</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {activeSection === "implementacao" && (
              <Card>
                <CardHeader>
                  <CardTitle>🚀 Guia de Implementação</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <ol className="space-y-3 list-decimal list-inside">
                    <li><strong>Atualizar Schema</strong> - Adicionar campos e tabelas</li>
                    <li><strong>Executar Migração</strong> - <code className="bg-gray-200 px-2 py-1 rounded">pnpm db:push</code></li>
                    <li><strong>Implementar Procedures</strong> - server/routers.ts</li>
                    <li><strong>Criar Componentes</strong> - client/src/components/</li>
                    <li><strong>Integrar ao Admin</strong> - client/src/pages/Admin.tsx</li>
                    <li><strong>Testes</strong> - <code className="bg-gray-200 px-2 py-1 rounded">pnpm test</code></li>
                    <li><strong>Deploy</strong> - git push</li>
                  </ol>

                  <div className="bg-green-50 border-l-4 border-green-400 p-4">
                    <strong>✓ Checklist:</strong>
                    <ul className="text-sm list-disc list-inside mt-2 space-y-1">
                      <li>Schema atualizado</li>
                      <li>Migração executada</li>
                      <li>Procedures implementadas</li>
                      <li>Componentes criados</li>
                      <li>Testes passando</li>
                      <li>Integração completa</li>
                      <li>Deploy realizado</li>
                    </ul>
                  </div>
                </CardContent>
              </Card>
            )}

            {activeSection === "testes" && (
              <Card>
                <CardHeader>
                  <CardTitle>✅ Testes Automatizados</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <h3 className="font-bold mb-2">Teste: Xerife Principal cria Xerife</h3>
                    <pre className="bg-gray-800 text-green-400 p-4 rounded overflow-x-auto text-sm">
{`test('Xerife Principal cria Xerife', async () => {
  const xerife = await trpc.xerife.create.mutate({
    email: 'xerife@test.com',
    name: 'João Silva',
    level: 'companhia',
    companhia: 1,
  });
  
  expect(xerife.xerifeLevel).toBe('companhia');
});`}
                    </pre>
                  </div>

                  <div>
                    <h3 className="font-bold mb-2">Teste: Aluno marca data</h3>
                    <pre className="bg-gray-800 text-green-400 p-4 rounded overflow-x-auto text-sm">
{`test('Aluno marca data', async () => {
  await trpc.discipline.setStudentDate.mutate({
    disciplineId: 1,
    scheduledDate: new Date('2026-06-15'),
    studentId: 123,
    companhia: 1,
    peloton: 5,
  });
  
  const saved = await db.query.disciplineDates.findFirst({
    where: eq(disciplineDates.studentId, 123),
  });
  
  expect(saved).toBeDefined();
});`}
                    </pre>
                  </div>

                  <div className="bg-blue-50 border-l-4 border-blue-400 p-4">
                    <strong>📊 Cobertura de Testes:</strong>
                    <ul className="text-sm list-disc list-inside mt-2 space-y-1">
                      <li>✓ Criação de Xerife</li>
                      <li>✓ Marcação de data</li>
                      <li>✓ Ranking</li>
                      <li>✓ Validação de acesso</li>
                      <li>✓ Integridade de dados</li>
                    </ul>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
