import { useEffect, useState, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

export type ChatRole = 'locador' | 'motorista';

export interface Conversation {
  id: string;
  locador_id: string;
  driver_id: string;
  last_message_preview: string | null;
  last_message_at: string;
  unread_locador: number;
  unread_motorista: number;
  created_at: string;
  updated_at: string;
  // joined
  driver?: { id: string; name: string; user_id: string | null } | null;
  locador?: { user_id: string; full_name: string | null } | null;
}

export interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  sender_role: ChatRole;
  content: string | null;
  attachment_url: string | null;
  attachment_path: string | null;
  attachment_name: string | null;
  attachment_mime: string | null;
  attachment_size: number | null;
  read_at: string | null;
  created_at: string;
}

export interface AttachmentInput {
  path: string;
  name: string;
  mime: string;
  size: number;
}

/**
 * Lists conversations for the current user (locador or motorista) with realtime updates.
 */
export function useConversations(role: ChatRole) {
  const { user } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!user) return;
    setLoading(true);

    const { data, error } = await supabase
      .from('conversations')
      .select('*')
      .order('last_message_at', { ascending: false });

    if (error) {
      console.error('[useConversations] load error', error);
      toast.error('Erro ao carregar conversas');
      setLoading(false);
      return;
    }

    const convs = (data ?? []) as unknown as Conversation[];

    // Hydrate driver info (name) for display
    const driverIds = Array.from(new Set(convs.map((c) => c.driver_id)));
    if (driverIds.length > 0) {
      const { data: drivers } = await supabase
        .from('drivers')
        .select('id,name,user_id')
        .in('id', driverIds);
      const byId = new Map((drivers ?? []).map((d: any) => [d.id, d]));
      convs.forEach((c) => {
        c.driver = byId.get(c.driver_id) ?? null;
      });
    }

    setConversations(convs);
    setLoading(false);
  }, [user, role]);

  useEffect(() => {
    load();
  }, [load]);

  // Realtime: any change in conversations involving this user reloads the list
  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel(`conversations-${user.id}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'conversations' },
        () => {
          load();
        },
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, load]);

  return { conversations, loading, reload: load };
}

/**
 * Manages messages of a single conversation: load, send, mark as read, realtime.
 */
export function useConversation(conversationId: string | null, role: ChatRole) {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const seenIds = useRef<Set<string>>(new Set());

  const load = useCallback(async () => {
    if (!conversationId) {
      setMessages([]);
      return;
    }
    setLoading(true);
    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('[useConversation] load error', error);
      toast.error('Erro ao carregar mensagens');
      setLoading(false);
      return;
    }
    const list = (data ?? []) as unknown as Message[];
    seenIds.current = new Set(list.map((m) => m.id));
    setMessages(list);
    setLoading(false);
  }, [conversationId]);

  useEffect(() => {
    load();
  }, [load]);

  // Realtime new messages
  useEffect(() => {
    if (!conversationId) return;
    const channel = supabase
      .channel(`messages-${conversationId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => {
          const m = payload.new as Message;
          if (seenIds.current.has(m.id)) return;
          seenIds.current.add(m.id);
          setMessages((prev) => [...prev, m]);
        },
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => {
          const m = payload.new as Message;
          setMessages((prev) => prev.map((x) => (x.id === m.id ? m : x)));
        },
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [conversationId]);

  const uploadAttachment = useCallback(
    async (file: File): Promise<AttachmentInput | null> => {
      if (!conversationId || !user) return null;
      const ext = file.name.split('.').pop() || 'bin';
      const safeBase = file.name.replace(/[^a-zA-Z0-9._-]/g, '_').slice(0, 80);
      const path = `${conversationId}/${Date.now()}-${crypto.randomUUID().slice(0, 8)}-${safeBase}`;

      const { error } = await supabase.storage
        .from('chat-attachments')
        .upload(path, file, {
          cacheControl: '3600',
          upsert: false,
          contentType: file.type || `application/${ext}`,
        });

      if (error) {
        console.error('[useConversation] upload error', error);
        toast.error('Erro ao enviar anexo');
        return null;
      }

      return {
        path,
        name: file.name,
        mime: file.type || 'application/octet-stream',
        size: file.size,
      };
    },
    [conversationId, user],
  );

  const send = useCallback(
    async (content: string, attachment?: AttachmentInput | null) => {
      if (!user || !conversationId) return;
      const text = content.trim();
      if (!text && !attachment) return;

      setSending(true);
      const { error } = await supabase.from('messages').insert({
        conversation_id: conversationId,
        sender_id: user.id,
        sender_role: role,
        content: text || null,
        attachment_path: attachment?.path ?? null,
        attachment_name: attachment?.name ?? null,
        attachment_mime: attachment?.mime ?? null,
        attachment_size: attachment?.size ?? null,
      });
      setSending(false);

      if (error) {
        console.error('[useConversation] send error', error);
        toast.error('Erro ao enviar mensagem');
      }
    },
    [user, conversationId, role],
  );

  const markAsRead = useCallback(async () => {
    if (!user || !conversationId) return;

    const otherRole: ChatRole = role === 'locador' ? 'motorista' : 'locador';
    const unreadIds = messages
      .filter((m) => !m.read_at && m.sender_role === otherRole)
      .map((m) => m.id);

    if (unreadIds.length > 0) {
      await supabase
        .from('messages')
        .update({ read_at: new Date().toISOString() })
        .in('id', unreadIds);
    }

    // Reset unread counter on conversation
    const counterField = role === 'locador' ? 'unread_locador' : 'unread_motorista';
    await supabase
      .from('conversations')
      .update({ [counterField]: 0 })
      .eq('id', conversationId);
  }, [user, conversationId, role, messages]);

  return { messages, loading, sending, send, uploadAttachment, markAsRead, reload: load };
}
