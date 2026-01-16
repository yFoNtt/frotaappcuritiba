// Mock data for Motorista Dashboard

export const motoristaVehicle = {
  id: '1',
  marca: 'Chevrolet',
  modelo: 'Onix Plus',
  ano: 2023,
  placa: 'ABC-1234',
  cor: 'Prata',
  combustivel: 'Flex',
  km: 45000,
  status: 'Em uso',
  imagem: 'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?w=800',
  locador: {
    nome: 'Auto Locadora Premium',
    telefone: '(11) 99999-9999',
    email: 'contato@autolocadora.com',
  },
  contrato: {
    inicio: '2024-01-15',
    fim: '2024-07-15',
    valorSemanal: 450,
    diaVencimento: 'Segunda-feira',
  },
};

export const motoristaPagamentos = [
  {
    id: '1',
    semana: 'Semana 1 - Jan/2024',
    periodo: '15/01 - 21/01',
    valor: 450,
    status: 'pago',
    dataPagamento: '2024-01-15',
    comprovante: true,
  },
  {
    id: '2',
    semana: 'Semana 2 - Jan/2024',
    periodo: '22/01 - 28/01',
    valor: 450,
    status: 'pago',
    dataPagamento: '2024-01-22',
    comprovante: true,
  },
  {
    id: '3',
    semana: 'Semana 3 - Jan/2024',
    periodo: '29/01 - 04/02',
    valor: 450,
    status: 'pendente',
    dataPagamento: null,
    comprovante: false,
  },
  {
    id: '4',
    semana: 'Semana 4 - Fev/2024',
    periodo: '05/02 - 11/02',
    valor: 450,
    status: 'atrasado',
    dataPagamento: null,
    comprovante: false,
  },
];

export const motoristaHistorico = [
  {
    id: '1',
    tipo: 'pagamento',
    descricao: 'Pagamento semanal realizado',
    data: '2024-01-22',
    valor: 450,
  },
  {
    id: '2',
    tipo: 'pagamento',
    descricao: 'Pagamento semanal realizado',
    data: '2024-01-15',
    valor: 450,
  },
  {
    id: '3',
    tipo: 'contrato',
    descricao: 'Contrato de locação iniciado',
    data: '2024-01-15',
    valor: null,
  },
  {
    id: '4',
    tipo: 'manutencao',
    descricao: 'Troca de óleo realizada',
    data: '2024-01-10',
    valor: 0,
  },
];

export const motoristaStats = {
  totalPago: 900,
  pendente: 450,
  atrasado: 450,
  proximoVencimento: '2024-02-05',
  diasRestantesContrato: 165,
};
