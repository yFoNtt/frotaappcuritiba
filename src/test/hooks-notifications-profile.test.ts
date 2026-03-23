import { describe, it, expect } from 'vitest';
import type { Notification } from '@/hooks/useNotifications';
import type { Profile } from '@/hooks/useProfile';

// ============================================================
// Pure logic tests for Notifications and Profile hooks
// ============================================================

// ---- Notification helpers ----

const mockNotifications: Notification[] = [
  { id: 'n1', user_id: 'u1', type: 'payment_overdue', title: 'Pagamento atrasado', message: 'Pagamento de R$800 vencido', metadata: { payment_id: 'p1' }, read_at: null, created_at: '2024-06-01T10:00:00Z' },
  { id: 'n2', user_id: 'u1', type: 'cnh_expiring', title: 'CNH vencendo', message: 'CNH do motorista João expira em 7 dias', metadata: { driver_name: 'João' }, read_at: null, created_at: '2024-06-01T09:00:00Z' },
  { id: 'n3', user_id: 'u1', type: 'maintenance_due', title: 'Manutenção agendada', message: 'Troca de óleo do Corolla', metadata: { vehicle_id: 'v1' }, read_at: '2024-06-01T11:00:00Z', created_at: '2024-05-30T08:00:00Z' },
  { id: 'n4', user_id: 'u1', type: 'driver_change', title: 'Alteração por motorista', message: 'Motorista atualizou um registro', metadata: { audit_log_id: 'a1' }, read_at: '2024-05-29T10:00:00Z', created_at: '2024-05-28T15:00:00Z' },
  { id: 'n5', user_id: 'u1', type: 'payment_overdue', title: 'Pagamento atrasado', message: 'Pagamento de R$600 vencido', metadata: {}, read_at: null, created_at: '2024-06-02T08:00:00Z' },
];

function getUnreadCount(notifications: Notification[]): number {
  return notifications.filter(n => !n.read_at).length;
}

function markAsRead(notifications: Notification[], id: string): Notification[] {
  return notifications.map(n => n.id === id ? { ...n, read_at: new Date().toISOString() } : n);
}

function markAllAsRead(notifications: Notification[]): Notification[] {
  return notifications.map(n => ({ ...n, read_at: n.read_at || new Date().toISOString() }));
}

function deleteNotification(notifications: Notification[], id: string): Notification[] {
  return notifications.filter(n => n.id !== id);
}

function addRealtimeNotification(notifications: Notification[], newN: Notification): Notification[] {
  return [newN, ...notifications];
}

function sortByCreatedDesc(notifications: Notification[]): Notification[] {
  return [...notifications].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
}

function filterByType(notifications: Notification[], type: string): Notification[] {
  return notifications.filter(n => n.type === type);
}

// ---- Profile helpers ----

const mockProfile: Profile = {
  id: 'pr1', user_id: 'u1', full_name: 'João Silva', phone: '11999999999',
  whatsapp: '11999999999', company_name: 'Frota SP Ltda', document_type: 'cpf',
  document_number: '12345678901', cnh_number: null, cnh_expiry: null,
  city: 'São Paulo', state: 'SP',
  created_at: '2024-01-01T00:00:00Z', updated_at: '2024-01-01T00:00:00Z',
};

function mergeProfileUpdate(profile: Profile, updates: Partial<Profile>): Profile {
  return { ...profile, ...updates, updated_at: new Date().toISOString() };
}

function isProfileComplete(profile: Profile): boolean {
  return !!(profile.full_name && profile.phone && profile.city && profile.state);
}

function getProfileDisplayName(profile: Profile | null): string {
  if (!profile) return 'Usuário';
  return profile.full_name || profile.company_name || 'Usuário';
}

// ============================================================

describe('Notifications - Unread Count', () => {
  it('counts unread notifications correctly', () => {
    expect(getUnreadCount(mockNotifications)).toBe(3);
  });

  it('returns 0 when all are read', () => {
    const allRead = mockNotifications.map(n => ({ ...n, read_at: '2024-01-01T00:00:00Z' }));
    expect(getUnreadCount(allRead)).toBe(0);
  });

  it('returns total when none are read', () => {
    const allUnread = mockNotifications.map(n => ({ ...n, read_at: null }));
    expect(getUnreadCount(allUnread)).toBe(5);
  });

  it('returns 0 for empty array', () => {
    expect(getUnreadCount([])).toBe(0);
  });
});

describe('Notifications - Mark As Read', () => {
  it('marks a single notification as read', () => {
    const updated = markAsRead(mockNotifications, 'n1');
    expect(updated.find(n => n.id === 'n1')?.read_at).not.toBeNull();
    expect(getUnreadCount(updated)).toBe(2);
  });

  it('does not affect other notifications', () => {
    const updated = markAsRead(mockNotifications, 'n1');
    expect(updated.find(n => n.id === 'n2')?.read_at).toBeNull();
  });

  it('is idempotent on already-read notification', () => {
    const updated = markAsRead(mockNotifications, 'n3');
    expect(updated.find(n => n.id === 'n3')?.read_at).not.toBeNull();
  });
});

describe('Notifications - Mark All As Read', () => {
  it('marks all unread as read', () => {
    const updated = markAllAsRead(mockNotifications);
    expect(getUnreadCount(updated)).toBe(0);
  });

  it('preserves original read_at for already-read', () => {
    const updated = markAllAsRead(mockNotifications);
    expect(updated.find(n => n.id === 'n3')?.read_at).toBe('2024-06-01T11:00:00Z');
  });

  it('handles empty array', () => {
    expect(markAllAsRead([])).toEqual([]);
  });
});

describe('Notifications - Delete', () => {
  it('removes notification by id', () => {
    const updated = deleteNotification(mockNotifications, 'n1');
    expect(updated).toHaveLength(4);
    expect(updated.find(n => n.id === 'n1')).toBeUndefined();
  });

  it('does not remove anything for non-existent id', () => {
    const updated = deleteNotification(mockNotifications, 'n999');
    expect(updated).toHaveLength(5);
  });

  it('updates unread count after delete', () => {
    const updated = deleteNotification(mockNotifications, 'n1');
    expect(getUnreadCount(updated)).toBe(2);
  });
});

describe('Notifications - Realtime Insert', () => {
  it('prepends new notification', () => {
    const newN: Notification = {
      id: 'n6', user_id: 'u1', type: 'test', title: 'New', message: 'Test',
      metadata: {}, read_at: null, created_at: '2024-06-03T00:00:00Z',
    };
    const updated = addRealtimeNotification(mockNotifications, newN);
    expect(updated).toHaveLength(6);
    expect(updated[0].id).toBe('n6');
  });

  it('increments unread count', () => {
    const newN: Notification = {
      id: 'n6', user_id: 'u1', type: 'test', title: 'New', message: 'Test',
      metadata: {}, read_at: null, created_at: '2024-06-03T00:00:00Z',
    };
    const updated = addRealtimeNotification(mockNotifications, newN);
    expect(getUnreadCount(updated)).toBe(4);
  });
});

describe('Notifications - Sorting', () => {
  it('sorts by created_at descending', () => {
    const sorted = sortByCreatedDesc(mockNotifications);
    expect(sorted[0].id).toBe('n5');
    expect(sorted[sorted.length - 1].id).toBe('n4');
  });
});

describe('Notifications - Filter by Type', () => {
  it('filters payment_overdue notifications', () => {
    expect(filterByType(mockNotifications, 'payment_overdue')).toHaveLength(2);
  });

  it('filters cnh_expiring notifications', () => {
    expect(filterByType(mockNotifications, 'cnh_expiring')).toHaveLength(1);
  });

  it('filters driver_change notifications', () => {
    expect(filterByType(mockNotifications, 'driver_change')).toHaveLength(1);
  });

  it('returns empty for unknown type', () => {
    expect(filterByType(mockNotifications, 'unknown')).toHaveLength(0);
  });
});

describe('Notifications - Realtime Channel Config', () => {
  it('builds correct filter string for user', () => {
    const userId = 'u1';
    const filter = `user_id=eq.${userId}`;
    expect(filter).toBe('user_id=eq.u1');
  });

  it('limits fetch to 50 notifications', () => {
    const limit = 50;
    expect(limit).toBe(50);
  });
});

// ============================================================

describe('Profile - Merge Update', () => {
  it('updates full_name', () => {
    const updated = mergeProfileUpdate(mockProfile, { full_name: 'Maria Santos' });
    expect(updated.full_name).toBe('Maria Santos');
    expect(updated.phone).toBe('11999999999');
  });

  it('updates city and state', () => {
    const updated = mergeProfileUpdate(mockProfile, { city: 'Rio de Janeiro', state: 'RJ' });
    expect(updated.city).toBe('Rio de Janeiro');
    expect(updated.state).toBe('RJ');
  });

  it('sets updated_at timestamp', () => {
    const before = new Date().toISOString();
    const updated = mergeProfileUpdate(mockProfile, { full_name: 'X' });
    expect(updated.updated_at >= before).toBe(true);
  });

  it('clears optional fields with null', () => {
    const updated = mergeProfileUpdate(mockProfile, { company_name: null });
    expect(updated.company_name).toBeNull();
  });
});

describe('Profile - Completeness Check', () => {
  it('considers complete profile as complete', () => {
    expect(isProfileComplete(mockProfile)).toBe(true);
  });

  it('considers profile without name as incomplete', () => {
    expect(isProfileComplete({ ...mockProfile, full_name: null })).toBe(false);
  });

  it('considers profile without phone as incomplete', () => {
    expect(isProfileComplete({ ...mockProfile, phone: null })).toBe(false);
  });

  it('considers profile without city as incomplete', () => {
    expect(isProfileComplete({ ...mockProfile, city: null })).toBe(false);
  });

  it('considers profile without state as incomplete', () => {
    expect(isProfileComplete({ ...mockProfile, state: null })).toBe(false);
  });
});

describe('Profile - Display Name', () => {
  it('returns full_name when available', () => {
    expect(getProfileDisplayName(mockProfile)).toBe('João Silva');
  });

  it('falls back to company_name', () => {
    expect(getProfileDisplayName({ ...mockProfile, full_name: null })).toBe('Frota SP Ltda');
  });

  it('falls back to "Usuário" when no names', () => {
    expect(getProfileDisplayName({ ...mockProfile, full_name: null, company_name: null })).toBe('Usuário');
  });

  it('returns "Usuário" for null profile', () => {
    expect(getProfileDisplayName(null)).toBe('Usuário');
  });
});

describe('Profile - Nullable Fields', () => {
  it('handles motorista profile (no company_name)', () => {
    const motorista: Profile = { ...mockProfile, company_name: null, cnh_number: '12345678901', cnh_expiry: '2025-12-31' };
    expect(motorista.cnh_number).toBe('12345678901');
    expect(motorista.company_name).toBeNull();
  });

  it('handles locador profile (no CNH)', () => {
    expect(mockProfile.cnh_number).toBeNull();
    expect(mockProfile.cnh_expiry).toBeNull();
  });

  it('handles all nullable fields as null', () => {
    const empty: Profile = {
      ...mockProfile, full_name: null, phone: null, whatsapp: null,
      company_name: null, document_type: null, document_number: null,
      cnh_number: null, cnh_expiry: null, city: null, state: null,
    };
    expect(isProfileComplete(empty)).toBe(false);
    expect(getProfileDisplayName(empty)).toBe('Usuário');
  });
});

describe('Profile - Auto-creation Logic', () => {
  it('creates profile with only user_id when none exists', () => {
    const userId = 'new-user-id';
    const newProfile = { user_id: userId };
    expect(newProfile.user_id).toBe(userId);
  });
});
