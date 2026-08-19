# Verificação em duas etapas: concluir pelo link do e-mail (solução imediata)

## O problema

O e-mail que chega é o modelo padrão do provedor de autenticação, em inglês e só com o botão "Log In" — ele não traz o código de 6 dígitos. Para enviar um e-mail próprio, em português e com o código, o projeto precisa de um domínio de e-mail próprio configurado como remetente, e hoje não há nenhum.

## O que será feito agora

Tornar a verificação funcional com o e-mail que já chega, sem depender de domínio:

1. A tela de verificação passa a aceitar duas formas de concluir:
   - clicar no botão do e-mail (abre o app já verificado), ou
   - digitar o código de 6 dígitos, quando os modelos em português estiverem ativos.
2. Ao voltar pelo link do e-mail, a sessão é marcada como verificada automaticamente e o usuário cai direto no painel do seu perfil (admin, locador ou motorista) — sem passar de novo pela tela de código.
3. Textos da tela reescritos em português explicando claramente: "Enviamos um e-mail para X. Clique no botão do e-mail para concluir o acesso, ou digite o código, se ele estiver no e-mail."
4. Reenvio continua com o contador de 60s e mensagens em português.

## Quando houver domínio (etapa seguinte, opcional)

Assim que você tiver um domínio próprio, configuro o remetente e crio os modelos de e-mail em português (incluindo o de acesso com o código de 6 dígitos em destaque). A tela de código já ficará pronta para isso — nada precisa ser refeito.

## Detalhes técnicos

- `src/pages/TwoFactor.tsx`: textos em pt-BR, instruções das duas formas de conclusão, mantém `InputOTP` e `verifyOtp`.
- Reconhecimento do retorno pelo link: ao detectar o evento de autenticação vindo de magic link (hash/`type=magiclink` na URL), marcar a sessão como verificada via `markMfaVerified()` e redirecionar ao painel correto. Implementado no fluxo de auth (`src/hooks/useAuth.tsx` / tela de verificação), limpando o hash da URL depois.
- `src/lib/mfa.ts` sem mudança de regra: obrigatório para admin/locador, opcional para motorista.
- Testes: caso unitário em `src/test/mfa.test.ts` cobrindo a marcação de verificado no retorno por link.
