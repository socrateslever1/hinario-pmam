# Debug: Sincronizador Mobile - Erros Corrigidos

## Problema Original

**Contexto:** Página de sincronização de hinos em modo celular (mobile)

**Sintomas Observados:**
1. **Modo "Linhas" voltava para "Foco"** — Quando usuário clicava em "Marcar agora" ou clicava em uma linha para marcar, o sistema automaticamente voltava para a aba "Foco"
2. **Botões bloqueavam conteúdo** — Os botões "Marcar agora", "Revisar linhas" e "Salvar sincronização" ficavam na frente do conteúdo, impedindo scroll
3. **Tempo capturado incorreto** — O sistema capturava tempo retroativo em vez do tempo atual do player
4. **Sem feedback de marcação** — Usuário não sabia se a linha foi marcada corretamente

## Raiz do Problema

### Problema 1: Modo "Linhas" voltava para "Foco"
**Localização:** `client/src/components/LyricsMarker.tsx` linha 878

**Causa:** Função `focusLine(index, compact ? "marker" : undefined)` estava sendo chamada quando usuário clicava em uma linha. Em mobile (compact=true), isso forçava `setMobileTab("marker")`, mudando de aba.

**Solução Aplicada:**
```typescript
// ANTES
onClick={() => focusLine(index, compact ? "marker" : undefined)}

// DEPOIS
onClick={() => focusLine(index)}
```

### Problema 2: Botões bloqueavam conteúdo
**Localização:** `client/src/components/LyricsMarker.tsx` linha 993

**Causa:** `z-index: 40` dos botões sticky era muito alto, ficando na frente do conteúdo scrollável

**Solução Aplicada:**
```typescript
// ANTES
<div className="sticky bottom-0 z-40 bg-white/95 backdrop-blur...">

// DEPOIS
<div className="sticky bottom-0 z-10 bg-white/95 backdrop-blur...">
```

### Problema 3: Tempo capturado incorreto
**Localização:** `client/src/components/LyricsMarker.tsx` função `markCurrentLine`

**Causa:** Sistema usava state `currentTime` que era atualizado via `onTimeUpdate`, criando delay entre o tempo exibido no player e o tempo capturado

**Solução Aplicada:**
```typescript
// ANTES
const time = currentTime; // State desatualizado

// DEPOIS
const playerElement = playerRef.current as MediaPlayerElement;
const time = playerElement?.currentTime || currentTime; // Lê direto do player
```

## Fluxo de Teste

1. **Abrir página de sincronização** → Ir para Área do Xerife > Sincronizar Hino
2. **Modo "Linhas"** → Clicar na aba "Linhas"
3. **Marcar versos** → Clicar "Marcar agora" ou em uma linha
4. **Verificar:**
   - ✅ Permanece em modo "Linhas"
   - ✅ Contador atualiza (ex: 1/32 → 2/32)
   - ✅ Tempo capturado é o tempo atual do player
   - ✅ Botões não bloqueiam scroll
   - ✅ Pode rolar lista de versos livremente

## Commits Relacionados

- `ed6818e7` - Reorganizar layout do sincronizador para botões não bloquearem scroll
- `ab5e20a1` - Corrigir captura de tempo no sincronizador
- `fa0b4001` - Corrigir modo Linhas voltando para Foco e z-index dos botões

## Lições Aprendidas

1. **State vs DOM Reality** — Sempre ler valores críticos diretamente do DOM/refs quando há delay de atualização
2. **Z-index Cascade** — Verificar z-index de elementos sticky/fixed que podem bloquear conteúdo
3. **Mobile Tab Switching** — Evitar mudar de aba automaticamente em modo mobile quando usuário está em fluxo de trabalho
4. **Sticky Positioning** — Usar `sticky` com `z-index` baixo para não interferir com conteúdo

## Recomendações Futuras

- [ ] Adicionar testes E2E para sincronização mobile
- [ ] Implementar debounce em `onTimeUpdate` para melhor performance
- [ ] Adicionar visual feedback (toast/animation) ao marcar verso
- [ ] Considerar usar Zustand ou Context para state global de sincronização
