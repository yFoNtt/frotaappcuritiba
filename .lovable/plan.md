# Plano — Continuação da autenticação e ampliação do painel administrativo

## Estado confirmado

- As migrations `20260924114907` e `20260924114926` já fornecem fachadas públicas para `get_my_role()` e `initialize_own_account()`, com a lógica privilegiada no schema interno; elas serão preservadas.
- `markMfaVerified` ainda chama `fetchUserRole(user.id)`, embora a função não aceite argumentos, quebrando a checagem de tipos.
- O listener de autenticação ainda resolve conta, papel e MFA em todo evento de sessão, inclusive renovações do mesmo usuário, ativando o carregamento global.
- A função interna de inicialização ainda atualiza `profiles` em todo login por meio de `ON CONFLICT DO UPDATE`.
- `mfa-session` ainda não valida o método `amr` usado pela nova sessão; `TwoFactor` declara `autoSentRef`, mas não dispara o envio automático.
- `profiles.must_change_password` e a função administrativa `admin-users` ainda não existem; a gestão atual oferece somente papel e bloqueio.
- Os três pares de triggers duplicados indicados na solicitação permanecem ativos.

## Execução obrigatoriamente sequencial

### Etapa 0 — Restaurar a compilação

1. Corrigir `markMfaVerified` para chamar `fetchUserRole()` sem argumento.
2. Validar tipos e compilação; corrigir apenas erros diretamente ligados às alterações de autenticação já iniciadas.
3. Não avançar enquanto esta etapa estiver quebrada.

### Etapa 1 — Concluir login e cadastro

1. Estabilizar o listener de autenticação com uma referência ao usuário já resolvido:
   - resolver conta somente na sessão inicial ou quando o ID do usuário mudar;
   - em renovação de token e novo evento do mesmo usuário, atualizar sessão/usuário sem desmontar a tela;
   - em atualização do usuário, atualizar os dados sem exibir o carregamento global.
2. Criar migration isolada para tornar `private.initialize_own_account_internal` realmente idempotente:
   - criar o perfil quando ausente;
   - preencher `full_name` somente se o perfil ainda não tiver nome e houver nome novo;
   - não atualizar perfis já completos nem disparar validações desnecessárias.
3. Em `resolveUser`, consultar primeiro `get_my_role`; chamar `initialize_own_account` somente quando o papel estiver ausente e tratar explicitamente qualquer erro retornado.
4. Criar um passo protegido de complemento de perfil no primeiro acesso:
   - locador sem documento informa tipo e número;
   - motorista sem CNH informa número e validade;
   - reutilizar React Hook Form, Zod e os validadores atuais;
   - posicionar após MFA e antes do painel, sem contornar o aceite LGPD; administradores ficam isentos.
5. Preservar seleção única de papel no primeiro acesso Google e o redirecionamento por papel já ajustado.
6. Consultar a configuração real de autenticação para informar no resumo se a confirmação de e-mail está ativa.
7. Validar cadastro e login de locador/motorista, conta existente, primeiro acesso Google, conta com MFA e renovação de token sem perda de formulário. Não avançar se houver regressão.

### Etapa 2 — Corrigir e endurecer a verificação em duas etapas

1. Validar todas as ações de `mfa-session` com schema estrito e manter a dependência do cliente fixada em versão explícita.
2. Na conclusão do desafio, exigir `amr` de `otp` ou `magiclink` emitido após `requested_at`; rejeitar senha e OAuth com 403.
3. Alinhar `status` ao gate do banco; perfil ausente retorna `enabled: false` e `verified: false`, sem expor dados sensíveis nos logs.
4. Fazer `markMfaVerified` obter a sessão atual diretamente, sem depender de estado React capturado, e então atualizar papel e estado MFA.
5. Usar `autoSentRef` para enviar o e-mail uma única vez, orientar o uso no mesmo navegador, traduzir limite de envio e redirecionar diretamente ao painel correto.
6. Publicar e testar a função: fluxo completo por link/OTP aceito e sessão de senha recusada. Não avançar sem aprovação dos testes de ponta a ponta.

### Etapa 3 — Gestão de contas pelo administrador

1. Migration exclusiva:
   - adicionar `profiles.must_change_password boolean NOT NULL DEFAULT false`;
   - criar exclusão administrativa com anonimização equivalente à exclusão própria;
   - impedir autoexclusão, exclusão de outro administrador, autoalteração de papel e remoção do último administrador.
2. Criar `admin-users` com autenticação obrigatória e validação server-side de papel e MFA quando ativo.
3. Implementar ações validadas para convite/criação, reset por e-mail, senha temporária forte, alteração/confirmação de e-mail, papel e exclusão.
4. Exigir motivo e registrar auditoria em todas as ações, sem registrar senha ou token.
5. Adicionar o gate de troca obrigatória de senha e limpar a flag somente após atualização bem-sucedida.
6. Ampliar `/admin/usuarios` com “Novo usuário”, menu de ações e diálogos com motivo; eliminar o uso de `window.prompt`.
7. Validar 403 para não-admin, consentimento inicial, senha temporária, último admin, autoexclusão e auditoria.

### Etapa 4 — Edição administrativa de dados operacionais

1. Migration exclusiva com `is_locador()` e regras administrativas nas dez tabelas solicitadas, mantendo intactas as regras restritivas de MFA e o isolamento existente.
2. Adicionar regras administrativas nos buckets `vehicle-images`, `documents` e `inspection-photos`, sem ampliar acesso de locadores ou motoristas.
3. Parametrizar os hooks operacionais com `locadorId`, mantendo o usuário atual como padrão para as telas do locador.
4. Reutilizar os formulários existentes com “Locador responsável” obrigatório, aviso persistente de contexto e confirmação explícita nas exclusões.
5. Criar `/admin/motoristas`, `/admin/contratos` e `/admin/pagamentos`; habilitar operações administrativas em veículos e detalhes do locador; atualizar rotas e menu.
6. Não implementar impersonação.
7. Rodar primeiro a regressão integral de locador/motorista; depois validar edição do locador A, isolamento do locador B e autoria do admin na auditoria.

### Etapa 5 — Endurecimento final

1. Tornar MFA obrigatório para administradores somente se toda a Etapa 2 passar; caso contrário, manter opcional e registrar o bloqueio no roadmap.
2. Exigir sessão MFA verificada nas ações administrativas quando o MFA estiver ativo.
3. Remover somente os triggers duplicados listados, preservando um trigger funcional por comportamento.
4. Rodar regressões de autenticação, MFA, permissões administrativas, notificações, quilometragem e atualização de perfis.

### Etapa 6 — Registrar trabalho futuro

Atualizar o roadmap, sem implementar:
- migração do MFA por e-mail para TOTP nativo com nível `aal2`;
- separação das funções de seed e limpeza do ambiente publicado.

## Validação e limites

- Cada etapa terá alteração/migration própria e testes relacionados; a seguinte só começa com a anterior estável.
- Usar os checks automáticos de tipos e build do projeto, testes focados, lint e verificação de cores semânticas.
- Validar fluxos autenticados no navegador quando a etapa depender do comportamento real da sessão.
- Não alterar cálculos financeiros, KM excedente, validações CPF/CNPJ/CNH, alertas, billing, isolamento entre locadores/motoristas ou a abordagem de bootstrap via RPC.
- Ao final, entregar uma tabela por etapa com status `concluído`, `parcial` ou `não feito` e o motivo objetivo.
