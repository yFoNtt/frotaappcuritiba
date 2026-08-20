# Desativar MFA temporariamente (modo demonstração)

Objetivo: login vai direto de `/login` para o dashboard do papel (admin/locador/motorista), sem passar por `/verificacao` e sem chamar `signInWithOtp`. Todo o código de MFA permanece intacto, apenas "desligado" por uma flag única.

## Arquivos que serão tocados

1. `src/lib/mfa.ts` — única mudança funcional:
   - Nova constante `export const MFA_DISABLED_FOR_DEMO = true;` com comentário explicando que é temporário e como reverter (trocar para `false`).
   - `isMfaRequired()` passa a retornar `false` imediatamente quando a flag está ativa. `MFA_MANDATORY_ROLES`, `isMfaMandatory`, `isValidMfaCode`, `isMagicLinkReturn`, `parseMagicLinkTokens`, storage helpers etc. ficam inalterados.

2. `src/test/mfa.test.ts` — ajuste dos testes que dependem de `isMfaRequired` para refletirem a flag (os testes de `isMfaMandatory`, código de 6 dígitos e link mágico continuam iguais). Assim a suíte segue verde e documenta o comportamento atual.

3. `src/components/settings/TwoFactorCard.tsx` — opcional, apenas leitura/aviso: exibir que a verificação está desativada temporariamente. Só faço se você quiser; por padrão **não** altero.

Nada mais é tocado: sem mudanças em RLS, `user_roles`, políticas, Edge Functions ou banco.

## Por que isso basta

- `ProtectedRoute` só desvia para `/verificacao` quando `mfaRequired && !mfaVerified`; com a flag, `mfaRequired` é sempre `false`.
- `TwoFactor.tsx` já redireciona para o dashboard quando `!mfaRequired`, então mesmo um acesso direto a `/verificacao` volta ao painel.
- `signInWithOtp` só é chamado dentro de `/verificacao` (reenvio manual); como a tela nunca é atingida, nenhuma chamada é gerada.

## Sobre a branch `demo/sem-mfa`

Não consigo criar ou trocar de branch por aqui — o versionamento do projeto é gerenciado pela plataforma e todas as edições vão para a linha de trabalho atual. Alternativas:

- Você cria a branch no GitHub a partir deste commit e reverte a alteração aqui quando quiser.
- Ou mantemos a flag: reativar o MFA é trocar uma linha (`MFA_DISABLED_FOR_DEMO = false`), sem tocar em mais nada.

Ao final envio o diff completo dos arquivos alterados.
