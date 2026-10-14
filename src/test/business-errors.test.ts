import { describe, it, expect } from 'vitest';
import { getBusinessErrorMessage } from '@/lib/businessErrors';

describe('Curated business errors', () => {
  const cases = [
    ['Veículo já possui um contrato ativo', 'Este veículo ou motorista já possui um contrato ativo. Encerre o contrato atual antes de criar outro.'],
    ['Motorista já possui um contrato ativo', 'Este veículo ou motorista já possui um contrato ativo. Encerre o contrato atual antes de criar outro.'],
    ['Veículo não pertence a este locador', 'Selecione um motorista e um veículo pertencentes à sua frota.'],
    ['Veículo precisa estar disponível para ativar o contrato', 'O veículo precisa estar disponível para ativar o contrato.'],
    ['CNH do motorista está vencida', 'A CNH do motorista está vencida. Atualize a validade antes de ativar o contrato.'],
    ['Contrato encerrado ou cancelado não pode ser reaberto', 'Contratos encerrados ou cancelados não podem ser reabertos. Crie um novo contrato.'],
    ['Contrato ativo não pode voltar a rascunho', 'Um contrato ativo não pode voltar a rascunho. Encerre ou cancele o contrato.'],
    ['Motorista e veículo de um contrato ativo ou encerrado não podem ser alterados', 'Motorista e veículo só podem ser alterados em contratos pendentes.'],
    ['O locador de um contrato não pode ser alterado', 'O locador deste registro não pode ser alterado.'],
    ['O vínculo é definido pelo contrato', 'O vínculo entre motorista e veículo é definido pelo contrato. Use a página de Contratos.'],
    ['Encerre o contrato antes de marcá-lo como disponível', 'Encerre o contrato antes de marcar o veículo como disponível.'],
    ['Um veículo só fica alugado por meio de um contrato ativo', 'Para marcar o veículo como alugado, crie e ative um contrato.'],
  ];
  it.each(cases)('maps %s without exposing trailing diagnostics', (message, expected) => {
    expect(getBusinessErrorMessage({ message: `${message}; SQL SELECT private_data; stack trace` }, 'Falha')).toBe(expected);
  });
  it.each([null, undefined, {}, { message: 123 }, { message: 'SQL DELETE stack trace' }, new Error('Network failed')])('uses the operation fallback for unknown errors', error => {
    expect(getBusinessErrorMessage(error, 'Erro ao criar contrato. Tente novamente.')).toBe('Erro ao criar contrato. Tente novamente.');
  });
});