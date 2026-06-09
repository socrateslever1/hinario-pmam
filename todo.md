# Project TODO

- [x] Schema do banco de dados (hinos, missões CFAP, categorias)
- [x] Seed dos 26 hinos com letras extraídas do PDF
- [x] Backend: routers tRPC para hinos, missões CFAP, admin
- [x] Identidade visual militar (cores verde/dourado, brasão PMAM)
- [x] Página inicial com missão do hinário e introdução
- [x] Catálogo de hinos com categorização (nacionais, PMAM, militares, orações)
- [x] Página individual do hino com letra e player de áudio (YouTube embed)
- [x] Página CFAP 2026 para missões e comunicados
- [x] Painel administrativo para gerenciar hinos e missões
- [x] Sistema de autenticação admin
- [x] Upload de áudio MP3 ou link YouTube para cada hino
- [x] Sistema de notificação para alunos CFAP
- [x] Páginas informativas sobre história/significado de cada hino (página Sobre)
- [x] Navegação responsiva e mobile-friendly
- [x] Testes vitest (24 testes passando)
- [x] Renomear "Admin" para "Área do Xerife" em todo o site
- [x] Criar sistema de login próprio com email/senha (sem OAuth)
- [x] Criar usuário master socrates.lever@gmail.com / 123456
- [x] Permitir que o master crie outros usuários
- [x] Gerenciamento de informações do rodapé pelo painel
- [x] Gerenciamento completo de missões CFAP pelo painel
- [x] Tela de login dedicada com email/senha
- [x] Bug: Botão de login some após logout na Área do Xerife
- [x] Bug: Links do rodapé não estão funcionando (navegação interna)
- [x] Curtidas nos hinos (sem login, por fingerprint/localStorage) - backend pronto
- [x] Comentários nos hinos (nome + texto, sem login) - backend pronto
- [x] Curtidas nas missões CFAP - backend pronto
- [x] Comentários nas missões CFAP - backend pronto
- [x] Datas de cumprimento nas missões - backend pronto
- [x] Tags de status nas missões (ativa/cumprida/inativa) - backend pronto
- [x] Contador de acessos/visualizações nas missões - backend pronto
- [x] Moderação de comentários pelo Xerife (apagar) - backend pronto
- [x] Bug: DialogTitle faltando no diálogo da página CFAP 2026
- [x] Criar tabela pmam_drill (Ordem Unida) no banco de dados
- [x] Implementar CRUD backend (tRPC procedures) para Ordem Unida
- [x] Criar UI de gerenciamento (Admin tab) para Ordem Unida
- [x] Criar página pública de visualização para Ordem Unida
- [x] Adicionar link "Ordem Unida" na navbar
- [x] Criar testes vitest para Drill CRUD
- [x] Adicionar campos youtubeUrl e cornettaAudioUrl ao schema
- [x] Carregar 17 Ordens Unidas do Manual EB70-MC-10.308 via seed
- [x] Melhorar UI Admin para editar links YouTube e áudio de corneta
- [x] Adicionar exibição de YouTube e áudio na página de detalhe
- [x] Testar e validar Ordem Unida em mobile e desktop

## PWA e Offline-First

- [x] Criar ícone PWA profissional (512x512 e 192x192)
- [x] Configurar manifest.json com metadados PWA
- [x] Implementar Service Worker para cache offline
- [x] Adicionar sincronização automática ao conectar
- [x] Cache de hinos e Ordem Unida
- [x] Componente OfflineIndicator com status de conexão
- [x] Hook usePWA para gerenciar instalação e atualizações
- [ ] Testes de funcionalidade offline

## Mídia em Missões

- [ ] Adicionar campos de mídia ao schema (imagens, PDFs, vídeos, áudio)
- [ ] Criar procedures tRPC para upload de mídia
- [ ] UI para upload de múltiplos arquivos em missões
- [ ] Visualizador de imagens com preview
- [ ] Visualizador de vídeos
- [ ] Visualizador de áudio
- [ ] Leitor de PDF integrado
- [ ] Download de arquivos
- [ ] Testes de upload e visualização


## Painel de Controle Profissional

- [ ] Criar painel de controle na Área do Xerife com editor visual
- [ ] Implementar editor de texto rico (WYSIWYG) com TipTap ou similar
- [ ] Adicionar gerenciador de mídia com upload drag-and-drop
- [ ] Implementar edição inline na Home (quando logado como Xerife)
- [ ] Adicionar agendamento de publicação
- [ ] Implementar histórico de versões
- [ ] Adicionar preview em tempo real
- [ ] Criar sistema de publicar/despublicar

## Seção de Blog/Posts na Home

- [x] Reduzir altura da seção hero verde (de ~600px para ~300px)
- [x] Criar tabela pmamBlogPost no banco de dados com campos: id, title, content, imageUrl, createdAt, updatedAt, authorId, published
- [x] Implementar procedures tRPC para CRUD de posts (criar, editar, deletar, listar)
- [x] Criar seção "Notícias & Avisos" na Home com scroll horizontal
- [x] Implementar cards de blog com data, título, imagem e preview de conteúdo
- [x] Adicionar componente de formatacao de data em portugues brasileiro
- [x] Corrigir erros de playerVars em componentes de video
- [x] Criar tabela pmam_blog_post no banco de dados
- [x] Escrever testes vitest para CRUD de posts
- [ ] Criar interface de edicao de posts na Area do Xerife com RichTextEditor
- [ ] Integrar MediaUploadManager para upload de imagens nos posts
- [ ] Adicionar botao "Editar/Novo Post" visivel apenas para Xerife logado
- [ ] Implementar sistema de publicacao/despublicacao de posts
- [ ] Testar responsividade em mobile e desktop

## Correções de Erros

- [x] Corrigir Service Worker (sw.js) - remover localStorage (indisponível em SW context)
- [x] Corrigir posts antigos no banco com published=0 → published=1
- [x] Corrigir BlogManagementPanel.tsx - renomear estado alert para feedback (conflito com window.alert)
- [x] Corrigir SlateEditor.tsx - tipagem customizada do Slate (module augmentation + children recursivos)
- [x] Corrigir StudyStudio.tsx - getDashboard→dashboard, onSuccess→useEffect, tipar data, answers no progress, props para ExamPanel
- [x] Corrigir routers.ts - imageUrl null→undefined com nullish coalescing (?? undefined)- [x] Bug: NotFoundError ao remover nó do DOM — corrigido via key={index} em SyncedLyricsPanel
- [x] Sistema de atualização: Network First para JS/CSS, detecção de reconexão, versão estável por processo"
- [x] Bug: Auto-scroll de letra pula para o final em vez de acompanhar sincronismo das estrofes (correção definitiva: key=index, ref direto, loop reverso, dependências corrigidas)
- [x] Auto-scroll ativado por padrão (useState true)
- [x] Play na mesma linha do nome do hino no player
- [x] Botões: tocar 1x, tocar todas, repetir no player
- [x] Bug: Editor de texto do comunicado bloqueia scroll por toque em dispositivos móveis
- [x] Bug: Painel comunicados — scroll ao redor do editor não funciona em touch, botão Salvar fica fora da tela
- [x] Bug: Painel comunicados — tela trava após adicionar imagem, impossível continuar editando
- [x] Melhoria: Salvamento automático de rascunho no painel de comunicados (localStorage)
- [x] Melhoria: Botão “Continuar rascunho” ao abrir painel com rascunho salvo
- [x] Melhoria: Inserção de link YouTube e outros conteúdos no editor de comunicados
- [x] Bug: Imagem do post de blog não responsiva (object-contain, max-w-full, maxHeight:60vw)
- [x] Bug: Botões de formatação do editor não funcionam (substituído SlateEditor por RichTextEditor/Tiptap)
- [x] Bug: Botão de aspas publicava acidentalmente (type=button adicionado em todos os botões da toolbar)

## Upload de Imagem no Editor

- [x] Upload direto de imagem no editor de comunicados (S3, sem depender de serviços externos)
- [x] Tabela pmam_post_images no banco para metadados de imagens dos posts
- [x] Endpoint tRPC blog.uploadImage para upload de imagem via S3
- [x] Edição inline de imagem no editor (tamanho, alinhamento, float/wrap, alt text)
- [x] Alinhamento de imagem: esquerda, centro, direita (sem float)
- [x] Float/wrap de texto ao redor da imagem: esquerda, direita, bloco
- [x] Redimensionamento por alhas de arrastar (canto inferior esquerdo e direito)
- [x] Toolbar contextual de imagem aparece ao selecionar a imagem
- [x] Controles de largura: 25%, 50%, 75%, 100%
- [x] Campo de alt text editável inline

## Player YouTube em Posts de Blog

- [x] Adicionar coluna youtube_url à tabela pmam_blog_post
- [x] Atualizar endpoints create/update do blog para aceitar youtubeUrl
- [x] Exibir player YouTube embutido na página de detalhe do post (BlogDetail.tsx)
- [x] Campo youtubeUrl no formulário do BlogManagementPanel já existia — agora é salvo no banco

## Erros TypeScript Persistentes

- [x] StudyStudio.tsx: parâmetro 'm' sem tipo — corrigido com type alias ModuleProgress
- [x] StudyStudio.tsx: saveProgress não existe — corrigido para saveModuleProgress.useMutation()
- [x] BlogManagementPanel.tsx: Identifier useState duplicado — era erro de cache do Vite (arquivo correto)


## Curtidas e Comentários em Posts de Blog

- [x] Tabelas pmam_comments e pmam_likes já existiam no banco com suporte a target_type
- [x] Funções de curtidas e comentários adicionadas ao db.ts
- [x] Endpoints tRPC: toggleLike, getLikes, getComments, addComment, deleteComment
- [x] Barra de curtidas com contador de likes
- [x] Seção de comentários com formulário de novo comentário
- [x] Suporte a comentários anônimos (por nome)
- [x] Admins podem deletar comentários

## Layout Corrigido do BlogDetail

- [x] Imagem de capa com altura fixa (não cresce)
- [x] Conteúdo com max-width: 3xl e padding lateral consistente
- [x] Seção "Mais Comunicados" sempre abaixo de tudo
- [x] Imagens do editor com overflow controlado
- [x] Player YouTube com aspect ratio 16:9
- [x] Estilos de float/wrap de imagem preservados


## Correção de Layout do BlogDetail

- [x] Imagens com `display: block` (não inline)
- [x] Imagens limitadas a `max-width: 100%` do container
- [x] Imagens centralizadas por padrão (`margin: 0 auto`)
- [x] Container com `overflow: hidden` para evitar overflow
- [x] Float preservado para imagens com `float: left/right`
- [x] Seção "Mais Comunicados" nunca é "imprensada"

### Upload de MP3 e Cache Offline para Hinos

- [x] Endpoint tRPC hymns.uploadAudio para upload de MP3 para S3
- [x] Botão "Upload MP3" no painel admin com seletor de arquivo
- [x] Service Worker melhorado para cachear MP3 com estratégia Cache First
- [x] Detecção de offline no LyricsPlayer para tocar MP3 cacheado
- [x] Sincronismo de letra preservado em ambos os modos (YouTube e MP3 offline)
- [x] Badge de status "🔴 Áudio Offline" quando tocando MP3 cacheado
- [x] Pré-caching automático de MP3 via usePWA.cacheUrls

## Correção do Banco de Dados para Áudio

- [x] Coluna audio_url mudada de varchar(255) para LONGTEXT
- [x] Suporta URLs de qualquer tamanho (MP3, WAV, OGG, M4A, AAC, FLAC, WebM)
- [x] Endpoint hymns.uploadAudio com validação de formato
- [x] Limite de tamanho: 100MB por arquivo
- [x] Upload para S3 com nome único (hymns/{id}-{nanoid}.{ext})
- [x] Suporte a múltiplos formatos de áudio (7 formatos diferentes)cessar hino (via usePWA.cacheUrls)

## Sistema de Notas e Ranking CFAP 2026

- [x] Criar tabelas pmam_students, pmam_disciplines, pmam_student_grades no banco
- [x] Implementar autenticação de aluno via ID numérico (1111-5252) + senha
- [x] Extrair Companhia e Pelotão automaticamente do ID do aluno
- [x] Criar procedures tRPC para CRUD de notas
- [x] Validação de notas: 0-10 com suporte a decimais (9.5)
- [x] Conversão automática: 70 → 7.0, 100 → 10.0
- [x] Suporte a notas com vírgula (9,5) e ponto (9.5)
- [x] Ranking baseado na SOMA dos pontos (não média)
- [x] Exibição de "Média Geral" (AVG) para o aluno
- [x] Exibição de "Total de Pontos" (SUM) no ranking
- [x] Ranking Geral (todos os alunos)
- [x] Ranking por Companhia
- [x] Ranking por Pelotão
- [x] Paginação "Mostrar Mais" nos rankings (mostra 3 primeiros)
- [x] Badges de posição (ouro, prata, bronze)
- [x] Botão "Editar" para atualizar nota com scroll automático
- [x] Botão "Deletar" para remover nota
- [x] Validação em 2 camadas (frontend + backend)
- [x] Testes vitest para ranking (9 testes passando)
- [x] Imagens funcionam em print/PDF (CloudFront URLs)
- [x] Painel "Xerife" para gerenciar notas de todos os alunos
- [x] Interface de aluno separada da interface de admin


## Melhorias Mobile - Notas e Navegação

- [x] Criar componente BottomNavigation para mobile (Hinos, Charlie Mike, Notas, Perfil)
- [x] Criar página dedicada GradesManagement.tsx para lançamento/edição de notas
- [x] Implementar lista de disciplinas com campos de nota (lado a lado desktop, empilhado mobile)
- [x] Adicionar indicador visual (verde) para disciplinas com notas já lançadas
- [x] Integrar BottomNavigation com roteamento para GradesManagement
- [x] Botão "Lançar Nota" redireciona para GradesManagement
- [x] Botão "Editar" redireciona para GradesManagement com scroll para disciplina
- [x] Testes vitest para BottomNavigation e GradesManagement
- [x] Testar responsividade em mobile (iPhone, Android)
- [x] Testar responsividade em desktop (sem quebras de layout)
