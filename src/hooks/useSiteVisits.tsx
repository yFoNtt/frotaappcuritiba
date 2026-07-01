import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export interface SiteVisit {
  id: string;
  ip_address: string;
  path: string;
  referrer: string | null;
  user_agent: string | null;
  is_mobile: boolean | null;
  city: string | null;
  region: string | null;
  country: string | null;
  utm_source: string | null;
  utm_medium: string | null;
  utm_campaign: string | null;
  created_at: string;
}

// Traz até 2000 visitas mais recentes; agregações (por dia, por cidade, etc.)
// são calculadas no cliente em Visits.tsx, no mesmo padrão de Metrics.tsx.
export function useSiteVisits() {
  const { role } = useAuth();

  return useQuery({
    queryKey: ['admin', 'site-visits'],
    queryFn: async (): Promise<SiteVisit[]> => {
      const { data, error } = await supabase
        .from('site_visits' as never)
        .select('*')
        .order('created_at', { ascending: false })
        .limit(2000);
      if (error) throw error;
      return (data as unknown as SiteVisit[]) ?? [];
    },
    enabled: role === 'admin',
  });
}
