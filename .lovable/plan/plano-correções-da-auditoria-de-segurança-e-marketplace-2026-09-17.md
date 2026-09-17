# Plano — Correções da auditoria de segurança e marketplace

## Conflitos e constatações confirmadas

- **Item 1 conflita com o cadastro atual se aplicado literalmente:** `signUp()` insere o primeiro perfil diretamente, enquanto `private.is_mfa_session_verified()` retorna `false` quando o perfil ainda não existe. Uma policy RESTRICTIVE de INSERT bloquearia todos os novos cadastros.
- Conforme decidido, o bootstrap será movido para uma **RPC segura**, e só então o gate restritivo de INSERT será ativado.
- O item 4 enumera **9 funções**, não 8. As nove serão tratadas.
- Três funções de teste (`seed-test-motoristas`, `seed-test-locadores`, `cleanup-test-motoristas`) ainda usam CORS local com `*`; elas serão alinhadas ao helper compartilhado para a restrição valer de fato.
- O domínio publicado confirmado é `https://frotaappcuritiba.lovable.app`.

## Execução sequencial

### 1. Proteger INSERT de perfis sem quebrar novos cadastros

- Criar uma migration exclusiva para:
  - adicionar uma RPC `SECURITY DEFINER` de bootstrap que aceite somente os campos já usados no cadastro;
  - exigir usuário autenticado e inserir apenas o perfil cujo `user_id = auth.uid()`;
  - impedir sobrescrita ou criação de perfil para terceiros;
  - restringir `EXECUTE` a `authenticated` e `service_role`;
  - adicionar a policy RESTRICTIVE de INSERT `MFA verified profile inserts` com `WITH CHECK (private.is_mfa_session_verified())`.
- Atualizar `useAuth.tsx` para usar a RPC no primeiro perfil, mantendo a ordem perfil → papel → consentimento → logout.
- Adicionar regressões para: cadastro válido, tentativa de perfil de terceiro, INSERT direto bloqueado e demais leituras/escritas ainda protegidas por MFA.
- Aplicar e validar esta etapa antes de seguir.

### 2. Remover o executor assíncrono de Promise no chat

- Refatorar apenas o helper de upload em `useChat.ts`:
  - obter a URL assinada com `await` antes de criar a Promise do XHR;
  - manter aborto antes/depois da assinatura, progresso, timeout, classificação fatal, retries e formato de retorno atuais;
  - garantir que falhas na criação da URL sejam convertidas no mesmo resultado observável, sem Promise pendente.
- Adicionar teste focado em sucesso, falha de assinatura, erro de rede e cancelamento.

### 3. Restringir CORS às origens autorizadas

- Alterar `_shared/cors.ts` para aceitar somente:
  - `https://frotaappcuritiba.lovable.app`;
  - origens exatas configuradas por `ALLOWED_ORIGIN` ou `ORIGEM_PERMITIDA`, inclusive listas separadas por vírgula;
  - localhost apenas quando `ALLOW_LOCAL_DEV=true`.
- Remover a aceitação genérica de qualquer subdomínio `*.lovable.app` e `*.lovableproject.com`.
- Migrar as três funções de teste que ainda usam `Access-Control-Allow-Origin: *` para o helper compartilhado.
- Testar origem publicada, preview explicitamente autorizado, origem arbitrária bloqueada e localhost fail-closed.

### 4. Validar schemas das nove Edge Functions

- Adicionar Zod com schemas locais e respostas 400 consistentes, sem mudar autenticação, autorização, efeitos ou respostas de sucesso.
- Preservar exatamente os contratos atuais:
  - `record-consent`: `terms_version` e `privacy_version`;
  - `log-inconsistency-review`: `scope`, `unknownCount`, `reviewedIds`, `unknownStatuses`;
  - `locador-assistant`: histórico `messages` com `role` e `content`;
  - seeds, cleanup, exportação, notificações e verificação de CNH: body vazio/opcional, rejeitando campos inesperados quando houver payload.
- JSON malformado ou payload incompatível retornará 400; body ausente continuará válido onde hoje nenhuma entrada é esperada.
- Validar cada função separadamente e publicar somente as nove alteradas.

### 5. Levar filtros e paginação do marketplace ao banco

- Criar uma migration exclusiva com:
  - RPC pública `get_public_vehicles_paginated` com texto, UF, cidade, marca, ano mínimo, preço mínimo/máximo, combustível, app, `limit` e `offset`;
  - filtro obrigatório `status = 'available'`;
  - limites defensivos para paginação e ordenação estável;
  - `total_count` calculado no banco;
  - os mesmos campos públicos atuais, sem `plate` nem `locador_id` no retorno;
  - grants apenas para `anon`, `authenticated` e `service_role` após revogar `PUBLIC`;
  - uma RPC leve de opções de filtro para evitar baixar novamente o catálogo inteiro apenas para preencher seletores.
- Atualizar `useVehicles.tsx` para incluir filtros na `queryKey`, enviar filtros/página à RPC e remover o `slice()` local.
- Atualizar `Vehicles.tsx` para renderizar diretamente os resultados filtrados do banco, manter scroll/botão “Carregar mais”, contagem correta e “Minha Vitrine” pelo fluxo público já existente.
- Ajustar `VehicleFilters` somente no necessário para consumir as opções agregadas sem depender da lista completa.
- Testar filtros isolados e combinados, troca de filtro após carregar páginas, zero resultados, contagem total, paginação sem duplicatas e ausência dos campos sensíveis para anônimos.

## Validação final

- Rodar testes focados por etapa, depois a suíte relevante de auth/MFA, chat, funções e marketplace.
- Conferir lint, tipos, build e logs atuais do preview.
- Consultar o banco para confirmar policies, grants e assinaturas das novas RPCs.
- Verificar o marketplace em desktop e celular e testar anonimamente que `plate` e `locador_id` não aparecem.
- Não alterar cobranças, KM excedente, validações documentais, automações de status, alertas 30/15/7, `/admin/planos` ou qualquer outra policy RLS.
