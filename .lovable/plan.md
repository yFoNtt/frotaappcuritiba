
## Plano

Aplicar as 6 entregas na ordem exata solicitada, sem tocar em nenhum outro arquivo.

### 1. `src/lib/mcp/tools/search-vehicles.ts`
Substituir a query direta em `.from("vehicles")` por `supabase.rpc("get_public_vehicles")` e aplicar os filtros (`city`, `max_weekly_price`, `fuel_type`, `limit`) em memória sobre o resultado. Remover o segundo bloco `const { data, error } = await query;` que fica redundante.

### 2. `src/lib/mcp/tools/get-vehicle-details.ts`
Substituir a query direta por `supabase.rpc("get_public_vehicle", { _vehicle_id: vehicle_id }).maybeSingle()`. Restante do handler (tratamento de erro, formatação) permanece.

### 3. `src/test/auth-redirect.test.tsx`
Trocar a asserção `getByText('Entrar no FrotaApp')` por `getByRole('heading', { level: 1, name: 'Entrar no FrotaApp' })` para lidar com o h1 sr-only + heading visível.

### 4. `eslint.config.js`
Adicionar `"supabase/functions/mcp/**"` na lista de `ignores` para não lintar o arquivo auto-gerado do MCP.

### 5. `package.json`
Mover `@playwright/test` de `dependencies` para `devDependencies` (mantendo `^1.49.0`).

### 6. Terminal
Rodar `npm audit fix` (sem `--force`). Aceito que restarão 2 warnings em `esbuild`/`vite` (bloqueados por bump major do Vite via `@lovable.dev/mcp-js`).

### Validação
Após as edições: rodar typecheck e vitest para confirmar que o teste de auth-redirect passa e que as tools MCP compilam. Não regenerar `supabase/functions/mcp/index.ts` — o plugin Vite cuida disso na próxima build. Após a build, chamar `app_mcp_server--extract_mcp_manifest` para revalidar o manifest e `supabase--deploy_edge_functions` para publicar a função `mcp` com o novo comportamento (uso das RPCs).

### Não tocar
- `supabase/functions/mcp/index.ts` (auto-gerado)
- `bun.lock` / `bun.lockb` / `package-lock.json` (fora do que `npm audit fix` alterar sozinho)
- Qualquer outro arquivo
