# Login com Google + Recuperação de senha em português

## 1. Revisar e consolidar o login com Google

- Reativar/confirmar o provedor Google no backend (Lovable Cloud gerenciado) na mesma entrega, para evitar o erro "Unsupported provider" no primeiro clique.
- Centralizar o fluxo hoje duplicado em `LoginForm.tsx` e `RegisterForm.tsx` num único helper (`signInWithGoogle`), tratando os três retornos possíveis do helper oficial: erro, `redirected` (o navegador vai sair da página — não desligar o estado de carregando) e sessão já definida.
- Traduzir as mensagens de erro do OAuth (popup bloqueado, janela fechada pelo usuário, provedor indisponível, rede) em textos claros em português, em vez do genérico "Erro ao entrar com Google".
- Conferir a continuidade do fluxo pós-Google: seleção de tipo de conta (`OAuthRoleSelection`), criação de perfil, redirecionamento por papel e a etapa de verificação em duas etapas — garantindo que o usuário Google não fique preso numa tela intermediária.

## 2. Recuperação de senha totalmente em português

- `ForgotPassword.tsx`: hoje exibe `error.message` cru (em inglês, ex.: "Email rate limit exceeded", "Unable to validate email address"). Criar um tradutor de erros de autenticação e usar mensagens como:
  - limite de envios atingido → "Muitas solicitações. Aguarde alguns minutos antes de pedir outro link."
  - e-mail inválido → "Digite um e-mail válido."
  - falha de rede → "Não foi possível conectar. Verifique sua internet e tente novamente."
- Validar o formato do e-mail antes de enviar e manter a resposta neutra (mesma mensagem de sucesso mesmo se o e-mail não existir, para não revelar cadastros).
- `ResetPassword.tsx`: traduzir os erros do `updateUser` (link expirado, senha igual à anterior, senha vazada em vazamentos/HIBP, senha fraca) e reaproveitar a checagem já existente em `utils.ts`.
- Melhorar a detecção de link inválido: além da sessão, considerar erros vindos na URL (`error_description`) e mostrar o motivo em português com o botão de solicitar novo link.

## 3. Testes

- Testes unitários (Vitest) para o novo tradutor de erros: cada código/mensagem do backend deve virar o texto em português esperado, com fallback genérico.
- Teste unitário do helper de Google cobrindo os três retornos (erro, redirecionado, sessão criada).
- Teste E2E (Playwright) em `e2e/auth-flows.spec.ts` ou spec novo: botão "Entrar com Google" visível e clicável no login e no cadastro, e fluxo de "Esqueci minha senha" exibindo a tela de confirmação e as mensagens em português nos casos de erro.

## Detalhes técnicos

- Novo arquivo `src/components/auth/authErrors.ts` com `translateAuthError(error)` mapeando mensagens/códigos do backend para português; consumido por `LoginForm`, `RegisterForm`, `ForgotPassword` e `ResetPassword`.
- Novo `src/components/auth/useGoogleSignIn.ts` encapsulando `lovable.auth.signInWithOAuth('google', { redirect_uri: window.location.origin })`.
- Sem mudanças de schema; `src/integrations/lovable/index.ts` não será editado (arquivo gerado).
