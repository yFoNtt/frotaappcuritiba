

## Plano: Gerar relatório dos testes do sistema

Vou executar todos os testes (unitários e E2E) e gerar um relatório em PDF com os resultados.

### Etapas

1. **Executar testes unitários (Vitest)** com output JSON para capturar resultados detalhados
2. **Compilar resultados** — total de testes, aprovados, falhos, tempo de execução, cobertura por área
3. **Gerar relatório PDF** com:
   - Resumo executivo (total, aprovados, falhos, taxa de sucesso)
   - Detalhamento por categoria (autenticação, hooks, validações, acessibilidade, performance)
   - Lista dos testes E2E disponíveis (~50 cenários)
   - Data de execução e ambiente

### Arquivo gerado
- `/mnt/documents/relatorio_testes_frotaapp.pdf`

