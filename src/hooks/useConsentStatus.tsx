import { useLatestConsent } from '@/hooks/useConsents';
import { TERMS_VERSION, PRIVACY_VERSION } from '@/lib/consentVersions';

export type ConsentStatus = 'valid' | 'missing' | 'revoked' | 'outdated';

export function useConsentStatus() {
  const { data: consent, isLoading } = useLatestConsent();

  let status: ConsentStatus = 'valid';
  if (!isLoading) {
    if (!consent) status = 'missing';
    else if (consent.revoked_at) status = 'revoked';
    else if (
      consent.terms_version !== TERMS_VERSION ||
      consent.privacy_version !== PRIVACY_VERSION
    )
      status = 'outdated';
  }

  return { status, consent, isLoading };
}
