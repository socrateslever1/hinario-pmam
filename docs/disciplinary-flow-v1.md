# Fluxo disciplinar v1 — FO e LC

## Base normativa adotada

Esta primeira versão usa o Manual do Aluno do CFAP e o RDPMAM como base para:

- Fato Observado como registro objetivo, sem aplicação automática de punição;
- direito de defesa;
- competência vinculada ao cargo e ao escopo funcional;
- separação entre ciência, abertura do prazo, defesa, parecer, solução e homologação;
- LC de 24h, 48h e 60h conforme repetição válida no mesmo código;
- proibição de o xerife lançar, decidir ou homologar FO/LC apenas em razão da função de xerife.

O FATD não será automatizado nesta fase sem a norma específica usada pela PMAM.

## Estados do processo de LC

1. `draft` — preparação pelo setor competente;
2. `awaiting_acknowledgement` — disponível para ciência do aluno;
3. `acknowledged_waiting_open` — ciência registrada, defesa ainda bloqueada;
4. `defense_open` — prazo de defesa aberto;
5. `defense_submitted` — defesa protocolada;
6. `defense_expired` — prazo encerrado sem protocolo;
7. `platoon_opinion` — aguardando parecer do Cmt Pel;
8. `company_decision` — aguardando solução do Cmt Cia;
9. `cal_homologation` — aguardando homologação do CAL;
10. `published` — decisão publicada/aplicada;
11. `appeal_open` — prazo recursal aberto;
12. `closed` — processo encerrado;
13. `cancelled` — processo cancelado ou anulado.

## Campos obrigatórios no banco

- `acknowledged_at`;
- `acknowledged_by_student_id`;
- `defense_opens_at`;
- `formal_receipt_at`;
- `defense_deadline_at`;
- `defense_submitted_at`;
- `defense_text`;
- `defense_status`;
- `platoon_opinion`;
- `platoon_opinion_by`;
- `platoon_opinion_at`;
- `company_decision`;
- `company_decision_by`;
- `company_decision_at`;
- `homologation_status`;
- `homologated_by`;
- `homologated_at`;
- `published_at`;
- `appeal_deadline_at`;
- `appeal_text`;
- `appeal_submitted_at`;
- `normative_basis`;
- `exceptional_justification`;
- `created_by`;
- `updated_at`.

## Regras de servidor

- O relógio válido é o do servidor.
- Dar ciência não abre o prazo automaticamente.
- Antes de `defense_opens_at`, nenhuma rota pode aceitar defesa, anexos, protocolo, desistência ou encerramento.
- Ao alcançar `defense_opens_at`, o servidor define `formal_receipt_at` e `defense_deadline_at = formal_receipt_at + 24h`.
- Uma defesa só pode ser protocolada uma vez, salvo reabertura formal registrada por autoridade competente.
- O aluno continua podendo consultar o processo após o prazo.
- A contagem para LC automática considera somente FO homologado, não anulado e sem contestação acolhida, no mesmo código.
- A contagem automática apenas propõe um caso; nunca aplica LC sem defesa e decisão humana.
- LC direta deve seguir ciência, defesa, decisão, homologação e recurso.

## Permissões iniciais

- Aluno: consultar o próprio processo, dar ciência, apresentar defesa e recurso quando liberados.
- Cmt Pel: consultar, preparar e emitir parecer dentro do próprio escopo.
- Cmt Cia: consultar e solucionar dentro do próprio escopo.
- CAL/Alto Comando: homologar, publicar, cancelar e reabrir prazo quando juridicamente cabível.
- Xerife: nenhuma permissão disciplinar automática; somente permissões expressamente delegadas no futuro módulo de delegação.

## Auditoria

Toda mudança de estado deve registrar:

- processo;
- estado anterior e posterior;
- usuário responsável;
- data e hora do servidor;
- justificativa;
- origem da ação;
- identificação técnica disponível da sessão.
