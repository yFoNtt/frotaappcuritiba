

# Adicionar Testes E2E com Playwright

## Limitação Importante

O ambiente Lovable **não suporta execução de Playwright** diretamente — Playwright requer um navegador real (Chromium/Firefox) e um servidor local rodando, o que não está disponível no sandbox. 

O que posso fazer é **criar toda a estrutura de testes E2E** (configuração + arquivos de teste) para que você rode localmente no seu computador.

## O que será criado

### 1. Configuração (`playwright.config.ts`)
- Base URL apontando para `localhost:5173` (dev) ou URL publicada
- Timeout, retries, screenshots on failure
- Projeto configurado para Chromium

### 2. Testes E2E — Fluxos Críticos

| Arquivo | Fluxo coberto |
|---------|--------------|
| `e2e/auth.spec.ts` | Login email/senha, login Google (verifica redirect), cadastro, logout, senha incorreta, rate-limit |
| `e2e/role-redirect.spec.ts` | Redirecionamento por role (locador→/locador, motorista→/motorista, admin→/admin) |
| `e2e/locador-vehicles.spec.ts` | CRUD de veículos: criar, editar, excluir, upload de fotos |
| `e2e/locador-contracts.spec.ts` | Criar contrato, vincular motorista, finalizar contrato |
| `e2e/locador-payments.spec.ts` | Registrar pagamento, filtrar, exportar |
| `e2e/locador-maintenance.spec.ts` | Criar manutenção, editar status, filtrar |
| `e2e/motorista-dashboard.spec.ts` | Visualizar veículo, pagamentos, documentos |
| `e2e/public-pages.spec.ts` | Navegação pública: home, veículos, detalhes, como funciona |
| `e2e/theme-responsive.spec.ts` | Alternância de tema, layout mobile |

### 3. Scripts no `package.json`
```
"test:e2e": "playwright test",
"test:e2e:ui": "playwright test --ui"
```

### 4. Helper de autenticação (`e2e/helpers/auth.ts`)
- Função reutilizável para login com contas de teste existentes
- Storage state para evitar re-login entre testes

## Como usar (localmente)
```bash
npm install -D @playwright/test
npx playwright install chromium
npm run dev  # em um terminal
npm run test:e2e  # em outro terminal
```

## Detalhes técnicos
- Usará as contas de teste já existentes (`motorista.teste@frotaapp.com` e `locador.teste@frotaapp.com`)
- Testes isolados por contexto de browser (sem interferência entre testes)
- Screenshots automáticos em caso de falha salvos em `e2e/screenshots/`
- ~9 arquivos de teste cobrindo os ~40 cenários manuais mais críticos

