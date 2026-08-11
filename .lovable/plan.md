# Corrigir o login (erro "Failed to fetch")

## O que está acontecendo

O login não falha por senha errada. A tela envia a requisição para um endereço inválido:

```text
POST https://undefined.supabase.co/functions/v1/rate-limited-login  -> Failed to fetch
```

O código do login monta a URL do serviço de autenticação com uma variável de ambiente (`VITE_SUPABASE_PROJECT_ID`) que não está presente no build atual — por isso o "undefined" no endereço. As outras variáveis do backend têm valor de reserva no build, mas essa não tem, então só o login quebra.

## Correção

1. Em `src/hooks/useAuth.tsx` (função `signIn`), parar de montar a URL manualmente e chamar a função de backend pelo próprio cliente já configurado (`supabase.functions.invoke('rate-limited-login', ...)`), que usa a URL do backend válida. Tratar as respostas de erro (401 credenciais inválidas, 429 muitas tentativas) mantendo as mensagens atuais em português.
2. Em `vite.config.ts`, incluir `VITE_SUPABASE_PROJECT_ID` no mesmo bloco de valores de reserva das outras variáveis, para que nenhum outro ponto do app quebre caso a variável falte no build.
3. Validar com Playwright: abrir `/login`, autenticar com uma conta de teste e confirmar o redirecionamento para o painel, sem erros no console/rede.

## Detalhes técnicos

- `functions.invoke` retorna erro sem corpo em status não-2xx; ler o corpo via `error.context.json()` (ou `response.json()`) para preservar as mensagens de rate limit e tentativas restantes.
- Nenhuma alteração de banco, RLS ou da Edge Function `rate-limited-login` é necessária — ela já responde corretamente.
