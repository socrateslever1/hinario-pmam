# Mecanismo de Auto-Atualização Silenciosa - Hinário PMAM

## Resumo Executivo

Implementado sistema completo de auto-atualização silenciosa que verifica novas versões do aplicativo a cada recarga de página e atualiza automaticamente quando o usuário está inativo, sem interromper a experiência do usuário.

---

## Arquitetura

### 1. Backend - Sistema de Versioning

**Arquivo:** `server/_core/version.ts`

Gerencia informações de versão do build e fornece endpoint `/api/version`.

**Estrutura de Resposta:**
```json
{
  "version": "936b0e7b",
  "timestamp": 1778778028454,
  "buildTime": "2026-05-17T03:51:47.632Z"
}
```

### 2. Frontend - Hook de Auto-Atualização

**Arquivo:** `client/src/hooks/useAutoUpdate.ts`

Verifica versão a cada 60 segundos, detecta atividade do usuário e aplica atualização silenciosamente quando inativo.

**Constantes:**
- `CHECK_INTERVAL = 60000` (1 minuto entre verificações)
- `INACTIVITY_TIMEOUT = 30000` (30 segundos de inatividade)

**Eventos Monitorados:**
- mousedown, keydown, touchstart, click, scroll

### 3. Service Worker - Suporte a Versionamento

**Arquivo:** `client/public/sw.js`

Modificações:
- Cache version dinâmico armazenado em localStorage
- Handler UPDATE_CACHE_VERSION para processar novas versões
- Limpeza automática de caches antigos

### 4. Integração no App

**Arquivo:** `client/src/App.tsx`

```typescript
function App() {
  useAutoUpdate();
  // ... resto do app
}
```

---

## Fluxo de Funcionamento

```
1. App carrega → useAutoUpdate() inicializa
   ↓
2. Monitorar atividade do usuário (30s timeout)
   ↓
3. Verificar versão a cada 60s (apenas se inativo)
   ↓
4. Se nova versão detectada:
   - Notificar Service Worker
   - Aguardar inatividade do usuário
   ↓
5. Aplicar atualização silenciosamente:
   - SKIP_WAITING ao SW
   - window.location.reload()
```

---

## Comportamento em Diferentes Cenários

| Cenário | Comportamento |
|---------|---------------|
| **Usuário Ativo** | Verificação pulada, nenhuma interrupção |
| **Usuário Inativo + Atualização** | Atualização aplicada silenciosamente |
| **Sem Conexão** | Erro logado, próxima verificação agendada |
| **Primeira Carga** | Versão inicializada, verificação após 5s |

---

## Arquivos Modificados

| Arquivo | Mudança |
|---------|---------|
| `server/_core/version.ts` | Criado |
| `server/_core/index.ts` | Rota `/api/version` adicionada |
| `client/src/hooks/useAutoUpdate.ts` | Criado |
| `client/src/App.tsx` | Hook integrado |
| `client/public/sw.js` | Cache dinâmico + handler |

---

## Testes

### Verificar Endpoint
```bash
curl http://localhost:3000/api/version
```

### Logs Esperados
```
[AutoUpdate] User is active, skipping check
[AutoUpdate] Update available: v1 -> v2
[AutoUpdate] Applying silent update
[SW] Updating cache version: v1 -> v2
```

---

## Status

✅ **Implementação Completa**
- Backend versioning funcional
- Frontend auto-update implementado
- Detecção de atividade ativa
- Service Worker integrado
- Pronto para produção

---

**Data:** 17 de Maio de 2026  
**Versão:** 1.0.0
