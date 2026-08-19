# Corrigir travamento ao abrir o link de redefinição de senha

## O que está acontecendo

O link do e-mail abre `/redefinir-senha` já com uma sessão de recuperação ativa. Enquanto a página carrega, o layout público faz uma verificação global: se existe usuário logado mas o papel (locador/motorista/admin) ainda não foi resolvido, ele **força um redirecionamento para `/login`** e mostra "Redirecionando para seleção de perfil...".

Pior: a tela de `/login` também usa o mesmo layout público, e o layout substitui o conteúdo pelo spinner em vez de renderizar a seleção de perfil. Resultado: a página fica presa no carregamento infinito, exatamente como na captura de tela.

## Correções

1. **Não sequestrar a página de redefinição de senha**
   O redirecionamento por "usuário sem papel" passa a ignorar as rotas de autenticação e recuperação (`/redefinir-senha`, `/esqueci-senha`, `/verificacao`, `/login`, `/cadastro`, `/convite/:token`). Em `/redefinir-senha` o usuário sempre verá o formulário de nova senha.

2. **Acabar com o loop no `/login`**
   Quando já estiver em `/login`, o layout renderiza o conteúdo normalmente (a tela de seleção de perfil) em vez do spinner "Redirecionando para seleção de perfil...". Assim nunca mais fica travado carregando.

3. **Sessão de recuperação isolada**
   Após atualizar a senha com sucesso, o fluxo continua encerrando a sessão e voltando ao login (comportamento atual mantido).

## Detalhes técnicos

- `src/components/layout/PublicLayout.tsx`: usar `useLocation()` e uma lista de rotas isentas do gate de papel; só redirecionar quando a rota atual não estiver na lista; quando `pathname === '/login'`, renderizar `children` em vez do estado de spinner.
- Nenhuma mudança de banco de dados, RLS ou Edge Function é necessária.
- Teste: `src/test/auth-redirect.test.tsx` precisa de um caso novo — usuário com sessão e sem papel em `/redefinir-senha` deve ver o formulário, e em `/login` deve ver a seleção de perfil (não o spinner).
