# Preferências de notificação persistidas + limpeza

Hoje os interruptores de notificação das telas de Configurações (admin e locador) são apenas visuais: voltam ao padrão a cada recarregamento. Esta rodada passa a salvá-los na conta do usuário.

## O que muda para o usuário

- Em Configurações do administrador, os avisos "Novos Cadastros", "Alertas de Sistema" e "Relatórios Semanais" passam a ser salvos ao clicar em "Salvar Alterações" e continuam como escolhidos após recarregar.
- Em Configurações do locador, o mesmo vale para "Alertas por E-mail", "Alertas de Pagamento", "Alertas de Manutenção" e "Novas Mensagens", salvos junto com os demais dados da conta.
- O botão de salvar do administrador mostra indicador de carregamento enquanto grava.

## Implementação (ordem obrigatória)

1. **Banco**: adicionar coluna `notification_preferences` (jsonb, `NOT NULL DEFAULT` com as 7 chaves em `true`) em `public.profiles`, com comentário explicativo. Sem nova policy (RLS owner-based já cobre) e sem novos triggers.
2. **`src/hooks/useProfile.tsx`**: acrescentar `notification_preferences: Record<string, boolean> | null` à interface `Profile`.
3. **`src/pages/admin/Settings.tsx`**: usar `useProfile`/`useUpdateProfile`; estado local `notifPrefs` com padrão das 3 chaves do admin, hidratado via `useEffect` mesclando as chaves vindas do perfil (chaves desconhecidas preservadas); os 3 `Switch` viram controlados (`checked` + `onCheckedChange`); `handleSave` grava `notification_preferences`; botão com `Loader2` em `isPending`. Cards "Configurações da Plataforma" e "Segurança" ficam intocados.
4. **`src/pages/locador/Settings.tsx`**: mesmo padrão com as 4 chaves do locador, hidratação dentro do `useEffect` já existente e envio junto do `updateProfile.mutate` atual.
5. **Remover `src/types/index.ts`** — confirmado sem nenhum import no projeto.
6. **Remover `bun.lock` e `bun.lockb`** — o CI (`.github/workflows/e2e-tests.yml`) usa `npm ci`; `package-lock.json` fica como única fonte de verdade.

## Detalhes técnicos

- O objeto jsonb é compartilhado: cada tela lê/escreve apenas as chaves que usa, mesclando por spread para não apagar as demais.
- Nada de cores cruas do Tailwind; toasts continuam via Sonner (`useUpdateProfile` já emite sucesso/erro); ícones Lucide.
- Fora de escopo: MFA, LGPD, chat, CORS, `/admin/metricas`, `/admin/planos`.

## Validação

`tsc --noEmit`, `eslint .`, `vitest run` e `vite build` limpos; verificação manual de persistência dos interruptores nas duas telas após recarregar.
