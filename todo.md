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
