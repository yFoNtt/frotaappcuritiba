import { describe, it, expect } from 'vitest';
import { INACTIVITY_TIMEOUT_MS, INACTIVITY_WARNING_MS } from '@/hooks/useInactivityTimeout';

type ProfileLike = {
  onboarding_tour_seen_at: string | null;
  onboarding_dismissed_at: string | null;
};

function shouldOpenTour(profile: ProfileLike | null, ready: boolean, replay = false) {
  return ready && !!profile && (replay || !profile.onboarding_tour_seen_at);
}

function shouldShowChecklist(profile: ProfileLike | null, ready: boolean) {
  return ready && !!profile && !profile.onboarding_dismissed_at;
}

describe('inatividade', () => {
  it('desconecta após 60 minutos', () => {
    expect(INACTIVITY_TIMEOUT_MS).toBe(60 * 60 * 1000);
  });

  it('avisa 1 minuto antes do fim', () => {
    expect(INACTIVITY_WARNING_MS).toBe(60 * 1000);
    expect(INACTIVITY_WARNING_MS).toBeLessThan(INACTIVITY_TIMEOUT_MS);
  });
});

describe('estado de onboarding vindo do perfil', () => {
  const novo: ProfileLike = { onboarding_tour_seen_at: null, onboarding_dismissed_at: null };
  const antigo: ProfileLike = {
    onboarding_tour_seen_at: '2026-01-01T00:00:00Z',
    onboarding_dismissed_at: '2026-01-01T00:00:00Z',
  };

  it('não abre nada enquanto o perfil carrega', () => {
    expect(shouldOpenTour(null, false)).toBe(false);
    expect(shouldShowChecklist(null, false)).toBe(false);
  });

  it('abre o tour apenas no primeiro acesso', () => {
    expect(shouldOpenTour(novo, true)).toBe(true);
    expect(shouldOpenTour(antigo, true)).toBe(false);
  });

  it('reabre o tour quando o usuário pede para rever', () => {
    expect(shouldOpenTour(antigo, true, true)).toBe(true);
  });

  it('esconde a lista depois de concluída ou dispensada', () => {
    expect(shouldShowChecklist(novo, true)).toBe(true);
    expect(shouldShowChecklist(antigo, true)).toBe(false);
  });
});
