# Boas-vindas persistente + logout por inatividade

## Objetivo
1. Motorista e locador veem, no primeiro acesso, um passo a passo de como o sistema funciona e uma lista de tarefas iniciais que vai sendo marcada como concluída — e some de vez quando terminar.
2. Usuários são desconectados após 60 minutos de inatividade, com aviso 1 minuto antes.

## Situação atual
- Já existem o tour (`OnboardingTour`) e as listas de tarefas (checklists de locador e motorista) nos dois dashboards, mas o "já vi" / "dispensei" fica salvo só no navegador — reaparece em outro dispositivo ou ao limpar o cache.
- O logout por inatividade já existe com 30 minutos e sem aviso prévio.

## O que muda

### 1. Memória do onboarding na conta
- Novos campos no perfil do usuário: `onboarding_tour_seen_at` e `onboarding_dismissed_at`.
- O tour abre apenas se o perfil ainda não tem `onboarding_tour_seen_at`; ao concluir/fechar, grava a data na conta.
- A lista de tarefas some quando todas as tarefas estiverem concluídas ou quando o usuário dispensar — em ambos os casos grava na conta, então não volta em outro dispositivo.
- Enquanto o perfil carrega, nada pisca na tela (sem abrir o tour antes de saber o estado).

### 2. Lista de tarefas mais clara
- Cada item mantém ícone de concluído/pendente, link direto para a tela correspondente e barra de progresso "X de Y".
- Ao concluir a última tarefa: mensagem curta de parabéns e o bloco desaparece definitivamente (gravado na conta).
- Botão "Rever o passo a passo" no bloco, para reabrir o tour manualmente.

### 3. Logout por inatividade
- Tempo alterado de 30 para 60 minutos.
- Aos 59 minutos, abre um aviso com contagem regressiva de 60 segundos e os botões "Continuar conectado" e "Sair agora".
- Qualquer interação reinicia a contagem; ao expirar, desconecta e mostra a mensagem de sessão expirada.
- Também cobre o caso de a aba ficar em segundo plano por mais tempo que o limite.

## Detalhes técnicos
- Migration: `ALTER TABLE public.profiles ADD COLUMN onboarding_tour_seen_at timestamptz, ADD COLUMN onboarding_dismissed_at timestamptz;` (RLS/grants já existentes na tabela cobrem a leitura/escrita pelo próprio usuário).
- `src/hooks/useProfile.tsx`: expor os novos campos e uma mutation `updateOnboardingState`.
- `src/components/onboarding/OnboardingTour.tsx`: trocar `storageKey`/localStorage por props `open`/`onFinish` controladas pelo perfil.
- `src/components/locador/OnboardingChecklist.tsx` e `src/components/motorista/OnboardingChecklist.tsx`: usar o estado do perfil em vez de `localStorage`, adicionar estado de conclusão e botão de rever o tour.
- `src/pages/locador/Dashboard.tsx` e `src/pages/motorista/Dashboard.tsx`: passar o controle do tour vindo do perfil.
- `src/hooks/useInactivityTimeout.tsx`: 60 min, callback extra `onWarning` disparado a 60s do fim e função de reset.
- `src/hooks/useAuth.tsx` + novo `src/components/auth/InactivityWarningDialog.tsx`: AlertDialog global com contagem regressiva.
- Testes: atualizar/adicionar casos em `src/test/` para o novo temporizador e para a leitura do estado de onboarding vindo do perfil.
