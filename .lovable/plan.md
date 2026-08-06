# Corrigir tela "Configuração ausente" em produção

## Diagnóstico (verificado agora)

- O `.env` local está correto: `VITE_SUPABASE_URL` e `VITE_SUPABASE_PUBLISHABLE_KEY` têm valor, e o preview de desenvolvimento carrega normalmente.
- O bundle publicado (`https://frotaappcuritiba.lovable.app/assets/index-BusgXDYZ.js`) **não contém** a URL do backend — busca pela string retornou zero ocorrências.
- Conclusão: o build de produção foi gerado sem as variáveis embutidas, então o guard em `src/main.tsx` mostra corretamente "Configuração ausente". O problema é do build publicado, não do código da aplicação.

## O que fazer

1. **Rede de segurança no build**: em `vite.config.ts`, injetar valores de fallback para `VITE_SUPABASE_URL` e `VITE_SUPABASE_PUBLISHABLE_KEY` quando não estiverem presentes no ambiente de build. Esses dois valores são públicos por definição (a proteção real é o RLS), então podem constar no bundle sem risco.
2. **Republicar** o projeto para que o novo bundle vá ao ar com as variáveis embutidas.
3. **Validar**: baixar o JS do site publicado e confirmar que a URL do backend aparece no bundle, e abrir a home confirmando que a tela de erro sumiu.

## Detalhes técnicos

- `vite.config.ts`: usar `loadEnv(mode, process.cwd(), "")` e um bloco `define` com
  `"import.meta.env.VITE_SUPABASE_URL"` / `"import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY"`
  definidos apenas quando o valor do ambiente estiver vazio (fallback com os valores públicos do projeto).
- Isso cobre também `src/integrations/supabase/client.ts`, que é auto-gerado e lê `import.meta.env` diretamente — nenhum arquivo auto-gerado será alterado.
- O guard e o `StartupFallback` em `src/main.tsx` permanecem como estão (rede de segurança para outros erros de inicialização).
- Sem mudanças de banco, RLS, ou de qualquer lógica de negócio.
