# Correção da tela branca em produção

## Diagnóstico confirmado — etapas 1 a 6

1. **Console do navegador**
   - A URL publicada responde e entrega HTML, CSS e JavaScript, mas a página fica vazia.
   - Erro capturado: `supabaseUrl is required.`
   - Não houve warnings adicionais, requests com falha, respostas 404/500 nem erro de CORS durante a abertura.

2. **Service Worker / PWA**
   - Não existe registro de service worker no navegador, nem código de registro, Workbox ou `vite-plugin-pwa` no projeto.
   - `/sw.js` e `/service-worker.js` retornam 404; Cache Storage está vazio.
   - O `index.html` publicado usa `Cache-Control: no-cache, must-revalidate` e aponta para assets com hash que respondem 200.
   - Portanto, cache antigo de service worker **não é a causa** e não será criado um SW nesta correção. Nenhuma ação especial de recuperação é necessária para o usuário final.

3. **Build, assets e rotas lazy**
   - O bundle inicial publicado e o CSS respondem 200.
   - Todas as páginas referenciadas por `React.lazy` existem e possuem `export default`; não foi encontrado import lazy quebrado.
   - Após a correção, executar o build de produção e os testes focados de inicialização para confirmar TypeScript/bundling.

4. **Variáveis de ambiente**
   - `VITE_SUPABASE_URL` e `VITE_SUPABASE_PUBLISHABLE_KEY` existem no ambiente local, mas estão ausentes no bundle atualmente publicado.
   - Isso faz `createClient(...)` lançar `supabaseUrl is required` durante a avaliação dos módulos.
   - A origem exata da tela branca é a combinação de env ausente no deploy com a ordem atual de imports: `main.tsx` importa `App.tsx` estaticamente; `App` importa `useAuth`/`VisitLogger`; esses módulos importam o client, que lança **antes** de o guard de env em `main.tsx` executar.

5. **Error Boundaries e montagem**
   - Já existe um `ErrorBoundary` envolvendo os providers em `App.tsx`, mas ele só passa a existir depois que os módulos foram importados e o React montou.
   - Por isso, ele não consegue capturar a exceção atual de inicialização do client.
   - O `#root` existe no HTML, mas `main.tsx` usa non-null assertion e não tem fallback para falha no bootstrap/import dinâmico.

6. **Loop ou loading travado**
   - Não foi encontrado loop de render ou redirect.
   - `useAuth` pode permanecer em loading se uma chamada de sessão/role nunca resolver, pois não possui timeout, mas isso **não explica o incidente atual**: a produção quebra antes de `AuthProvider` montar.
   - Não alterar essa lógica nesta correção para evitar tratar um risco não observado como causa raiz.

## Implementação

### `src/main.tsx`

- Remover o import estático de `App` e criar um bootstrap assíncrono.
- Validar `#root` e as envs obrigatórias **antes** de carregar `App.tsx`.
- Carregar `App` com `import("./App.tsx")` somente após a validação; assim, o client nunca é avaliado quando a configuração está ausente.
- Manter a mensagem clara de “Configuração ausente” já criada e garantir que ela seja exibida no deploy problemático em vez de tela branca.
- Capturar falhas do import/bootstrap e renderizar um fallback claro com ação de recarregar.
- Montar um `ErrorBoundary` de nível raiz em `main.tsx`, envolvendo toda a aplicação.

### `src/App.tsx`

- Remover apenas o boundary duplicado de dentro de `App`, pois ele será promovido para `main.tsx` e continuará envolvendo `ThemeProvider`, Query Client, Router e Auth Provider.
- Preservar providers, rotas e padrões existentes sem outras alterações.

### Teste de regressão de bootstrap

- Adicionar teste focado que simule envs ausentes e confirme que o módulo do app/client não é carregado e que a mensagem de configuração aparece.
- Confirmar também que, com envs presentes, o app é montado dentro do boundary raiz.

## Diff funcional esperado

```text
Antes
main.tsx -> import estático App -> useAuth/VisitLogger -> client -> throw
         -> guard de env nunca executa -> tela branca

Depois
main.tsx -> valida root + env
         -> env ausente: fallback visível, sem importar App/client
         -> env presente: import dinâmico App -> ErrorBoundary raiz -> providers
```

## Validação e recuperação

1. Executar teste de regressão e build de produção.
2. Verificar o bundle gerado e a ausência de erros de inicialização.
3. Publicar uma nova versão para que as variáveis atuais sejam embutidas no build de produção.
4. Abrir a URL publicada em contexto limpo e confirmar home renderizada, console sem `supabaseUrl is required`, assets 200 e ausência de SW.

Como não há service worker, o usuário final não precisa limpar cache nem fechar todas as abas; após o novo deploy, um recarregamento normal deve buscar o HTML revalidado. Se as envs continuarem ausentes no ambiente de publicação, a nova versão mostrará a mensagem de configuração em vez de uma tela branca, deixando o problema operacional explícito.

## Arquivos previstos

- `src/main.tsx`
- `src/App.tsx`
- Um teste de bootstrap em `src/test/`

Não tocar em `supabase/functions/mcp/**`, schema, RLS, client auto-gerado ou padrões de backend.