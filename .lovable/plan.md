Tornar MFA totalmente opcional para todas as roles

Objetivo: remover a obrigatoriedade da verificação em duas etapas para admin e locador. A partir desta alteração, qualquer usuário (admin, locador ou motorista) faz login apenas com e-mail/senha, sem passar por `/verificacao`. O card de "Verificação em duas etapas" em Configurações deixa de exibir o badge "Obrigatória" e o switch fica destravado para admin/locador — cada usuário liga se quiser.

## Entrega 1/3 — src/lib/mfa.ts

- Alterar `MFA_MANDATORY_ROLES` de `['admin', 'locador']` para `[]`.
- Remover a constante `MFA_DISABLED_FOR_DEMO` e o comentário de demonstração.
- Simplificar `isMfaRequired(role, mfaEnabled)` para retornar apenas `isMfaMandatory(role) || mfaEnabled === true`.
- Todo o restante do arquivo permanece inalterado (helpers de sessionStorage, validação de código, lógica de link mágico, timeouts etc.).

## Entrega 2/3 — src/test/mfa.test.ts

- Remover `MFA_DISABLED_FOR_DEMO` da importação.
- Substituir o `describe('MFA - obrigatoriedade por role')` inteiro por testes que afirmem:
  - Nenhuma role é obrigatória (`isMfaMandatory` retorna `false` para admin, locador, motorista e `null`).
  - A verificação só é exigida quando `mfaEnabled === true`, independentemente da role.

## Entrega 3/3 — src/components/auth/ProtectedRoute.tsx

- Atualizar apenas o comentário que descreve a verificação em duas etapas, refletindo que ela agora é opcional para todas as roles e ativada individualmente em Configurações.
- Nenhuma mudança de lógica — o comportamento já muda automaticamente via `isMfaRequired` na Entrega 1.

## Resultado esperado

- Login com e-mail/senha vai direto para o dashboard do papel, sem `/verificacao`.
- Configurações > "Verificação em duas etapas" não mostra mais "Obrigatória" para admin/locador e o switch fica habilitado.
- Testes unitários de MFA continuam passando e refletem o novo comportamento.

## Fora de escopo (não será alterado)

- `supabase/functions/mcp/index.ts` e `src/integrations/supabase/previewAuthStorage.ts` (auto-gerados).
- Políticas RLS existentes, `has_role`, `audit_trigger_func`.
- Configuração do Sonner.
- Qualquer lógica de e-mail/magic link além do comentário em `ProtectedRoute`.
