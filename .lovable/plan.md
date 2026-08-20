# Verificação em duas etapas: robustez do link, cópia sem promessa de código e teste E2E

## 1. Deixar o fluxo por link à prova de falhas

Hoje a tela `/verificacao` detecta o retorno pelo e-mail (`#access_token=...&type=magiclink` e `?code=...`) e marca a sessão como verificada. O que falta é o tratamento do caso em que o token do link já foi consumido ou expirou — situação real quando o Gmail/Outlook corporativo pré-carrega links de segurança. Nesse caso, hoje, a tela pode ficar presa no carregamento até o redirecionamento tardio para `/login`.

Mudanças na tela:

- Detectar erro vindo do link: o provedor devolve `error`, `error_code` (`otp_expired`, `access_denied`) no hash ou na query. Quando presente, sair do estado de carregamento imediatamente e mostrar um aviso claro: "Este link expirou ou já foi usado. Toque em Reenviar e-mail para receber um novo."
- Detectar o caso silencioso: retorno pelo link, mas sem sessão hidratada após um tempo curto (~4s). Em vez de mandar para `/login`, mostrar o mesmo aviso com o botão de reenvio já habilitado.
- No retorno com erro, não disparar o envio automático de novo e-mail (evita gastar o limite de reenvio); o usuário decide.
- Limpar o hash/query da URL nos dois casos, para que um refresh não repita o erro.

## 2. Cópia sem prometer o código de 6 dígitos

Enquanto não houver domínio de e-mail próprio, o e-mail entregue contém apenas o botão de acesso. Então:

- Remover da tela o campo de 6 dígitos e o botão "Confirmar código".
- Texto passa a ser único e direto: "Enviamos um e-mail para <seu e-mail>. Abra a mensagem e toque no botão de acesso para concluir a entrada. Se não encontrar, confira o spam."
- Manter reenviar com contador de 60s e "Sair da conta".
- O campo de código volta com uma única troca de flag quando o domínio estiver ativo — a lógica de verificação por código fica no arquivo, apenas oculta por uma constante (`MFA_CODE_INPUT_ENABLED = false` em `src/lib/mfa.ts`).

## 3. Domínio de e-mail próprio — o que se aplica neste projeto

Uma correção importante ao seu enunciado: este projeto roda no Lovable Cloud, então **não há painel do Supabase nem configuração manual de SMTP**. O envio de e-mails com remetente próprio é feito pela infraestrutura de e-mail do próprio Lovable: você registra o domínio nas configurações de e-mail do projeto, e os modelos de autenticação passam a ser arquivos do projeto (React Email), que eu edito em português — nada de Resend/SendGrid/Postmark por fora, e nenhuma chave de API para você gerenciar.

Restrição atual: **a configuração de domínio de e-mail exige permissão de admin/owner do workspace**, que a sessão atual não tem. Peça a um admin/owner do workspace para configurar o domínio de e-mail do projeto. Registros DNS que o provedor de domínio vai pedir (os valores exatos aparecem no assistente de configuração):

- Registro de verificação de domínio (TXT).
- DKIM (CNAME ou TXT, conforme instruído no assistente) — assina as mensagens.
- SPF (TXT em `@`) — autoriza o remetente.
- DMARC (TXT em `_dmarc`) — política, ex.: `v=DMARC1; p=none; rua=mailto:seu@dominio`.

Propagação leva de minutos a algumas horas; enquanto não verifica, os e-mails continuam saindo pelo remetente padrão.

## 4. Modelos em PT-BR (depois do domínio verificado)

Assim que o domínio estiver verificado, eu:

- Gero os modelos de e-mail de autenticação do projeto e os reescrevo em português, com a identidade visual do FrotaApp (laranja/âmbar, Roboto).
- No modelo de acesso: assunto "Seu código de acesso ao FrotaApp", corpo com o **código de 6 dígitos em destaque** e o **botão de acesso**, na mesma linguagem da tela `/verificacao`.
- Ligo de volta o campo de 6 dígitos na tela (flag do item 2).

Esta etapa fica pendente da configuração do item 3 — não é possível antecipá-la.

## 5. Teste E2E do retorno pelo link

Novo arquivo `e2e/mfa-magic-link.spec.ts`:

- Login como locador, interceptando a navegação até `/verificacao`.
- Simular o retorno do e-mail navegando para `/verificacao#access_token=...&refresh_token=...&type=magiclink` com uma sessão válida obtida via API de teste, e verificar que a tela marca como verificado e redireciona para `/locador`.
- Repetir para motorista (com MFA ativado) e admin, conferindo o destino de cada perfil.
- Caso de erro: navegar para `/verificacao#error=access_denied&error_code=otp_expired` e verificar que aparece a mensagem de link expirado com o botão de reenvio, sem tela travada.

## Detalhes técnicos

- `src/lib/mfa.ts`: `parseMagicLinkError(hash, search)` retornando o motivo do erro; constante `MFA_CODE_INPUT_ENABLED`.
- `src/pages/TwoFactor.tsx`: estado `linkError`, timeout de hidratação, ocultação do `InputOTP`, textos pt-BR. Sem mudança em RLS, roles ou outras telas.
- `src/test/mfa.test.ts`: casos unitários para `parseMagicLinkError`.
- `e2e/mfa-magic-link.spec.ts` usando os helpers existentes de `e2e/helpers`.
