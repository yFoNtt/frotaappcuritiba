/** Only return curated copy; never return database diagnostics verbatim. */
export function getBusinessErrorMessage(error: unknown, fallback: string): string {
  const raw = typeof error === 'object' && error !== null && 'message' in error
    ? error.message : typeof error === 'string' ? error : '';
  if (typeof raw !== 'string') return fallback;
  const message = raw.toLocaleLowerCase('pt-BR');
  const mappings: readonly [string, string][] = [
    ['já possui um contrato ativo', 'Este veículo ou motorista já possui um contrato ativo. Encerre o contrato atual antes de criar outro.'],
    ['não pertence a este locador', 'Selecione um motorista e um veículo pertencentes à sua frota.'],
    ['precisa estar disponível para ativar o contrato', 'O veículo precisa estar disponível para ativar o contrato.'],
    ['cnh do motorista está vencida', 'A CNH do motorista está vencida. Atualize a validade antes de ativar o contrato.'],
    ['contrato encerrado ou cancelado não pode ser reaberto', 'Contratos encerrados ou cancelados não podem ser reabertos. Crie um novo contrato.'],
    ['contrato ativo não pode voltar a rascunho', 'Um contrato ativo não pode voltar a rascunho. Encerre ou cancele o contrato.'],
    ['motorista e veículo de um contrato ativo ou encerrado não podem ser alterados', 'Motorista e veículo só podem ser alterados em contratos pendentes.'],
    ['definido pelo contrato', 'O vínculo entre motorista e veículo é definido pelo contrato. Use a página de Contratos.'],
    ['encerre o contrato antes de marcá-lo como disponível', 'Encerre o contrato antes de marcar o veículo como disponível.'],
    ['um veículo só fica alugado por meio de um contrato ativo', 'Para marcar o veículo como alugado, crie e ative um contrato.'],
  ];
  if (message.includes('o locador') && message.includes('não pode ser alterado')) {
    return 'O locador deste registro não pode ser alterado.';
  }
  return mappings.find(([fragment]) => message.includes(fragment))?.[1] ?? fallback;
}