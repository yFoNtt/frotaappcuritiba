-- Adiciona coluna de preferências de notificação em profiles (compartilhada entre admin e locador).
-- É um objeto flexível: cada tela lê/escreve apenas as chaves que usa; chaves não reconhecidas são ignoradas.
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS notification_preferences jsonb NOT NULL DEFAULT '{
    "new_signups": true,
    "system_alerts": true,
    "weekly_reports": true,
    "email_alerts": true,
    "payment_alerts": true,
    "maintenance_alerts": true,
    "new_messages": true
  }'::jsonb;

COMMENT ON COLUMN public.profiles.notification_preferences IS
  'Preferências de notificação por usuário (admin e locador). Chaves não reconhecidas pela tela atual são ignoradas.';