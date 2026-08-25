# Validação do cadastro (/cadastro) com React Hook Form + Zod

## Fase 1 — Auditoria (concluída, apenas leitura)

Tela: `/cadastro` → `src/pages/Auth.tsx` → `src/components/auth/RegisterForm.tsx`, com subcomponentes `DocumentFields.tsx`, `EmailField.tsx`, `PasswordField.tsx`, `RoleSelector.tsx` e helpers em `src/lib/documentValidation.ts`.

| Campo | Existe? | Obrigatório | Validação atual | Feedback |
|---|---|---|---|---|
| Nome completo | Não existe no formulário | — | — | — |
| E-mail | Sim | Sim (`required` HTML) | Só `type="email"` do navegador; sem Zod nem trim/limite | Sem mensagem inline |
| Senha | Sim | Sim | Regras (8+, maiúscula, minúscula, número, especial) validadas só no submit, via `toast.error`; medidor de força visual OK | Toast, não inline |
| Confirmação de senha | Sim | Sim | Comparada só no submit, via toast | Toast, não inline |
| CPF/CNPJ | Sim | Sim | Máscara + dígito verificador no client (`validateCPF`/`validateCNPJ`) — não depende só do trigger | Inline `text-destructive` + borda `border-destructive` (OK) |
| CNH (motorista) | Sim | Sim | Máscara + 11 dígitos + dígito verificador (`validateCNH`) no client | Inline `text-destructive` (OK) |
| Validade da CNH | Sim | Sim | Data futura obrigatória (`min` + comparação) | Inline `text-destructive` (OK) |
| Telefone | Não existe no formulário | — | — | — |
| CEP/endereço | Não existe no formulário | — | — | — |
| Aceite de termos | Sim | Sim | Bloqueia o botão | Toast |

Cores: nenhum valor cru (`text-red-*`) encontrado nesses arquivos — tudo já usa tokens semânticos (`destructive`, `success`, `warning`, `muted-foreground`).

Conclusão: CPF/CNPJ e CNH já têm validação de dígito verificador no client. Os pontos fracos são o **e-mail** (sem validação real) e **senha/confirmação** (erros só em toast, no submit, sem indicação inline nem borda no input), além do formulário inteiro usar `useState` manual em vez do padrão do projeto (react-hook-form + Zod).

## Fase 2 — O que será implementado

Conforme sua escolha, **nenhum campo novo** (nome, telefone, CEP ficam fora). Apenas endurecer a validação do que já existe.

1. Novo `src/components/auth/registerSchema.ts` com schema Zod condicional por papel:
   - e-mail: obrigatório, `trim()`, formato válido, máximo 255 — mensagens em português;
   - senha: mínimo 8, maiúscula, minúscula, número, caractere especial;
   - confirmação: obrigatória e igual à senha (`refine`);
   - documento: obrigatório e reaproveitando `validateDocument` (dígito verificador) — para motorista, exige CPF;
   - CNH e validade: exigidas apenas quando o papel é motorista, reaproveitando `validateCNHDocument` e checando data futura;
   - aceite dos termos: obrigatório.
2. `RegisterForm.tsx` migra para `useForm` + `zodResolver`, mantendo exatamente os mesmos dados enviados a `signUp` (nenhuma mudança no fluxo de auth).
3. Erros passam a aparecer **inline abaixo de cada campo** (`text-destructive`) com **borda `border-destructive`** no input — inclusive e-mail, senha e confirmação, que hoje só têm toast. As máscaras e os ícones de válido/inválido do CPF/CNPJ e CNH permanecem.
4. `EmailField` e `PasswordField` ganham props opcionais de `error` para renderizar a mensagem inline; nenhum outro formulário que os usa muda de comportamento (as props são opcionais).
5. Nada de cor crua — o guard `scripts/check-hardcoded-colors.mjs` continua verde.

## Fora de escopo (respeitado)

Triggers `validate_cpf`/`validate_cnpj`/`validate_cnh`, tabela `profiles`, políticas RLS, `useAuth`, `rate-limited-login` e qualquer outro formulário permanecem intocados. Nenhuma biblioteca nova.
