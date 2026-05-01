import { useEffect, useRef, useState, FormEvent } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { MessageSquare, Send, ArrowLeft } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useConversation, useConversations, type ChatRole } from '@/hooks/useChat';
import { format, isToday, isYesterday } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';

interface Props {
  role: ChatRole;
}

function formatDay(iso: string) {
  const d = new Date(iso);
  if (isToday(d)) return 'Hoje';
  if (isYesterday(d)) return 'Ontem';
  return format(d, "dd 'de' MMMM", { locale: ptBR });
}

export function ChatWindow({ role }: Props) {
  const { user } = useAuth();
  const { conversations, loading: loadingList } = useConversations(role);
  const [activeId, setActiveId] = useState<string | null>(null);
  const { messages, loading, sending, send, markAsRead } = useConversation(activeId, role);
  const [text, setText] = useState('');
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const [showListMobile, setShowListMobile] = useState(true);

  // Auto-select first conversation on desktop
  useEffect(() => {
    if (!activeId && conversations.length > 0) {
      setActiveId(conversations[0].id);
    }
  }, [conversations, activeId]);

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages.length]);

  // Mark as read when opening / new messages arrive
  useEffect(() => {
    if (activeId && messages.length > 0) {
      markAsRead();
    }
  }, [activeId, messages.length, markAsRead]);

  const activeConv = conversations.find((c) => c.id === activeId);
  const otherName =
    role === 'locador'
      ? activeConv?.driver?.name ?? 'Motorista'
      : 'Locador';

  const handleSend = async (e: FormEvent) => {
    e.preventDefault();
    const value = text.trim();
    if (!value) return;
    setText('');
    await send(value);
  };

  const handleSelect = (id: string) => {
    setActiveId(id);
    setShowListMobile(false);
  };

  const unreadField = role === 'locador' ? 'unread_locador' : 'unread_motorista';

  return (
    <div className="grid h-[calc(100vh-12rem)] grid-cols-1 gap-4 md:grid-cols-[320px_1fr]">
      {/* Conversation list */}
      <Card
        className={cn(
          'flex flex-col overflow-hidden',
          !showListMobile && 'hidden md:flex',
        )}
      >
        <div className="border-b p-4">
          <h2 className="text-lg font-semibold">Conversas</h2>
          <p className="text-sm text-muted-foreground">
            {conversations.length} {conversations.length === 1 ? 'conversa' : 'conversas'}
          </p>
        </div>
        <ScrollArea className="flex-1">
          {loadingList ? (
            <div className="space-y-2 p-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : conversations.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center gap-2 p-8 text-center">
              <MessageSquare className="h-10 w-10 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">
                Nenhuma conversa ainda.
              </p>
            </div>
          ) : (
            <ul className="divide-y">
              {conversations.map((c) => {
                const unread = (c as any)[unreadField] as number;
                const name =
                  role === 'locador' ? c.driver?.name ?? 'Motorista' : 'Locador';
                const isActive = c.id === activeId;
                return (
                  <li key={c.id}>
                    <button
                      type="button"
                      onClick={() => handleSelect(c.id)}
                      className={cn(
                        'flex w-full items-start gap-3 p-3 text-left transition-colors hover:bg-muted/60',
                        isActive && 'bg-muted',
                      )}
                    >
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
                        {name.charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-2">
                          <span className="truncate text-sm font-medium">{name}</span>
                          <span className="shrink-0 text-xs text-muted-foreground">
                            {format(new Date(c.last_message_at), 'HH:mm')}
                          </span>
                        </div>
                        <div className="flex items-center justify-between gap-2">
                          <p className="truncate text-xs text-muted-foreground">
                            {c.last_message_preview ?? 'Sem mensagens'}
                          </p>
                          {unread > 0 && (
                            <Badge className="h-5 min-w-5 shrink-0 rounded-full px-1.5 text-[10px]">
                              {unread}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </ScrollArea>
      </Card>

      {/* Active conversation */}
      <Card
        className={cn(
          'flex flex-col overflow-hidden',
          showListMobile && 'hidden md:flex',
        )}
      >
        {!activeConv ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-2 p-8 text-center">
            <MessageSquare className="h-12 w-12 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              Selecione uma conversa para começar.
            </p>
          </div>
        ) : (
          <>
            <div className="flex items-center gap-3 border-b p-4">
              <Button
                type="button"
                size="icon"
                variant="ghost"
                className="md:hidden"
                onClick={() => setShowListMobile(true)}
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
                {otherName.charAt(0).toUpperCase()}
              </div>
              <div>
                <h3 className="text-base font-semibold leading-tight">{otherName}</h3>
                <p className="text-xs text-muted-foreground">
                  {role === 'locador' ? 'Motorista' : 'Proprietário'}
                </p>
              </div>
            </div>

            <div ref={scrollRef} className="flex-1 overflow-y-auto p-4">
              {loading ? (
                <div className="space-y-3">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Skeleton key={i} className="h-12 w-2/3" />
                  ))}
                </div>
              ) : messages.length === 0 ? (
                <p className="py-8 text-center text-sm text-muted-foreground">
                  Envie a primeira mensagem.
                </p>
              ) : (
                <div className="space-y-3">
                  {messages.map((m, idx) => {
                    const mine = m.sender_id === user?.id;
                    const prev = messages[idx - 1];
                    const showDay =
                      !prev ||
                      format(new Date(prev.created_at), 'yyyy-MM-dd') !==
                        format(new Date(m.created_at), 'yyyy-MM-dd');
                    return (
                      <div key={m.id}>
                        {showDay && (
                          <div className="my-3 text-center text-[11px] uppercase tracking-wide text-muted-foreground">
                            {formatDay(m.created_at)}
                          </div>
                        )}
                        <div
                          className={cn(
                            'flex',
                            mine ? 'justify-end' : 'justify-start',
                          )}
                        >
                          <div
                            className={cn(
                              'max-w-[80%] rounded-2xl px-3 py-2 text-sm',
                              mine
                                ? 'rounded-br-sm bg-primary text-primary-foreground'
                                : 'rounded-bl-sm bg-muted',
                            )}
                          >
                            {m.content && <p className="whitespace-pre-wrap break-words">{m.content}</p>}
                            <div className="mt-1 flex items-center justify-end gap-1 text-[10px] opacity-70">
                              <span>{format(new Date(m.created_at), 'HH:mm')}</span>
                              {mine && m.read_at && <span>✓✓</span>}
                              {mine && !m.read_at && <span>✓</span>}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <form onSubmit={handleSend} className="flex gap-2 border-t p-3">
              <Input
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Digite sua mensagem..."
                disabled={sending}
                maxLength={2000}
                autoComplete="off"
              />
              <Button type="submit" disabled={sending || !text.trim()} size="icon">
                <Send className="h-4 w-4" />
              </Button>
            </form>
          </>
        )}
      </Card>
    </div>
  );
}
