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
    async (
      file: File,
      options?: {
        maxAttempts?: number;
        onRetry?: (attempt: number, maxAttempts: number, delayMs: number) => void;
        onProgress?: (percent: number, loaded: number, total: number) => void;
      },
    ): Promise<AttachmentInput | null> => {
      if (!conversationId || !user) return null;
      const maxAttempts = options?.maxAttempts ?? 3;
      const ext = file.name.split('.').pop() || 'bin';
      const safeBase = file.name.replace(/[^a-zA-Z0-9._-]/g, '_').slice(0, 80);
      const contentType = file.type || `application/${ext}`;

      // Errors we should NOT retry (auth/permission/payload problems)
      const isFatalStatus = (status: number) =>
        status === 401 || status === 403 || status === 413 || status === 415;
      const isFatalMsg = (msg: string) => {
        const m = msg.toLowerCase();
        return (
          m.includes('unauthorized') ||
          m.includes('forbidden') ||
          m.includes('payload too large') ||
          m.includes('mime')
        );
      };

      // Upload via XHR using a signed upload URL → gives us real progress events
      const uploadOnce = (path: string): Promise<{ ok: true } | { ok: false; status: number; message: string; fatal: boolean }> =>
        new Promise(async (resolve) => {
          const { data: signed, error: signErr } = await supabase.storage
            .from('chat-attachments')
            .createSignedUploadUrl(path);

          if (signErr || !signed) {
            const msg = signErr?.message || 'Falha ao criar URL de upload';
            resolve({ ok: false, status: 0, message: msg, fatal: isFatalMsg(msg) });
            return;
          }

          const xhr = new XMLHttpRequest();
          xhr.open('PUT', signed.signedUrl, true);
          xhr.setRequestHeader('Content-Type', contentType);
          xhr.setRequestHeader('x-upsert', 'false');
          xhr.upload.onprogress = (e) => {
            if (e.lengthComputable) {
              const pct = Math.round((e.loaded / e.total) * 100);
              options?.onProgress?.(pct, e.loaded, e.total);
            }
          };
          xhr.onload = () => {
            if (xhr.status >= 200 && xhr.status < 300) {
              options?.onProgress?.(100, file.size, file.size);
              resolve({ ok: true });
            } else {
              resolve({
                ok: false,
                status: xhr.status,
                message: xhr.responseText || `HTTP ${xhr.status}`,
                fatal: isFatalStatus(xhr.status),
              });
            }
          };
          xhr.onerror = () =>
            resolve({ ok: false, status: 0, message: 'Erro de rede', fatal: false });
          xhr.ontimeout = () =>
            resolve({ ok: false, status: 0, message: 'Timeout', fatal: false });
          xhr.send(file);
        });

      let lastError: { status: number; message: string } | null = null;
      for (let attempt = 1; attempt <= maxAttempts; attempt++) {
        // Reset progress at the start of each attempt
        options?.onProgress?.(0, 0, file.size);

        // Fresh path per attempt to avoid conflicts with partial uploads
        const path = `${conversationId}/${Date.now()}-${crypto.randomUUID().slice(0, 8)}-${safeBase}`;
        const result = await uploadOnce(path);

        if (result.ok === true) {
          return {
            path,
            name: file.name,
            mime: contentType,
            size: file.size,
          };
        }

        const failure = result;
        lastError = { status: failure.status, message: failure.message };
        console.warn(
          `[useConversation] upload attempt ${attempt}/${maxAttempts} failed`,
          failure,
        );

        if (failure.fatal || attempt === maxAttempts) break;

        // Exponential backoff with jitter: ~500ms, 1500ms, 3500ms
        const base = 500 * Math.pow(2, attempt - 1) + (attempt - 1) * 500;
        const jitter = base * 0.3 * (Math.random() * 2 - 1);
        const delayMs = Math.max(200, Math.round(base + jitter));
        options?.onRetry?.(attempt + 1, maxAttempts, delayMs);
        await new Promise((r) => setTimeout(r, delayMs));
      }

      console.error('[useConversation] upload failed after retries', lastError);
      toast.error('Não foi possível enviar o anexo. Tente novamente.');
      return null;
    },
    [conversationId, user],
  );

  const send = useCallback(
    async (content: string, attachment?: AttachmentInput | null): Promise<boolean> => {
      if (!user || !conversationId) return false;
      const text = content.trim();
      if (!text && !attachment) return false;

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
        return false;
      }
      return true;
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
