# Verificação em duas etapas (2FA por e-mail) + validação do "Esqueci minha senha"

## O que será entregue

1. **2FA por código enviado por e-mail** — código numérico de 6 dígitos, válido por 10 minutos, exigido após o login.
2. **Obrigatório para admin e locador**; opcional (ativável nas Configurações) para motorista.
3. **Validação completa do fluxo de recuperação de senha**, com correção do que estiver quebrado.

## Como o 2FA vai funcionar

```text
login (e-mail + senha) -> sessão criada
        |
        v
  precisa 2FA? (admin/locador sempre; motorista se ativado)
        |sim                                  |nao
        v                                     v
 tela "Verificação em duas etapas"        dashboard
  - código de 6 dígitos enviado por e-mail
  - reenviar após 60s
  - 5 tentativas, depois bloqueio de 15 min
        |
        v
  código válido -> sessão marcada como verificada -> dashboard
```

- Enquanto o código não for validado, todas as rotas protegidas redirecionam para a tela de verificação; apenas sair da conta é permitido.
- A verificação vale por dispositivo/sessão; ao sair e entrar de novo, um novo código é pedido.
- Nas Configurações (motorista) haverá um botão "Ativar verificação em duas etapas". Para admin e locador o cartão aparece como sempre ativo, sem opção de desligar.

## Recuperação de senha — o que será validado

Fluxo atual: `/esqueci-senha` envia o link e `/redefinir-senha` define a nova senha. Vou testar de ponta a ponta na pré-visualização:

- envio do e-mail de recuperação sem erro e com mensagem de confirmação correta;
- o link do e-mail abre `/redefinir-senha` com sessão de recuperação válida (hoje a página só checa se existe sessão — se o link vier com `type=recovery` no hash e a sessão ainda não estiver hidratada, ela pode mostrar "link inválido" indevidamente);
- regras de senha iguais às do cadastro (8+, maiúscula, minúscula, número e especial — hoje falta a checagem de minúscula);
- login com a nova senha funcionando.

Correções serão aplicadas apenas onde o teste apontar falha, mais os dois pontos já identificados acima (hidratação da sessão de recuperação e regra de letra minúscula).

## Detalhes técnicos

**Banco**
- Nova tabela `mfa_email_codes` (`user_id`, hash do código, `expires_at`, `attempts`, `consumed_at`, `created_at`) com RLS restrita (sem acesso direto do cliente; leitura/escrita apenas via funções do servidor) e GRANTs para `service_role`.
- Nova coluna `mfa_enabled` em `profiles` (default `false`); admin e locador são tratados como obrigatórios pela lógica de role, independentemente da coluna.
- Função de expurgo dos códigos expirados junto ao job de limpeza já existente.

**Edge Functions** (usando o módulo CORS compartilhado, JWT validado em código)
- `send-2fa-code`: gera o código, grava o hash, aplica limite de reenvio e dispara o e-mail.
- `verify-2fa-code`: valida código/expiração/tentativas, marca a sessão como verificada.

**Envio do e-mail**
- Usará a infraestrutura de e-mail do Lovable Cloud. Se ainda não houver domínio de e-mail configurado, abrirei o diálogo de configuração — o código do 2FA depende disso para chegar na caixa de entrada.

**Frontend**
- Nova página pública `/verificacao` (React.lazy + LazyFallback + RouteErrorBoundary) com input de 6 dígitos (`InputOTP` do shadcn), contador de reenvio e mensagens via sonner.
- `useAuth` ganha estado `mfaRequired`/`mfaVerified`; `ProtectedRoute` redireciona para `/verificacao` enquanto pendente.
- Cartão "Verificação em duas etapas" nas páginas de Configurações (locador, motorista, admin).
- Tokens semânticos de cor, React Hook Form + Zod, TanStack Query — sem exceções.

**Testes**
- Testes unitários da lógica de expiração/tentativas/obrigatoriedade por role.
- Spec Playwright cobrindo: login de locador exige código, código errado é rejeitado, rota protegida bloqueada antes da verificação.
