# 🚗 FrotaApp Curitiba

Sistema completo de **gestão de frotas e locação de veículos** para locadores e motoristas de aplicativo na região de Curitiba.

🔗 **Acesse a aplicação**: [frotaappcuritiba.lovable.app](https://frotaappcuritiba.lovable.app)

## Funcionalidades

### 📋 Gestão de Veículos
- Cadastro completo com fotos, dados do veículo e localização
- Controle de quilometragem e status (disponível, alugado, manutenção)
- Galeria de imagens e filtros de busca

### 📝 Contratos
- Criação e gestão de contratos de locação
- Vínculo entre veículo e motorista
- Controle de valor semanal, caução, limite de km e taxa por km excedente

### 🔧 Manutenções
- Registro de manutenções preventivas e corretivas
- Controle de custos, prestador de serviço e próxima manutenção
- Filtros por status, tipo e veículo

### 🔍 Inspeções
- Checklist personalizável de entrega e devolução
- Registro de condição externa/interna, nível de combustível e fotos
- Comparação entre inspeções de entrada e saída

### 👥 Motoristas
- Cadastro de motoristas com CNH e dados de contato
- Alertas automáticos de vencimento de CNH
- Vínculo com veículos e contratos

### 💰 Pagamentos
- Controle de pagamentos semanais por motorista
- Registro de método de pagamento, status e observações
- Exportação de relatórios

### 📄 Documentos
- Upload e gestão de documentos (contratos, CNH, CRLV, etc.)
- Solicitação de documentos ao motorista
- Controle de validade

### 🔔 Notificações e Alertas
- Notificações em tempo real
- Alertas de vencimento de CNH
- Alertas de manutenção programada

### 📊 Relatórios e Métricas
- Dashboard com indicadores de receita, ocupação e custos
- Gráficos de evolução de receita e custos de manutenção
- Exportação de dados

## Perfis de Usuário

| Perfil | Descrição |
|--------|-----------|
| **Locador** | Proprietário dos veículos. Gerencia frota, contratos, motoristas, pagamentos e manutenções. |
| **Motorista** | Motorista de aplicativo. Visualiza seu veículo, pagamentos, documentos e histórico. |
| **Administrador** | Acesso completo ao sistema. Gerencia usuários, roles, métricas e logs de auditoria. |

## Tecnologias

- **React 18** + **TypeScript 5**
- **Vite 5** (build e dev server)
- **Tailwind CSS v3** (estilização)
- **shadcn/ui** (componentes de interface)
- **Lovable Cloud** (backend, autenticação, banco de dados e storage)
- **Playwright** (testes E2E)

## Como rodar localmente

```bash
# 1. Clone o repositório
git clone <URL_DO_REPOSITORIO>

# 2. Acesse a pasta do projeto
cd frotaapp-curitiba

# 3. Instale as dependências
npm install

# 4. Inicie o servidor de desenvolvimento
npm run dev
```

O projeto estará disponível em `http://localhost:5173`.

## Testes

```bash
# Testes unitários
npm run test

# Testes E2E (requer Playwright instalado)
npm run test:e2e
```

## Licença

Projeto privado — todos os direitos reservados.
