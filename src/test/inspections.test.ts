import { describe, it, expect } from 'vitest';

// ── Types (mirroring useInspections) ──

type InspectionType = 'check_in' | 'check_out';
type FuelLevel = 'empty' | 'quarter' | 'half' | 'three_quarters' | 'full';
type Condition = 'excellent' | 'good' | 'fair' | 'poor';
type ChecklistStatus = 'ok' | 'not_ok' | 'not_applicable';

interface InspectionData {
  vehicle_id: string;
  driver_id: string;
  type: InspectionType;
  km_reading: number;
  fuel_level: FuelLevel;
  exterior_condition: Condition;
  interior_condition: Condition;
  tires_condition?: Condition;
  lights_working: boolean;
  ac_working: boolean;
  damages?: string;
  notes?: string;
  photos?: string[];
  checklist?: Record<string, ChecklistStatus>;
}

// ── Validation helpers ──

function validateInspection(data: Partial<InspectionData>): string[] {
  const errors: string[] = [];
  if (!data.vehicle_id) errors.push('vehicle_id é obrigatório');
  if (!data.driver_id) errors.push('driver_id é obrigatório');
  if (!data.type) errors.push('type é obrigatório');
  if (data.km_reading === undefined || data.km_reading < 0) errors.push('km_reading deve ser >= 0');
  if (!data.fuel_level) errors.push('fuel_level é obrigatório');
  if (!data.exterior_condition) errors.push('exterior_condition é obrigatório');
  if (!data.interior_condition) errors.push('interior_condition é obrigatório');
  return errors;
}

function validateCheckoutKm(checkInKm: number, checkOutKm: number): string | null {
  if (checkOutKm < checkInKm) return 'km de check-out não pode ser menor que check-in';
  return null;
}

function calculateKmDriven(checkInKm: number, checkOutKm: number): number {
  return checkOutKm - checkInKm;
}

function countIssues(checklist: Record<string, ChecklistStatus>): number {
  return Object.values(checklist).filter(s => s === 'not_ok').length;
}

function getChecklistCompleteness(checklist: Record<string, ChecklistStatus>): number {
  const total = Object.keys(checklist).length;
  if (total === 0) return 100;
  const answered = Object.values(checklist).filter(s => s !== undefined).length;
  return Math.round((answered / total) * 100);
}

interface ChecklistCategory {
  id: string;
  title: string;
  items: { id: string; label: string }[];
}

function buildTemplateFromCategories(categories: ChecklistCategory[]): Record<string, ChecklistStatus> {
  const checklist: Record<string, ChecklistStatus> = {};
  for (const cat of categories) {
    for (const item of cat.items) {
      checklist[item.id] = 'ok';
    }
  }
  return checklist;
}

// ── Tests ──

describe('Inspection: validation', () => {
  it('requires all mandatory fields', () => {
    const errors = validateInspection({});
    expect(errors).toContain('vehicle_id é obrigatório');
    expect(errors).toContain('driver_id é obrigatório');
    expect(errors).toContain('type é obrigatório');
    expect(errors).toContain('km_reading deve ser >= 0');
    expect(errors).toContain('fuel_level é obrigatório');
    expect(errors).toContain('exterior_condition é obrigatório');
    expect(errors).toContain('interior_condition é obrigatório');
  });

  it('accepts valid check-in inspection', () => {
    const errors = validateInspection({
      vehicle_id: 'v1', driver_id: 'd1', type: 'check_in',
      km_reading: 45000, fuel_level: 'full',
      exterior_condition: 'good', interior_condition: 'excellent',
    });
    expect(errors).toHaveLength(0);
  });

  it('accepts km_reading of 0', () => {
    const errors = validateInspection({
      vehicle_id: 'v1', driver_id: 'd1', type: 'check_in',
      km_reading: 0, fuel_level: 'half',
      exterior_condition: 'fair', interior_condition: 'fair',
    });
    expect(errors).toHaveLength(0);
  });

  it('rejects negative km_reading', () => {
    const errors = validateInspection({
      vehicle_id: 'v1', driver_id: 'd1', type: 'check_out',
      km_reading: -100, fuel_level: 'quarter',
      exterior_condition: 'good', interior_condition: 'good',
    });
    expect(errors).toContain('km_reading deve ser >= 0');
  });
});

describe('Inspection: check-in/check-out logic', () => {
  it('checkout km must be >= checkin km', () => {
    expect(validateCheckoutKm(45000, 44000)).toBe('km de check-out não pode ser menor que check-in');
  });

  it('equal km is valid (no driving)', () => {
    expect(validateCheckoutKm(45000, 45000)).toBeNull();
  });

  it('calculates km driven correctly', () => {
    expect(calculateKmDriven(45000, 47350)).toBe(2350);
  });

  it('calculates zero km when same reading', () => {
    expect(calculateKmDriven(45000, 45000)).toBe(0);
  });
});

describe('Inspection: fuel levels', () => {
  const FUEL_LEVELS: FuelLevel[] = ['empty', 'quarter', 'half', 'three_quarters', 'full'];
  const FUEL_LABELS: Record<FuelLevel, string> = {
    empty: 'Vazio', quarter: '1/4', half: '1/2', three_quarters: '3/4', full: 'Cheio',
  };

  it('has 5 fuel levels', () => {
    expect(FUEL_LEVELS).toHaveLength(5);
  });

  it('each fuel level has a label', () => {
    FUEL_LEVELS.forEach(level => {
      expect(FUEL_LABELS[level]).toBeDefined();
      expect(FUEL_LABELS[level].length).toBeGreaterThan(0);
    });
  });
});

describe('Inspection: conditions', () => {
  const CONDITIONS: Condition[] = ['excellent', 'good', 'fair', 'poor'];
  const CONDITION_LABELS: Record<Condition, string> = {
    excellent: 'Excelente', good: 'Bom', fair: 'Regular', poor: 'Ruim',
  };

  it('has 4 condition levels', () => {
    expect(CONDITIONS).toHaveLength(4);
  });

  it('each condition has a Portuguese label', () => {
    CONDITIONS.forEach(c => {
      expect(CONDITION_LABELS[c]).toBeDefined();
    });
  });
});

describe('Inspection: checklist', () => {
  const sampleChecklist: Record<string, ChecklistStatus> = {
    'ext_body': 'ok',
    'ext_paint': 'not_ok',
    'ext_glass': 'ok',
    'int_seats': 'not_applicable',
    'int_dashboard': 'ok',
    'mech_engine': 'not_ok',
  };

  it('counts issues (not_ok items)', () => {
    expect(countIssues(sampleChecklist)).toBe(2);
  });

  it('counts zero issues when all ok', () => {
    expect(countIssues({ a: 'ok', b: 'ok', c: 'not_applicable' })).toBe(0);
  });

  it('calculates 100% completeness for answered checklist', () => {
    expect(getChecklistCompleteness(sampleChecklist)).toBe(100);
  });

  it('handles empty checklist', () => {
    expect(getChecklistCompleteness({})).toBe(100);
  });
});

describe('Inspection: checklist templates', () => {
  const categories: ChecklistCategory[] = [
    { id: 'ext', title: 'Exterior', items: [{ id: 'ext_body', label: 'Carroceria' }, { id: 'ext_paint', label: 'Pintura' }] },
    { id: 'int', title: 'Interior', items: [{ id: 'int_seats', label: 'Bancos' }] },
    { id: 'mech', title: 'Mecânica', items: [{ id: 'mech_engine', label: 'Motor' }, { id: 'mech_brakes', label: 'Freios' }] },
  ];

  it('builds checklist from categories with all items set to ok', () => {
    const checklist = buildTemplateFromCategories(categories);
    expect(Object.keys(checklist)).toHaveLength(5);
    expect(checklist['ext_body']).toBe('ok');
    expect(checklist['int_seats']).toBe('ok');
    expect(checklist['mech_brakes']).toBe('ok');
  });

  it('handles empty categories', () => {
    const checklist = buildTemplateFromCategories([]);
    expect(Object.keys(checklist)).toHaveLength(0);
  });

  it('preserves all item ids from template', () => {
    const checklist = buildTemplateFromCategories(categories);
    const allIds = categories.flatMap(c => c.items.map(i => i.id));
    allIds.forEach(id => {
      expect(checklist).toHaveProperty(id);
    });
  });
});

describe('Inspection: type labels', () => {
  it('check_in maps to Entrega', () => {
    const TYPES: Record<InspectionType, string> = { check_in: 'Check-in (Entrega)', check_out: 'Check-out (Devolução)' };
    expect(TYPES.check_in).toContain('Entrega');
    expect(TYPES.check_out).toContain('Devolução');
  });
});
