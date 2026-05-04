import { useEffect, useRef, useState, FormEvent, ChangeEvent } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { MessageSquare, Send, ArrowLeft, Paperclip, X, Loader2, AlertCircle, RotateCcw } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useConversation, useConversations, type ChatRole, type AttachmentInput } from '@/hooks/useChat';
import { format, isToday, isYesterday } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { MessageAttachment } from './MessageAttachment';
import { Progress } from '@/components/ui/progress';

const MAX_ATTACHMENT_SIZE = 10 * 1024 * 1024; // 10 MB
const ALLOWED_MIME = /^(image\/|application\/pdf|application\/msword|application\/vnd\.openxmlformats|application\/vnd\.ms-excel|text\/)/;

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
  const { messages, loading, sending, send, uploadAttachment, markAsRead } = useConversation(activeId, role);
  const [text, setText] = useState('');
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  // Auto-retry feedback for the user while backoff runs
  const [retryInfo, setRetryInfo] = useState<{ attempt: number; max: number } | null>(null);
  // Real-time upload progress (0-100), null when no upload is in flight
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  // Tracks the last failed send so the user can retry with the same file/text
  const [failedAttempt, setFailedAttempt] = useState<
    | { file: File | null; uploadedAttachment: AttachmentInput | null; text: string }
    | null
  >(null);
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

  const trySend = async (
    value: string,
    file: File | null,
    /** If we already uploaded the file in a prior attempt, reuse it instead of re-uploading. */
    existingAttachment: AttachmentInput | null = null,
  ) => {
    let attachment: AttachmentInput | null = existingAttachment;
    if (file && !attachment) {
      setUploading(true);
      setRetryInfo(null);
      setUploadProgress(0);
      attachment = await uploadAttachment(file, {
        maxAttempts: 3,
        onRetry: (attempt, max) => {
          setRetryInfo({ attempt, max });
          setUploadProgress(0);
        },
        onProgress: (pct) => setUploadProgress(pct),
      });
      setRetryInfo(null);
      setUploadProgress(null);
      setUploading(false);
      if (!attachment) {
        // Upload failed after all retries → keep file so the user can retry manually
        setFailedAttempt({ file, uploadedAttachment: null, text: value });
        return;
      }
    }

    const ok = await send(value, attachment);
    if (!ok) {
      // DB insert failed → file is already uploaded, just retry the insert
      setFailedAttempt({ file, uploadedAttachment: attachment, text: value });
      return;
    }

    setText('');
    setPendingFile(null);
    setFailedAttempt(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSend = async (e: FormEvent) => {
    e.preventDefault();
    const value = text.trim();
    if (!value && !pendingFile) return;
    await trySend(value, pendingFile);
  };

  const handleRetry = async () => {
    if (!failedAttempt) return;
    await trySend(
      failedAttempt.text,
      failedAttempt.file,
      failedAttempt.uploadedAttachment,
    );
  };

  const handlePickFile = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > MAX_ATTACHMENT_SIZE) {
      toast.error('Arquivo muito grande (máx. 10 MB).');
      e.target.value = '';
      return;
    }
    if (!ALLOWED_MIME.test(file.type)) {
      toast.error('Tipo de arquivo não permitido.');
      e.target.value = '';
      return;
    }
    setPendingFile(file);
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
                            {m.attachment_path && (
                              <MessageAttachment
                                path={m.attachment_path}
                                name={m.attachment_name}
                                mime={m.attachment_mime}
                                size={m.attachment_size}
                                mine={mine}
                              />
                            )}
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

            <form onSubmit={handleSend} className="border-t p-3">
              {failedAttempt && (
                <div className="mb-2 flex items-center gap-2 rounded-md border border-destructive/40 bg-destructive/10 px-2 py-1.5 text-xs text-destructive">
                  <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                  <span className="flex-1 truncate">
                    Falha ao enviar
                    {failedAttempt.file ? ` "${failedAttempt.file.name}"` : ' a mensagem'}.
                  </span>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    className="h-7 gap-1 border-destructive/40 px-2 text-xs"
                    onClick={handleRetry}
                    disabled={uploading || sending}
                  >
                    {uploading || sending ? (
                      <Loader2 className="h-3 w-3 animate-spin" />
                    ) : (
                      <RotateCcw className="h-3 w-3" />
                    )}
                    Reenviar
                  </Button>
                  <Button
                    type="button"
                    size="icon"
                    variant="ghost"
                    className="h-6 w-6 text-destructive hover:text-destructive"
                    onClick={() => setFailedAttempt(null)}
                    aria-label="Descartar"
                  >
                    <X className="h-3.5 w-3.5" />
                  </Button>
                </div>
              )}
              {pendingFile && (
                <div className="mb-2 space-y-1.5 rounded-md border bg-muted/40 px-2 py-1.5 text-xs">
                  <div className="flex items-center gap-2">
                    <Paperclip className="h-3.5 w-3.5 shrink-0" />
                    <span className="flex-1 truncate">{pendingFile.name}</span>
                    {retryInfo ? (
                      <span className="flex items-center gap-1 text-warning">
                        <Loader2 className="h-3 w-3 animate-spin" />
                        Tentativa {retryInfo.attempt}/{retryInfo.max}
                      </span>
                    ) : uploadProgress !== null ? (
                      <span className="tabular-nums opacity-80">{uploadProgress}%</span>
                    ) : (
                      <span className="opacity-70">
                        {(pendingFile.size / 1024).toFixed(0)} KB
                      </span>
                    )}
                    <Button
                      type="button"
                      size="icon"
                      variant="ghost"
                      className="h-6 w-6"
                      disabled={uploading}
                      onClick={() => {
                        setPendingFile(null);
                        if (fileInputRef.current) fileInputRef.current.value = '';
                      }}
                    >
                      <X className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                  {uploadProgress !== null && (
                    <Progress value={uploadProgress} className="h-1" />
                  )}
                </div>
              )}
              <div className="flex gap-2">
                <input
                  ref={fileInputRef}
                  type="file"
                  className="hidden"
                  accept="image/*,application/pdf,.doc,.docx,.xls,.xlsx,.txt"
                  onChange={handlePickFile}
                />
                <Button
                  type="button"
                  size="icon"
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={sending || uploading}
                  aria-label="Anexar arquivo"
                >
                  <Paperclip className="h-4 w-4" />
                </Button>
                <Input
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  placeholder="Digite sua mensagem..."
                  disabled={sending || uploading}
                  maxLength={2000}
                  autoComplete="off"
                />
                <Button
                  type="submit"
                  disabled={sending || uploading || (!text.trim() && !pendingFile)}
                  size="icon"
                >
                  {uploading || sending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </form>
          </>
        )}
      </Card>
    </div>
  );
}
