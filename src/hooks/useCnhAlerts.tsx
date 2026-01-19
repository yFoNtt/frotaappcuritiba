import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export interface CnhAlert {
  id: string;
  alert_type: '30_days' | '15_days' | '7_days' | 'expired';
  sent_at: string;
  cnh_expiry: string;
  read_at: string | null;
}

export function useCnhAlerts() {
  const { user, role } = useAuth();
  const [alerts, setAlerts] = useState<CnhAlert[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user || role !== 'motorista') {
      setAlerts([]);
      setUnreadCount(0);
      setLoading(false);
      return;
    }

    fetchAlerts();
  }, [user, role]);

  const fetchAlerts = async () => {
    if (!user) return;

    setLoading(true);
    const { data, error } = await supabase
      .from('cnh_alerts')
      .select('*')
      .eq('user_id', user.id)
      .order('sent_at', { ascending: false })
      .limit(10);

    if (error) {
      console.error('Error fetching CNH alerts:', error);
    } else {
      setAlerts(data as CnhAlert[]);
      setUnreadCount(data?.filter(a => !a.read_at).length || 0);
    }
    setLoading(false);
  };

  const markAsRead = async (alertId: string) => {
    const { error } = await supabase
      .from('cnh_alerts')
      .update({ read_at: new Date().toISOString() })
      .eq('id', alertId);

    if (!error) {
      setAlerts(prev => 
        prev.map(a => a.id === alertId ? { ...a, read_at: new Date().toISOString() } : a)
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    }
  };

  const markAllAsRead = async () => {
    if (!user) return;

    const { error } = await supabase
      .from('cnh_alerts')
      .update({ read_at: new Date().toISOString() })
      .eq('user_id', user.id)
      .is('read_at', null);

    if (!error) {
      setAlerts(prev => prev.map(a => ({ ...a, read_at: a.read_at || new Date().toISOString() })));
      setUnreadCount(0);
    }
  };

  const getAlertMessage = (alert: CnhAlert): { title: string; description: string; severity: 'warning' | 'error' } => {
    const expiryDate = new Date(alert.cnh_expiry).toLocaleDateString('pt-BR');
    
    switch (alert.alert_type) {
      case 'expired':
        return {
          title: 'CNH Vencida!',
          description: `Sua CNH venceu em ${expiryDate}. Renove sua habilitação imediatamente.`,
          severity: 'error'
        };
      case '7_days':
        return {
          title: 'CNH vence em 7 dias!',
          description: `Sua CNH vence em ${expiryDate}. Renove sua habilitação o mais rápido possível.`,
          severity: 'error'
        };
      case '15_days':
        return {
          title: 'CNH vence em 15 dias',
          description: `Sua CNH vence em ${expiryDate}. Agende a renovação da sua habilitação.`,
          severity: 'warning'
        };
      case '30_days':
        return {
          title: 'CNH vence em 30 dias',
          description: `Sua CNH vence em ${expiryDate}. Considere iniciar o processo de renovação.`,
          severity: 'warning'
        };
      default:
        return {
          title: 'Alerta de CNH',
          description: `Sua CNH vence em ${expiryDate}.`,
          severity: 'warning'
        };
    }
  };

  return {
    alerts,
    unreadCount,
    loading,
    fetchAlerts,
    markAsRead,
    markAllAsRead,
    getAlertMessage
  };
}