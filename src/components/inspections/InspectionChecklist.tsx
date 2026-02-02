import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Check, X, Minus } from 'lucide-react';
import { cn } from '@/lib/utils';

export type ChecklistStatus = 'ok' | 'not_ok' | 'not_applicable';

export interface ChecklistItem {
  id: string;
  label: string;
  status: ChecklistStatus;
}

export interface ChecklistCategory {
  id: string;
  title: string;
  items: ChecklistItem[];
}

export const INSPECTION_CHECKLIST_TEMPLATE: ChecklistCategory[] = [
  {
    id: 'exterior',
    title: 'Exterior',
    items: [
      { id: 'lataria', label: 'Lataria (sem amassados)', status: 'ok' },
      { id: 'pintura', label: 'Pintura (sem riscos)', status: 'ok' },
      { id: 'vidros', label: 'Vidros (sem trincas)', status: 'ok' },
      { id: 'retrovisores', label: 'Retrovisores', status: 'ok' },
      { id: 'farois_dianteiros', label: 'Faróis dianteiros', status: 'ok' },
      { id: 'lanternas_traseiras', label: 'Lanternas traseiras', status: 'ok' },
      { id: 'setas', label: 'Setas/Piscas', status: 'ok' },
      { id: 'limpador_parabrisa', label: 'Limpador de para-brisa', status: 'ok' },
      { id: 'antena', label: 'Antena', status: 'ok' },
    ],
  },
  {
    id: 'pneus',
    title: 'Pneus e Rodas',
    items: [
      { id: 'pneu_dianteiro_esq', label: 'Pneu dianteiro esquerdo', status: 'ok' },
      { id: 'pneu_dianteiro_dir', label: 'Pneu dianteiro direito', status: 'ok' },
      { id: 'pneu_traseiro_esq', label: 'Pneu traseiro esquerdo', status: 'ok' },
      { id: 'pneu_traseiro_dir', label: 'Pneu traseiro direito', status: 'ok' },
      { id: 'estepe', label: 'Estepe', status: 'ok' },
      { id: 'calotas_rodas', label: 'Calotas/Rodas', status: 'ok' },
    ],
  },
  {
    id: 'interior',
    title: 'Interior',
    items: [
      { id: 'bancos', label: 'Bancos', status: 'ok' },
      { id: 'carpetes', label: 'Carpetes/Tapetes', status: 'ok' },
      { id: 'painel', label: 'Painel', status: 'ok' },
      { id: 'volante', label: 'Volante', status: 'ok' },
      { id: 'cambio', label: 'Câmbio', status: 'ok' },
      { id: 'ar_condicionado', label: 'Ar condicionado', status: 'ok' },
      { id: 'som_multimidia', label: 'Som/Multimídia', status: 'ok' },
      { id: 'cintos_seguranca', label: 'Cintos de segurança', status: 'ok' },
      { id: 'retrovisor_interno', label: 'Retrovisor interno', status: 'ok' },
    ],
  },
  {
    id: 'mecanica',
    title: 'Mecânica e Funcionamento',
    items: [
      { id: 'motor', label: 'Motor (ruídos anormais)', status: 'ok' },
      { id: 'freios', label: 'Freios', status: 'ok' },
      { id: 'embreagem', label: 'Embreagem', status: 'ok' },
      { id: 'direcao', label: 'Direção', status: 'ok' },
      { id: 'suspensao', label: 'Suspensão', status: 'ok' },
      { id: 'nivel_oleo', label: 'Nível de óleo', status: 'ok' },
      { id: 'nivel_agua', label: 'Nível de água', status: 'ok' },
    ],
  },
  {
    id: 'acessorios',
    title: 'Acessórios e Documentação',
    items: [
      { id: 'chave_reserva', label: 'Chave reserva', status: 'ok' },
      { id: 'manual_proprietario', label: 'Manual do proprietário', status: 'ok' },
      { id: 'triangulo', label: 'Triângulo', status: 'ok' },
      { id: 'macaco', label: 'Macaco', status: 'ok' },
      { id: 'chave_roda', label: 'Chave de roda', status: 'ok' },
      { id: 'extintor', label: 'Extintor', status: 'ok' },
      { id: 'documento_veiculo', label: 'Documento do veículo', status: 'ok' },
    ],
  },
];

interface InspectionChecklistProps {
  checklist: ChecklistCategory[];
  onChange: (checklist: ChecklistCategory[]) => void;
  readOnly?: boolean;
}

export function InspectionChecklist({
  checklist,
  onChange,
  readOnly = false,
}: InspectionChecklistProps) {
  const handleStatusChange = (
    categoryId: string,
    itemId: string,
    status: ChecklistStatus
  ) => {
    const updated = checklist.map((category) => {
      if (category.id === categoryId) {
        return {
          ...category,
          items: category.items.map((item) =>
            item.id === itemId ? { ...item, status } : item
          ),
        };
      }
      return category;
    });
    onChange(updated);
  };

  const getStatusIcon = (status: ChecklistStatus) => {
    switch (status) {
      case 'ok':
        return <Check className="h-4 w-4 text-success" />;
      case 'not_ok':
        return <X className="h-4 w-4 text-destructive" />;
      case 'not_applicable':
        return <Minus className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getStatusLabel = (status: ChecklistStatus) => {
    switch (status) {
      case 'ok':
        return 'OK';
      case 'not_ok':
        return 'Problema';
      case 'not_applicable':
        return 'N/A';
    }
  };

  // Calculate summary
  const summary = checklist.reduce(
    (acc, category) => {
      category.items.forEach((item) => {
        acc[item.status]++;
      });
      return acc;
    },
    { ok: 0, not_ok: 0, not_applicable: 0 } as Record<ChecklistStatus, number>
  );

  return (
    <div className="space-y-4">
      {/* Summary */}
      <div className="flex flex-wrap gap-4 p-3 bg-muted/50 rounded-lg text-sm">
        <div className="flex items-center gap-2">
          <Check className="h-4 w-4 text-success" />
          <span className="font-medium">{summary.ok}</span>
          <span className="text-muted-foreground">OK</span>
        </div>
        <div className="flex items-center gap-2">
          <X className="h-4 w-4 text-destructive" />
          <span className="font-medium">{summary.not_ok}</span>
          <span className="text-muted-foreground">Problemas</span>
        </div>
        <div className="flex items-center gap-2">
          <Minus className="h-4 w-4 text-muted-foreground" />
          <span className="font-medium">{summary.not_applicable}</span>
          <span className="text-muted-foreground">N/A</span>
        </div>
      </div>

      {/* Categories */}
      <div className="grid gap-4">
        {checklist.map((category) => (
          <Card key={category.id}>
            <CardHeader className="py-3 px-4">
              <CardTitle className="text-base font-medium">
                {category.title}
              </CardTitle>
            </CardHeader>
            <CardContent className="py-2 px-4">
              <div className="space-y-2">
                {category.items.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between py-2 border-b last:border-0"
                  >
                    <Label
                      htmlFor={`${category.id}-${item.id}`}
                      className="text-sm font-normal flex-1"
                    >
                      {item.label}
                    </Label>
                    {readOnly ? (
                      <div className="flex items-center gap-1.5">
                        {getStatusIcon(item.status)}
                        <span className="text-xs">{getStatusLabel(item.status)}</span>
                      </div>
                    ) : (
                      <RadioGroup
                        id={`${category.id}-${item.id}`}
                        value={item.status}
                        onValueChange={(value) =>
                          handleStatusChange(
                            category.id,
                            item.id,
                            value as ChecklistStatus
                          )
                        }
                        className="flex gap-1"
                      >
                        <div className="flex items-center">
                          <RadioGroupItem
                            value="ok"
                            id={`${category.id}-${item.id}-ok`}
                            className="peer sr-only"
                          />
                          <Label
                            htmlFor={`${category.id}-${item.id}-ok`}
                            className={cn(
                              'flex items-center justify-center w-8 h-8 rounded-md border cursor-pointer transition-colors',
                              'peer-data-[state=checked]:bg-success peer-data-[state=checked]:text-success-foreground peer-data-[state=checked]:border-success',
                              item.status === 'ok'
                                ? 'bg-success text-success-foreground border-success'
                                : 'hover:bg-muted'
                            )}
                          >
                            <Check className="h-4 w-4" />
                          </Label>
                        </div>
                        <div className="flex items-center">
                          <RadioGroupItem
                            value="not_ok"
                            id={`${category.id}-${item.id}-not_ok`}
                            className="peer sr-only"
                          />
                          <Label
                            htmlFor={`${category.id}-${item.id}-not_ok`}
                            className={cn(
                              'flex items-center justify-center w-8 h-8 rounded-md border cursor-pointer transition-colors',
                              'peer-data-[state=checked]:bg-destructive peer-data-[state=checked]:text-destructive-foreground peer-data-[state=checked]:border-destructive',
                              item.status === 'not_ok'
                                ? 'bg-destructive text-destructive-foreground border-destructive'
                                : 'hover:bg-muted'
                            )}
                          >
                            <X className="h-4 w-4" />
                          </Label>
                        </div>
                        <div className="flex items-center">
                          <RadioGroupItem
                            value="not_applicable"
                            id={`${category.id}-${item.id}-na`}
                            className="peer sr-only"
                          />
                          <Label
                            htmlFor={`${category.id}-${item.id}-na`}
                            className={cn(
                              'flex items-center justify-center w-8 h-8 rounded-md border cursor-pointer transition-colors',
                              'peer-data-[state=checked]:bg-muted peer-data-[state=checked]:border-muted-foreground',
                              item.status === 'not_applicable'
                                ? 'bg-muted border-muted-foreground'
                                : 'hover:bg-muted'
                            )}
                          >
                            <Minus className="h-4 w-4" />
                          </Label>
                        </div>
                      </RadioGroup>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

// Helper to convert checklist to JSON for storage
export function checklistToJson(checklist: ChecklistCategory[]): Record<string, ChecklistStatus> {
  const result: Record<string, ChecklistStatus> = {};
  checklist.forEach((category) => {
    category.items.forEach((item) => {
      result[item.id] = item.status;
    });
  });
  return result;
}

// Helper to convert JSON back to checklist structure
export function jsonToChecklist(
  json: Record<string, ChecklistStatus> | null | undefined
): ChecklistCategory[] {
  if (!json || Object.keys(json).length === 0) {
    return JSON.parse(JSON.stringify(INSPECTION_CHECKLIST_TEMPLATE));
  }

  return INSPECTION_CHECKLIST_TEMPLATE.map((category) => ({
    ...category,
    items: category.items.map((item) => ({
      ...item,
      status: json[item.id] || item.status,
    })),
  }));
}
