# Tabelas do Banco

## Runtime ativo

Estas tabelas sao as usadas pelo backend atual em `server/db.ts`:

- `pmam_users`
- `pmam_hymns`
- `pmam_cfap_missions`
- `pmam_comments`
- `pmam_likes`
- `pmam_site_settings`
- `pmam_study_students`
- `pmam_study_module_progress`
- `pmam_drill`
- `pmam_mission_media`
- `pmam_content`
- `pmam_content_layout`

## Legado preservado

Estas tabelas continuam no banco como historico/compatibilidade, mas nao devem ser a base do runtime principal:

- `users`
- `hymns`
- `cfap_missions`
- `comments`
- `likes`
- `site_settings`

## Regra pratica

Quando o objetivo for evoluir o sistema atual, use sempre as tabelas `pmam_*`.
As tabelas legadas so devem ser consultadas para auditoria, migracao ou limpeza planejada.
