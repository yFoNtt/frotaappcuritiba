# Roadmap

## Autenticação e administração — execução sequencial
- [ ] Revisar e corrigir o SQL de vínculos por contrato e retenção de histórico; entregar diagnóstico e minuta, sem aplicação ao banco.
- [ ] Etapa 3: comprovar revogação de sessões na senha temporária e testes reais de não-admin, exclusão protegida e primeiro consentimento.
- [ ] Etapa 3: validar conclusão da troca obrigatória com MFA ativo sem enfraquecer as policies de perfil.
- [ ] Etapa 4: permissões administrativas aplicadas; completar hooks, formulários, telas e regressão de isolamento/auditoria após fechar a Etapa 3.
- [ ] Etapa 5: não tornar MFA obrigatório para admin antes de comprovar todos os testes de ponta a ponta da Etapa 2; conferir triggers ativos.
- [ ] Etapa 6: migrar MFA por e-mail para aplicativo autenticador (TOTP/aal2).
- [ ] Etapa 6: separar seed-test-* e cleanup-test-motoristas do ambiente publicado.

- [ ] Corrigir CORS do preview em mfa-session sem wildcard
- [ ] Trocar gate MFA do INSERT inicial de profiles por ownership
- [ ] Concluir bootstrap seguro de profiles no cadastro e testes
- [ ] Refatorar upload do chat sem executor async de Promise
- [ ] Restringir CORS e alinhar funções de teste
- [ ] Validar payloads das nove Edge Functions
- [ ] Criar RPCs e migrar filtros/paginação do marketplace
- [ ] Validar banco, funções, testes, build e preview
