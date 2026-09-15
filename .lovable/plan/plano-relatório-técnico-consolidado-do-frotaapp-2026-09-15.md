# Plano — Relatório técnico consolidado do FrotaApp

## Objetivo

Produzir um único arquivo Markdown, pronto para download e cópia, descrevendo o estado atual do projeto com base exclusivamente no repositório e no banco ativo no momento da análise.

## Fontes que serão auditadas

- `package.json` e arquivos de configuração para versões, scripts, build, lint e testes.
- Arquivos de rotas e páginas para o inventário completo de URLs e áreas de acesso.
- Hooks, componentes e testes para confirmar fluxos realmente implementados.
- Todas as funções em `supabase/functions/` e `supabase/config.toml` para autenticação declarada e finalidade.
- Tipos gerados, migrations e esquema ativo do banco para tabelas, colunas de isolamento, RLS, policies, chaves estrangeiras, funções SQL e triggers.
- Configuração e uso de autenticação, storage, realtime, IA e demais serviços externos encontrados no código.
- Marcadores e implementações estáticas (`mock`, `TODO`, estado local, placeholders) para identificar lacunas sem inferências históricas.

## Estrutura do documento

1. **Escopo e metodologia**
   - Fontes analisadas e distinção entre código versionado, configuração declarada e estado ativo do banco.

2. **Visão geral do produto e personas**
   - Finalidade do sistema.
   - Visitante, locador, motorista e administrador.
   - Capacidades comprovadas de cada perfil.
   - Proteção de rotas, roles, RLS, MFA/consentimento e chaves de isolamento.

3. **Stack técnica**
   - Dependências e versões reais do `package.json`.
   - Front-end, UI, formulários, consultas, gráficos, exportações, build, lint e testes.
   - Banco, autenticação, storage, realtime, funções de nuvem, IA e integrações externas efetivamente referenciadas.

4. **Mapa de rotas**
   - Tabelas separadas para rotas públicas, locador, motorista e administrador.
   - Para cada rota: URL, página/componente, carregamento lazy, proteção e papel permitido.
   - Rota curinga e comportamentos de redirecionamento relevantes.

5. **Modelo de dados**
   - Todas as tabelas públicas do esquema ativo, propósito e coluna principal de isolamento.
   - Relações com e sem foreign keys físicas, sem presumir vínculos ausentes.
   - Policies/RLS resumidas por perfil.
   - Todas as funções SQL, destacando `SECURITY DEFINER`.
   - Todos os triggers ativos, inclusive duplicidades verificadas.
   - Buckets e regras de acesso encontradas.

6. **Funções de backend**
   - Inventário completo dos diretórios atuais em `supabase/functions/`.
   - `verify_jwt` declarado no arquivo de configuração ou ausência de declaração.
   - Validação de autenticação/autorização feita internamente pelo código.
   - Propósito e principais dependências de cada função.
   - Separação clara entre “presente no repositório” e “deploy confirmado”, quando o repositório não provar o deploy.

7. **Funcionalidades operacionais**
   - Autenticação e conta.
   - Marketplace público.
   - Gestão do locador.
   - Área do motorista.
   - Administração.
   - Recursos transversais da plataforma.
   - Classificação conservadora: funcional comprovado, parcial ou apenas interface.

8. **Lacunas técnicas e próximos passos**
   - Apenas lacunas demonstráveis no código atual.
   - Categorias: bloqueador comercial, segurança/LGPD, UX/produto e dívida técnica.
   - Evidência e impacto resumidos; sem repetir itens já implementados.

9. **Apêndice de arquivos-chave**
   - Caminhos por autenticação, rotas, autorização, dados, validação, sanitização, design tokens, storage, IA, testes e configurações.

10. **Data da análise**
    - Data e hora exatas em UTC e horário de São Paulo, capturadas no momento da geração.

## Critérios de qualidade

- Toda afirmação sobre estado atual terá evidência rastreável no código ou no esquema ativo.
- Divergências entre migrations, tipos gerados e banco ativo serão explicitadas.
- “Funcional” não será usado apenas porque existe uma página; serão verificados hooks, persistência, proteção e testes disponíveis.
- Segredos, chaves e dados pessoais não serão incluídos.
- Nenhum código, configuração ou dado do produto será alterado.

## Entrega

- Arquivo único: `/mnt/documents/FrotaApp-relatorio-tecnico-consolidado.md`.
- Markdown com sumário, tabelas legíveis e referências de arquivos/linhas quando úteis.
- Revisão final de completude contra todas as seções solicitadas.
