## Diagnóstico

O preview local está OK (HTTP 200, renderiza a home). O **site publicado** (`frotaappcuritiba.lovable.app`) carrega o HTML mas o React quebra imediatamente com:

```
PAGEERROR: supabaseUrl is required.
```

Resultado: `<div id="root">` fica vazio e a página aparece "em branco" (só o badge "Edit with Lovable" fica visível).

### Causa

O bundle atualmente publicado foi gerado **sem** as variáveis `VITE_SUPABASE_URL` / `VITE_SUPABASE_PUBLISHABLE_KEY` embutidas. Isso faz o `createClient(...)` em `src/integrations/supabase/client.ts` (linhas 5–11) receber `undefined` e explodir na inicialização do módulo, antes de qualquer rota React montar.

Hoje o `.env` local **já contém** essas variáveis corretamente — ou seja, o bundle atual em produção é antigo/stale, feito antes do `.env` ficar consistente. Um novo build/publish resolve.

## Ação

1. **Republicar o app** — um novo deploy pega o `.env` atual e embute `VITE_SUPABASE_URL` e `VITE_SUPABASE_PUBLISHABLE_KEY` no bundle, eliminando o `supabaseUrl is required`.
2. **Verificar após publicar** — abrir `https://frotaappcuritiba.lovable.app/` e confirmar que a home renderiza (Header, Hero, cards) sem `PAGEERROR` no console.

Nenhum código do projeto precisa ser alterado. `src/integrations/supabase/client.ts` é auto-gerado e as regras do projeto proíbem editá-lo, e o `.env` já está correto.

## Observação secundária (não é o que quebra o site)

No preview local existe um warning CORS em `functions/v1/log-visit` porque o `ALLOWED_ORIGIN` só libera o domínio publicado, não `http://localhost:8080`. É um log fire-and-forget e **não afeta a renderização**. Fica registrado aqui, mas não faz parte desta correção.
