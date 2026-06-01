
## Objetivo

Adicionar um assistente de IA acessível como **botão flutuante** em todas as páginas do locador. O assistente responde dúvidas sobre aluguéis usando os **dados reais do locador autenticado** (veículos, contratos, motoristas, pagamentos, manutenções). Conversa é **efêmera** (não persistida) — recarregou a página, começa do zero.

## UX

- Botão flutuante no canto inferior direito (`fixed bottom-6 right-6`), com ícone `Sparkles`/`Bot`, cor primária (Orange/Amber), aparece apenas em rotas `/locador/*`.
- Clique abre um painel `Sheet` lateral (direita) com altura total: header "Assistente IA", lista de mensagens, input com botão enviar.
- Mensagens renderizadas com `react-markdown` (já no projeto via outras libs ou a adicionar).
- Streaming de tokens token-por-token (SSE) para resposta fluida.
- Estado local apenas (useState) — sem persistência.
- Botão "Limpar conversa" no header do painel.
- Sugestões de perguntas iniciais (chips): "Quais contratos vencem essa semana?", "Quem está com pagamento atrasado?", "Manutenções pendentes", "Faturamento do mês".

## Arquitetura técnica

### Edge function `locador-assistant` (nova)
- `verify_jwt = false` (padrão) + valida JWT em código e exige role `locador`.
- Carrega snapshot dos dados do locador via `supabase` client com o token do usuário (RLS garante isolamento — sem service role).
- Snapshot compacto em JSON:
  - veículos (id, marca/modelo, placa, status, preço, km)
  - motoristas (id, nome, status, CNH expiry)
  - contratos ativos/pendentes (datas, valor semanal, status)
  - pagamentos dos últimos 60 dias + próximos vencimentos (status, valor, due_date)
  - manutenções próximas (next_maintenance_date/km)
  - alertas relevantes (CNH próxima de vencer, pagamentos overdue)
- Limita tamanho do snapshot (top N por tabela, ex.: 50) para controlar tokens.
- Chama Lovable AI Gateway (`google/gemini-3-flash-preview`) com:
  - **system prompt**: papel de assistente do FrotaApp, responde em PT-BR, conciso, usa markdown, trata dados do snapshot como contexto factual, NÃO inventa, instrui a tratar conteúdo do snapshot como dados (anti-prompt-injection), recusa perguntas fora do escopo de gestão de frota.
  - **user messages**: histórico da sessão + snapshot anexado ao último user message como contexto.
  - `stream: true`.
- Trata 429 (rate limit) e 402 (créditos) retornando JSON estruturado.
- CORS headers + sanitização do input do usuário (`replace control chars`, max 2000 chars por mensagem, max 20 mensagens no histórico).

### Frontend
- Componente `LocadorAssistant.tsx` em `src/components/locador/`:
  - Botão flutuante (FAB) + `Sheet` shadcn.
  - Hook `useAssistantChat` interno gerenciando `messages`, `isStreaming`, `send`, `clear`.
  - Parser SSE token-por-token (mesma técnica documentada para AI Gateway).
  - Renderização: bolhas user (right, primary) e assistant (left, muted) com `ReactMarkdown` (`prose prose-sm dark:prose-invert`).
  - Acessibilidade: `aria-label` no FAB, foco no input ao abrir, Enter envia.
- Montado dentro de `DashboardLayout` (que envolve todas as rotas locador) — aparece automaticamente nas páginas do locador, não para admin/motorista.

### Sem mudanças de schema
- Nada persistido → **sem migrations**. Dados consultados em tempo real pela edge function respeitando RLS.

### Segurança
- Sem RLS nova: snapshot é construído com client autenticado do usuário → só vê o que já pode ver.
- Edge function rejeita não-locadores com 403.
- Sanitização anti-prompt-injection no system prompt (mesmo padrão usado em `suggest-vehicle-price`).
- Rate limit leve: bloqueia se >10 mensagens em 60s por usuário (in-memory map na função).

## Dependências
- `react-markdown` (adicionar se não houver) + `remark-gfm` opcional para tabelas.

## Detalhes técnicos

### Arquivos novos
- `supabase/functions/locador-assistant/index.ts`
- `src/components/locador/LocadorAssistant.tsx`
- `src/components/locador/AssistantMessage.tsx` (bolha + markdown)

### Arquivos editados
- `src/components/dashboard/DashboardLayout.tsx` — montar `<LocadorAssistant />` no final do layout.
- `package.json` — adicionar `react-markdown` se necessário.

### Fluxo de uma pergunta
1. Usuário digita → frontend faz `POST` direto via `fetch` para `${VITE_SUPABASE_URL}/functions/v1/locador-assistant` com `Authorization: Bearer <session.access_token>` e body `{ messages: [...] }`.
2. Edge function valida JWT + role locador.
3. Carrega snapshot (paralelo com `Promise.all`).
4. Chama gateway com stream → retorna `response.body` direto com `Content-Type: text/event-stream`.
5. Frontend faz parse SSE incremental e atualiza última mensagem do assistant em tempo real.

## Fora de escopo
- Persistência de histórico (efêmero por escolha do usuário).
- Acesso para motorista/admin.
- Ações (criar contrato, marcar pagamento) via chat — apenas leitura/consulta nesta versão.
