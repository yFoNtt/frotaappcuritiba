import { useCallback, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useProfile } from './useProfile';

type OnboardingUpdate = {
  onboarding_tour_seen_at?: string | null;
  onboarding_dismissed_at?: string | null;
};

/**
 * Estado de boas-vindas persistido na conta do usuário (não no navegador),
 * para que o passo a passo e a lista de tarefas apareçam apenas uma vez.
 */
export function useOnboarding() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { data: profile, isLoading } = useProfile();
  const [replay, setReplay] = useState(false);

  const mutation = useMutation({
    mutationFn: async (updates: OnboardingUpdate) => {
      if (!user) throw new Error('Not authenticated');
      const { error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('user_id', user.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile', user?.id] });
    },
    onError: (error) => {
      console.error('Error updating onboarding state:', error);
    },
  });

  const { mutate } = mutation;

  const tourSeen = Boolean(profile?.onboarding_tour_seen_at);
  const dismissed = Boolean(profile?.onboarding_dismissed_at);
  const ready = !isLoading && !!profile;

  const tourOpen = ready && (replay || !tourSeen);

  const finishTour = useCallback(() => {
    setReplay(false);
    if (!tourSeen) {
      mutate({ onboarding_tour_seen_at: new Date().toISOString() });
    }
  }, [mutate, tourSeen]);

  const replayTour = useCallback(() => setReplay(true), []);

  const dismissChecklist = useCallback(() => {
    if (!dismissed) {
      mutate({ onboarding_dismissed_at: new Date().toISOString() });
    }
  }, [mutate, dismissed]);

  return {
    ready,
    tourOpen,
    tourSeen,
    dismissed,
    finishTour,
    replayTour,
    dismissChecklist,
  };
}
