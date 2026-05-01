# Roadmap FrotaApp Curitiba — 3 Fases

## Visão geral

```text
FASE 1 (curto prazo - agora)         FASE 2 (médio prazo)              FASE 3 (longo prazo)
─────────────────────────────        ────────────────────────         ───────────────────────
Comunicação completa                 Monetização + Marketplace 2.0     Operação avançada
+ IA básica + PWA                    + Contratos digitais              + App nativo
```

---

## FASE 1 — Comunicação, IA e PWA (foco desta implementação)

### 1.1 E-mails transacionais (Lovable Emails)
- Configurar domínio de envio próprio (`notify.frotaappcuritiba.com.br`)
- Templates React Email com identidade visual (Orange/Amber, Roboto):
  - Boas-vindas (locador e motorista)
  - Vencimento de CNH (30/15/7 dias) — substitui notificação interna por e-mail
  - Cobrança semanal com link do recibo
  - Solicitação de documento pendente
  - Vistoria realizada (resumo + link)
  - Manutenção próxima do vencimento
- Customizar templates de auth (signup, recuperação de senha, magic link)
- Enfileiramento via pgmq (já incluso na infra), com retry e suppression

### 1.2 WhatsApp via Twilio (connector)
- Conectar o Twilio (connector oficial) para envio de mensagens
- Edge function `send-whatsapp-notification` reutilizável
- Templates aprovados:
  - Cobrança semanal (com Pix copia-e-cola futuramente)
  - Vencimento CNH urgente (≤ 7 dias)
  - Solicitação de documento
- Toggle nas preferências do locador/motorista para escolher canais (e-mail / WhatsApp / ambos)
- Botão "Enviar lembrete por WhatsApp" em pagamentos pendentes e CNH vencendo

### 1.3 Chat interno motorista ↔ locador
- Tabela `conversations` (locador_id, driver_id, last_message_at)
- Tabela `messages` (conversation_id, sender_id, content, read_at, attachments)
- RLS estrita: só os 2 participantes leem/escrevem
- Realtime via Supabase Realtime (igual notificações)
- UI:
  - Página `/locador/mensagens` e `/motorista/mensagens` com lista de conversas
  - Tela de conversa com bolhas, indicador de "lida", upload de imagem (bucket privado)
  - Badge de não-lidas no sidebar
- Notificação push (via sino + e-mail opcional se offline > 5 min)

### 1.4 IA — Sugestão de preço e análise de fotos (Lovable AI)
- **Sugestão de preço** ao cadastrar veículo:
  - Edge function `suggest-vehicle-price` usa `google/gemini-3-flash-preview`
  - Input: marca, modelo, ano, cidade, km, apps permitidos
  - Compara com média do marketplace (query agregada) + heurística de IA
  - UI: badge "💡 Sugerido: R$ X/semana" no formulário de veículo
- **Análise de fotos de vistoria**:
  - Edge function `analyze-inspection-photos` (modelo multimodal `google/gemini-2.5-pro`)
  - Recebe URLs assinadas das fotos da vistoria
  - Retorna JSON estruturado (tool calling): lista de avarias detectadas, severidade, parte do veículo
  - UI: na tela de vistoria, botão "Analisar com IA" — mostra resultado lado a lado com checklist manual
  - Resultado salvo em `vehicle_inspections.ai_analysis` (jsonb)

### 1.5 PWA instalável
- Manifest-only (sem service worker complexo) para evitar conflitos no preview Lovable
- `public/manifest.json` com ícones (192/512), `display: standalone`, cor primária
- Ícones gerados a partir do logo atual
- Meta tags mobile no `index.html`
- Página `/instalar` com instruções por sistema operacional (iOS/Android)

### Resumo técnico Fase 1

| Item | Tecnologia | Esforço |
|---|---|---|
| E-mail transacional | Lovable Emails + React Email | M |
| WhatsApp | Twilio connector + edge function | M |
| Chat interno | Postgres + Realtime + bucket | G |
| IA preço | Lovable AI Gateway (Gemini Flash) | P |
| IA vistoria | Lovable AI Gateway (Gemini Pro multimodal) | M |
| PWA | manifest.json + ícones | P |

Tabelas novas: `conversations`, `messages`, `notification_preferences`.
Coluna nova: `vehicle_inspections.ai_analysis jsonb`.
Buckets novos: `chat-attachments` (privado).
Edge functions novas: `send-transactional-email` (auto), `send-whatsapp-notification`, `suggest-vehicle-price`, `analyze-inspection-photos`.
Secrets necessários: nenhum manual (Twilio via connector, Lovable AI/Email automáticos).

---

## FASE 2 — Monetização + Marketplace 2.0 + Contratos digitais

- **Planos de assinatura locador** (Free 2 veículos / Pro 10 / Enterprise ∞) via Stripe ou Paddle
- **Página pública de pricing** com CTA
- **Pagamentos online motorista→locador** (Pix via Mercado Pago/Stripe BR), recibo PDF
- **Marketplace 2.0:**
  - Sistema de reservas/leads (motorista solicita interesse → locador aprova)
  - Avaliações com estrelas + comentários (motorista avalia locador, locador avalia motorista)
  - SEO por cidade (`/veiculos/curitiba`, `/veiculos/sao-jose-dos-pinhais`)
  - Favoritos
- **Contratos digitais:**
  - Geração de PDF do contrato com dados preenchidos (jspdf ou edge function)
  - Assinatura digital (D4Sign ou ClickSign — connector ou API direta)
  - Versionamento de aditivos

---

## FASE 3 — Operação avançada + App nativo

- **Multas** (cadastro, repasse ao motorista, comprovante)
- **Sinistros** (workflow com seguradora, fotos, status)
- **Combustível e abastecimento** (KPI custo por km)
- **Telemetria/GPS** (integração com rastreadores via API)
- **Calendário visual** de manutenções e vencimentos
- **BI avançado** — ROI por veículo, ociosidade, ticket médio, comparativos
- **Conformidade LGPD** — exportação/exclusão de dados pessoais, 2FA opcional
- **App nativo** via Capacitor (iOS + Android nas lojas)
- **Modo offline** para motoristas (registrar km/foto sem internet, sync depois)

---

## Próximo passo

Ao aprovar este roadmap, começo pela **Fase 1** na seguinte ordem (cada bloco entregável independentemente):

1. **PWA + ícones** (rápido, ganho imediato de UX)
2. **E-mails transacionais** (configurar domínio + templates principais)
3. **IA — sugestão de preço** (entrega rápida, alto valor percebido)
4. **WhatsApp via Twilio** (conectar e enviar lembretes)
5. **Chat interno** (tabelas, RLS, realtime, UI)
6. **IA — análise de fotos de vistoria** (multimodal)

Posso ajustar a ordem se preferir começar por outro bloco. Confirma para eu seguir?
