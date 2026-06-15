# Sprint de Correções — Auth, Chat e Edge Function

## 1. Bug do checkbox de termos (`RegisterForm.tsx`)
Trocar o `<Checkbox>` do shadcn por `<input type="checkbox">` nativo nas linhas 248–267, mantendo `<Label>` e os links. Usar `accent-primary` (token semântico válido) e `h-4 w-4 mt-1 cursor-pointer`. Remover import de `Checkbox`. Garante que o `onChange` dispara mesmo se o foco for perdido (clique nos links de Termos/Privacidade).

## 2. Validação de minúscula (`RegisterForm.tsx` + `useAuth.tsx`)
- `RegisterForm.tsx` linha ~140: adicionar bloco `if (!/[a-z]/.test(password))` após a checagem de maiúscula.
- `useAuth.tsx` linha ~109: adicionar a mesma checagem após a maiúscula em `signUp`.
Mensagens em PT-BR alinhadas com as existentes.

## 3. Sanitização do chat (`useChat.ts`)
No `send` (linha 404), substituir `const text = content.trim();` por:
```ts
const text = sanitizeText(content.trim()) ?? '';
```
Adicionar `import { sanitizeText } from '@/lib/sanitize';` no topo. Não tocar em anexos.

## 4. CORS restrito (`rate-limited-login/index.ts`)
Trocar `"Access-Control-Allow-Origin": "*"` por:
```ts
"Access-Control-Allow-Origin": Deno.env.get("ALLOWED_ORIGIN") ?? "https://frotaappcuritiba.lovable.app",
```
**Pendência do usuário:** depois do deploy, adicionar o secret `ALLOWED_ORIGIN` em Project Settings → Secrets (não posso adicioná-lo sem o valor; o fallback hardcoded já cobre produção).

## 5. `GoogleIcon` compartilhado
- Criar `src/components/auth/GoogleIcon.tsx` com o componente exato do prompt.
- Substituir o `<svg>` inline em `LoginForm.tsx` (linhas 82–99) e `RegisterForm.tsx` (linhas 193–198) por `<GoogleIcon className="mr-2 h-4 w-4" />`.

## 6. `vehicleLabels.ts` centralizado
- Ler `VehicleDetails.tsx` e `VehicleCard.tsx` para extrair os 3 objetos (`statusLabels`, `fuelLabels`, `appLabels`).
- Criar `src/lib/vehicleLabels.ts` unindo todas as keys das duas versões (sem perder nenhuma).
- Importar nos dois arquivos e remover as constantes locais.

## 7. Race condition no `useAuth` (`useAuth.tsx`)
- No `useEffect`, declarar `let initialized = false;`. Setar `initialized = true` no início do callback de `onAuthStateChange`. Em `getSession().then(...)`, retornar cedo se `initialized` for `true`.
- Converter `signOut` para `useCallback(async () => { ... }, [])`, no mesmo padrão de `refreshRole`.

## Arquivos afetados
- editar: `src/components/auth/RegisterForm.tsx`, `src/components/auth/LoginForm.tsx`, `src/hooks/useAuth.tsx`, `src/hooks/useChat.ts`, `src/pages/VehicleDetails.tsx`, `src/components/vehicles/VehicleCard.tsx`, `supabase/functions/rate-limited-login/index.ts`
- criar: `src/components/auth/GoogleIcon.tsx`, `src/lib/vehicleLabels.ts`

## Fora de escopo
RLS, migrations, outras Edge Functions, testes existentes, cores cruas Tailwind.
