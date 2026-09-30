import { describe, expect, it } from 'vitest';
import { profileCompletionSchema } from '@/components/auth/profileCompletionSchema';
import { isProfileComplete, type Profile } from '@/hooks/useProfile';

const profile = {
  id: 'profile-1',
  user_id: 'user-1',
  full_name: null,
  phone: null,
  whatsapp: null,
  company_name: null,
  document_type: null,
  document_number: null,
  cnh_number: null,
  cnh_expiry: null,
  city: null,
  state: null,
  onboarding_tour_seen_at: null,
  onboarding_dismissed_at: null,
  notification_preferences: null,
  must_change_password: false,
  created_at: '2026-01-01',
  updated_at: '2026-01-01',
} satisfies Profile;

describe('profile completion', () => {
  it('requires document fields for locador', () => {
    expect(isProfileComplete(profile, 'locador')).toBe(false);
    expect(profileCompletionSchema.safeParse({ role: 'locador', document: '' }).success).toBe(false);
  });

  it('accepts a valid locador document', () => {
    const complete = { ...profile, document_type: 'cpf', document_number: '52998224725' };
    expect(isProfileComplete(complete, 'locador')).toBe(true);
    expect(profileCompletionSchema.safeParse({ role: 'locador', document: '529.982.247-25' }).success).toBe(true);
  });

  it('requires CNH number and expiry for motorista', () => {
    expect(isProfileComplete(profile, 'motorista')).toBe(false);
    expect(profileCompletionSchema.safeParse({ role: 'motorista', cnh: '', cnhExpiry: '' }).success).toBe(false);
  });

  it('exempts administrators', () => {
    expect(isProfileComplete(null, 'admin')).toBe(true);
  });
});