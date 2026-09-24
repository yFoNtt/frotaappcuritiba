# Plano — Autenticação, MFA e ampliação segura do painel administrativo

## Constatações confirmadas

- O login busca o papel diretamente em `user_roles`, mas uma regra restritiva exige MFA para essa leitura. Erro e ausência de papel viram o mesmo `null`, levando usuários existentes à seleção de perfil.
- A página de login não prioriza a verificação MFA antes da seleção de papel, e o evento de sessão não reativa o estado de carregamento antes de resolver papel e MFA.
- Não existe `get_my_role()` nem criação automática atual de perfil/papel. Há **3 contas sem perfil e 1 sem papel** no banco ativo.
- `assign_initial_role` ainda falha quando o mesmo papel já existe; a seleção após Google consulta e grava tabelas diretamente.
- A conclusão de MFA valida apenas sessão diferente e horário; não comprova que a nova sessão veio de link/OTP. A tela também não envia o e-mail automaticamente.
- A gestão atual de usuários permite papel e bloqueio, mas ainda não oferece criação, redefinição, e-mail, exclusão ou senha temporária.
- As telas administrativas de veículos e detalhes do locador são somente leitura; os hooks operacionais fixam o proprietário como o usuário logado.
- Os três pares de triggers duplicados descritos no documento estão ativos.
- `must_change_password`, `admin_delete_user`, `is_locador` e a função `admin-users` ainda não existem.
- O projeto compila atualmente sem erros.

## Ajustes necessários ao documento

- **MFA obrigatório para administradores:** aprovado. Só será ativado após o fluxo MFA passar nos testes de ponta a ponta, evitando bloquear administradores.
- **Criação de perfil/papel:** não será criado trigger em `auth.users`, pois esse schema é gerenciado e não pode receber triggers personalizados neste projeto. Será usado um bootstrap `SECURITY DEFINER` idempotente, executado quando a sessão autenticada existir.
- No cadastro com confirmação de e-mail, o papel será salvo em metadados permitidos; no primeiro login confirmado, o bootstrap criará perfil e papel. Documento/CNH serão solicitados numa etapa de complemento caso não tenham sido persistidos com sessão ativa. Não serão colocados dados sensíveis no token.
- A exclusão administrativa será dividida com segurança: uma RPC pública autenticada fará anonimização/limpeza dos dados e a função administrativa excluirá a conta pelo serviço de autenticação. Senhas nunca serão registradas.

## Execução sequencial

### 1. Corrigir login e cadastro

1. Criar migration isolada com:
   - `get_my_role()` seguro, acessível somente a usuários autenticados e independente do gate MFA;
   - RPC idempotente de bootstrap da própria conta, criando perfil mínimo e aceitando somente `locador` ou `motorista` vindos de metadados confiáveis ou escolha explícita do próprio usuário;
   - `assign_initial_role` idempotente para o mesmo papel e ainda bloqueando troca ou autoatribuição de administrador;
   - recuperação das três contas sem perfil, preservando dados existentes, e tratamento controlado da conta sem papel.
2. Atualizar `useAuth` para distinguir papel ausente de erro, rearmar o carregamento em toda sessão válida, resolver papel pela RPC e executar o bootstrap quando necessário.
3. Alterar o cadastro para enviar `role` nos metadados, tratar `identities` vazio, diferenciar sessão imediata de confirmação pendente e remover gravações client-side frágeis.
4. Ordenar a página de autenticação: carregamento → MFA → painel por papel → erro com nova tentativa → seleção somente quando o papel realmente não existir.
5. Simplificar a seleção de papel do Google para usar apenas RPCs seguras e tornar o retorno OAuth `/login`.
6. Criar o complemento obrigatório de perfil para contas confirmadas ainda sem documento/CNH, antes do painel e sem contornar o consentimento LGPD.
7. Verificar no ambiente ativo se a confirmação de e-mail está habilitada e registrar o resultado no resumo.
8. Testar cadastro/login de locador e motorista, conta já existente, MFA ativo, falha real de papel e primeiro acesso pelo Google. Só avançar com tudo aprovado.

### 2. Corrigir e endurecer a verificação em duas etapas

1. Fixar a versão do cliente usada por `mfa-session` e validar o payload de todas as ações.
2. Na ação `complete`, exigir no JWT evidência `amr` de OTP/link mágico emitida após o desafio; senha e OAuth devem retornar 403.
3. Alinhar `status` ao banco: perfil ausente retorna desativado e não verificado, com diagnóstico interno sem dados sensíveis.
4. Fazer `markMfaVerified` obter a sessão atual diretamente, sem depender do estado React capturado, e atualizar papel/MFA após a conclusão.
5. Enviar automaticamente o e-mail uma única vez ao abrir `/verificacao`, orientar uso no mesmo navegador, tratar limite 429 em português e redirecionar ao painel correto após sucesso.
6. Testar login com MFA, envio automático, retorno por link, sessão por senha recusada e sessão OTP aceita. Só avançar após testes unitários, da função e E2E.

### 3. Gestão administrativa de contas

1. Migration exclusiva:
   - adicionar `profiles.must_change_password` com padrão falso;
   - criar RPCs administrativas para anonimização pré-exclusão e mudanças de papel com proteção contra autoalteração e remoção do último administrador;
   - manter papéis exclusivamente em `user_roles`.
2. Criar `admin-users` com autenticação obrigatória, papel admin validado no servidor e MFA verificado quando ativo. Implementar criar usuário, convite, reset, senha temporária forte, alteração/confirmação de e-mail, papel, bloqueio e exclusão.
3. Exigir motivo em todas as ações e gravar auditoria sem senha ou token. Usuários criados pelo admin continuarão obrigados a aceitar os termos no primeiro acesso.
4. Adicionar o bloqueio `must_change_password` às rotas protegidas e limpar a flag somente depois da troca bem-sucedida.
5. Ampliar `/admin/usuarios` com “Novo usuário”, menu de ações e confirmações com motivo, usando formulários validados e diálogos existentes.
6. Testar 403 para não-admin, senha temporária, último admin, autoexclusão, auditoria e consentimento inicial.

### 4. Edição administrativa de dados operacionais

1. Migration exclusiva com `is_locador()` e permissões administrativas nas dez tabelas solicitadas, mantendo todas as regras restritivas de MFA e isolamento existentes.
2. Adicionar permissões administrativas nos três buckets privados/públicos indicados, sem ampliar acesso de locadores ou motoristas.
3. Parametrizar os hooks operacionais com `locadorId`, preservando o comportamento atual quando usados pelo próprio locador.
4. Reaproveitar os formulários atuais com seleção obrigatória do locador e aviso permanente de contexto.
5. Criar `/admin/motoristas`, `/admin/contratos` e `/admin/pagamentos`; habilitar operações em veículos e detalhes do locador; atualizar menu e pré-carregamento de rotas.
6. Usar confirmação explícita nas exclusões e nunca implementar impersonação.
7. Rodar primeiro toda a regressão do locador e motorista; depois testar edição do locador A pelo admin, isolamento do locador B e autoria correta na auditoria.

### 5. Endurecimento final

1. Após a etapa 2 aprovada, tornar MFA obrigatório para `admin` e incluir aviso em Configurações.
2. Exigir sessão MFA verificada nas ações administrativas de `admin-users` e `mfa-session` quando aplicável.
3. Remover somente os triggers duplicados indicados, preservando um trigger funcional em cada tabela.
4. Rodar regressões de autenticação, MFA, autorização administrativa, notificações, quilometragem e atualização de perfis.

### 6. Registrar trabalho futuro

Adicionar ao roadmap, sem implementar:
- migração do MFA por e-mail para TOTP nativo com nível `aal2`;
- separação das funções de seed/limpeza do ambiente publicado.

## Validação final

- Cada prioridade terá migration/alteração e testes próprios; a próxima não começa enquanto a anterior estiver quebrada.
- Rodar testes focados, suíte completa relevante, lint, checagem de cores, tipos e build.
- Validar login/cadastro e MFA no navegador, incluindo Google e confirmação por e-mail.
- Validar funções administrativas com usuário admin e tentativas por locador/motorista.
- Conferir policies, grants, funções e triggers no banco ativo após cada migration.
- Não alterar cálculos financeiros, KM excedente, validações CPF/CNPJ/CNH, automações de veículo, alertas 30/15/7, billing ou isolamento existente.
