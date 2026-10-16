# Teste do fluxo de contratos com dados fictícios (TESTE/DEMO)

## Como a validação de CPF/CNPJ funciona hoje
- Na tela e no banco o documento precisa ter 11 dígitos (CPF) ou 14 (CNPJ), com dígitos verificadores corretos. Sequências repetidas (ex.: 111.111.111-11) são recusadas.
- O banco confere tudo de novo ao salvar o perfil, então só mudar a tela não basta.
- Não existe hoje um ambiente de testes separado: o preview e o site publicado usam **o mesmo banco**. Qualquer registro criado pelo preview vai direto para o banco de produção.

## Abordagem proposta (sem tocar em produção)
1. **Abrir um rascunho isolado** (draft). Ele tem banco, login e dados próprios, separados de produção. Todo o teste acontece lá.
2. **Liberar o cadastro de teste só no rascunho.** Nada de documento real e nada de número inventado com cara de verdadeiro:
   - O perfil de teste dispensa o documento por uma marcação explícita (conta com e-mail `@teste.frotaapp.invalid` e nome com prefixo "TESTE"). Essa exceção fica só no banco do rascunho, e o código da tela não muda.
   - O domínio `.invalid` é reservado e nunca entrega e-mail, então não pode pertencer a ninguém.
3. **Criar no rascunho somente registros identificados como TESTE:**
   - 1 locador "TESTE Locador DEMO";
   - 1 veículo com placa "TST0A00" e modelo "DEMO";
   - 1 motorista "TESTE Motorista DEMO". A CNH precisa passar pela validação algorítmica, então uso um número de exemplo de documentação pública ou libero a CNH pela mesma marcação de teste. Prefiro liberar.
   - 1 contrato entre eles.
4. **Testar no navegador, logado como o locador de teste:**
   - os botões "vincular" e "desvincular" em Motoristas levam a Contratos, sem gravar nada direto;
   - criar e ativar o contrato faz o veículo virar "locado" e o motorista aparecer vinculado;
   - encerrar o contrato libera veículo e motorista;
   - um contrato encerrado não pode ser reaberto;
   - motorista com CNH vencida e veículo indisponível são bloqueados;
   - releitura no banco do rascunho confirma que veículo, motorista e contrato continuam coerentes.
5. **Descartar o rascunho no final.** Nada é aceito em produção.

## Riscos
- Se o rascunho não estiver disponível neste projeto, a alternativa seria criar dados no banco compartilhado, ou seja, em produção. Isso eu **não** faço sem uma nova autorização sua.
- A exceção de documento só existe no banco do rascunho. Se alguém aceitar o rascunho por engano, ela iria para produção. Por isso o rascunho é descartado, nunca aceito.
- Um rascunho recém-criado pode exigir aplicar migrations antes de o app funcionar, o que pode levar algum tempo.

## Entrega final
Relatório com testes realizados, resultados, problemas encontrados e o que falta corrigir.
