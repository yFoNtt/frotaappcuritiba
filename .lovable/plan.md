# Teste prático do sistema de notificações

Objetivo: gerar notificações reais na sua conta logada agora para você ver o sino vermelho no sidebar, abrir o popover e tirar print para a apresentação — sem precisar esperar pagamentos vencerem ou CNH expirar de verdade.

## Como vai funcionar

O sistema já tem tudo pronto:
- Tabela `notifications` com RLS por `user_id`
- Realtime ligado no canal `notifications:{user_id}` (chega na hora, sem refresh)
- Componente `NotificationBell` no sidebar com badge de contagem e popover
- Edge function `generate-notifications` que varre pagamentos atrasados, CNH vencendo e manutenções

## Passos

1. **Descobrir seu `user_id`** — pegar o usuário logado no preview (pelo email) via `read_query` na tabela `auth.users`.

2. **Inserir 4 notificações de demonstração** direto na tabela `notifications` usando `supabase--insert`, uma de cada tipo para a apresentação ficar rica:
   - `payment_overdue` — "Pagamento em atraso" (vermelho, ícone cartão)
   - `cnh_expiry` — "CNH vence em 7 dias" (amarelo, ícone documento)
   - `maintenance_due` — "Manutenção próxima" (laranja, ícone chave inglesa)
   - `driver_change` — "Alteração por motorista" (azul, ícone usuário)

   Cada uma com `metadata` apontando para rotas reais (ex: `/locador/pagamentos`), assim você pode demonstrar o clique navegando para a tela correspondente.

3. **Você vê na hora** — como o `useNotifications` está com realtime subscrito, o sino vai:
   - Mostrar badge vermelho com "4"
   - Tocar a animação de entrada
   - Abrir o popover mostrando as 4 notificações com ícones, badges, "há poucos segundos" e botões de marcar como lida / remover

4. **Print da apresentação** — você abre o popover do sino, tira a screenshot, e tem material visual mostrando: badge, lista categorizada, timestamps relativos em pt-BR, e as ações (✓ marcar lida, 🗑 remover, "Ler todas").

5. **(Opcional) Limpeza** — depois do print, posso remover as notificações de teste com um delete por `metadata->>'demo' = 'true'` para não poluir sua conta.

## Detalhes técnicos

- Insert usa `supabase--insert` (não migration, é apenas dado)
- `metadata` recebe `{ "demo": true, ... }` para facilitar cleanup
- Sem alterações de schema, RLS ou código — apenas dados
- Funciona com qualquer papel (locador, motorista, admin) — o sino aparece no sidebar de todos

## O que preciso de você antes

Confirme:
- **Qual conta está logada agora no preview?** (me diga o email — preciso para achar seu `user_id`). Se preferir, posso listar os usuários e você escolhe.
- **Quer as 4 notificações** ou prefere só 1-2 tipos específicos?
- **Limpar depois do print** automaticamente, ou deixar lá?