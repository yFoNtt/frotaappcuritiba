import { useState, useRef, useEffect, useCallback, FormEvent } from "react";
import { Sparkles, Send, Loader2, Trash2, Bot, User as UserIcon, ShieldCheck } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

type Role = "user" | "assistant";
interface Msg {
  role: Role;
  content: string;
}

const SUGGESTIONS = [
  "Quais contratos vencem essa semana?",
  "Quem está com pagamento atrasado?",
  "Manutenções pendentes",
  "Faturamento dos últimos 30 dias",
];

const FN_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/locador-assistant`;

export function LocadorAssistant() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 150);
    }
  }, [open]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isStreaming]);

  useEffect(() => {
    return () => abortRef.current?.abort();
  }, []);

  const send = useCallback(
    async (text: string) => {
      const content = text.trim();
      if (!content || isStreaming) return;

      const userMsg: Msg = { role: "user", content };
      const nextHistory = [...messages, userMsg];
      setMessages([...nextHistory, { role: "assistant", content: "" }]);
      setInput("");
      setIsStreaming(true);

      const controller = new AbortController();
      abortRef.current = controller;

      try {
        const { data: sessionData } = await supabase.auth.getSession();
        const token = sessionData.session?.access_token;
        if (!token) throw new Error("Sessão expirada. Faça login novamente.");

        const resp = await fetch(FN_URL, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ messages: nextHistory }),
          signal: controller.signal,
        });

        if (!resp.ok) {
          let errMsg = `Erro ${resp.status}`;
          try {
            const j = await resp.json();
            if (j?.error) errMsg = j.error;
          } catch {
            // ignore
          }
          throw new Error(errMsg);
        }
        if (!resp.body) throw new Error("Sem resposta do servidor.");

        const reader = resp.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";
        let assistantText = "";
        let done = false;

        const flushChunk = (chunk: string) => {
          assistantText += chunk;
          setMessages((prev) => {
            const copy = [...prev];
            const last = copy[copy.length - 1];
            if (last?.role === "assistant") {
              copy[copy.length - 1] = { ...last, content: assistantText };
            }
            return copy;
          });
        };

        while (!done) {
          const { value, done: rdDone } = await reader.read();
          if (rdDone) break;
          buffer += decoder.decode(value, { stream: true });

          let nl: number;
          while ((nl = buffer.indexOf("\n")) !== -1) {
            let line = buffer.slice(0, nl);
            buffer = buffer.slice(nl + 1);
            if (line.endsWith("\r")) line = line.slice(0, -1);
            if (!line || line.startsWith(":")) continue;
            if (!line.startsWith("data: ")) continue;
            const payload = line.slice(6).trim();
            if (payload === "[DONE]") {
              done = true;
              break;
            }
            try {
              const parsed = JSON.parse(payload);
              const delta = parsed.choices?.[0]?.delta?.content;
              if (typeof delta === "string" && delta) flushChunk(delta);
            } catch {
              // partial JSON — restore and wait for more data
              buffer = line + "\n" + buffer;
              break;
            }
          }
        }

        if (!assistantText) {
          setMessages((prev) => {
            const copy = [...prev];
            const last = copy[copy.length - 1];
            if (last?.role === "assistant" && !last.content) {
              copy[copy.length - 1] = {
                ...last,
                content: "Não consegui gerar uma resposta. Tente novamente.",
              };
            }
            return copy;
          });
        }
      } catch (e) {
        if ((e as Error)?.name === "AbortError") return;
        const msg = e instanceof Error ? e.message : "Erro ao falar com a IA";
        toast.error(msg);
        setMessages((prev) => {
          const copy = [...prev];
          const last = copy[copy.length - 1];
          if (last?.role === "assistant" && !last.content) {
            copy.pop();
          }
          return copy;
        });
      } finally {
        setIsStreaming(false);
        abortRef.current = null;
      }
    },
    [messages, isStreaming],
  );

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    send(input);
  };

  const handleClear = () => {
    abortRef.current?.abort();
    setMessages([]);
    setIsStreaming(false);
  };

  return (
    <>
      {/* Floating Action Button */}
      <Button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Abrir Assistente IA"
        className={cn(
          "fixed bottom-6 right-6 z-40 h-14 w-14 rounded-full shadow-lg",
          "bg-primary text-primary-foreground hover:bg-primary/90",
          "transition-transform hover:scale-105",
        )}
      >
        <Sparkles className="h-6 w-6" />
      </Button>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent
          side="right"
          className="flex w-full flex-col gap-0 p-0 sm:max-w-md"
        >
          <SheetHeader className="flex flex-row items-center justify-between space-y-0 border-b p-4">
            <SheetTitle className="flex items-center gap-2 text-base">
              <Sparkles className="h-4 w-4 text-primary" />
              Assistente IA
            </SheetTitle>
            <div className="flex items-center gap-1">
              {messages.length > 0 && (
                <Button
                  type="button"
                  size="icon"
                  variant="ghost"
                  onClick={handleClear}
                  aria-label="Limpar conversa"
                  className="h-8 w-8"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </div>
          </SheetHeader>

          <ScrollArea className="flex-1">
            <div ref={scrollRef} className="space-y-4 p-4">
              {messages.length === 0 ? (
                <div className="space-y-4 py-6 text-center">
                  <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                    <Sparkles className="h-6 w-6 text-primary" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-medium">Olá! Como posso ajudar?</p>
                    <p className="text-xs text-muted-foreground">
                      Pergunte sobre seus veículos, contratos, pagamentos e manutenções.
                    </p>
                  </div>
                  <div className="flex flex-wrap justify-center gap-2 pt-2">
                    {SUGGESTIONS.map((s) => (
                      <button
                        type="button"
                        key={s}
                        onClick={() => send(s)}
                        className="rounded-full border bg-card px-3 py-1.5 text-xs text-foreground transition-colors hover:bg-accent"
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                messages.map((m, i) => (
                  <MessageBubble
                    key={i}
                    role={m.role}
                    content={m.content}
                    isStreaming={
                      isStreaming &&
                      m.role === "assistant" &&
                      i === messages.length - 1
                    }
                  />
                ))
              )}
            </div>
          </ScrollArea>

          <form
            onSubmit={handleSubmit}
            className="flex flex-col gap-2 border-t bg-background p-3"
          >
           <div className="flex items-center gap-2">
            <Input
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Pergunte algo sobre seus aluguéis..."
              disabled={isStreaming}
              maxLength={2000}
              className="flex-1"
            />
            <Button
              type="submit"
              size="icon"
              disabled={isStreaming || !input.trim()}
              aria-label="Enviar mensagem"
            >
              {isStreaming ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
            </div>
            <p className="flex items-center gap-1 text-xs text-muted-foreground">
              <ShieldCheck className="h-3 w-3" />
              Dados sensíveis são mascarados automaticamente antes de serem processados.
            </p>
          </form>
        </SheetContent>
      </Sheet>
    </>
  );
}

function MessageBubble({
  role,
  content,
  isStreaming,
}: {
  role: Role;
  content: string;
  isStreaming: boolean;
}) {
  const isUser = role === "user";
  return (
    <div className={cn("flex gap-2", isUser ? "justify-end" : "justify-start")}>
      {!isUser && (
        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/10">
          <Bot className="h-4 w-4 text-primary" />
        </div>
      )}
      <div
        className={cn(
          "max-w-[85%] rounded-2xl px-3 py-2 text-sm",
          isUser
            ? "rounded-br-sm bg-primary text-primary-foreground"
            : "rounded-bl-sm bg-muted text-foreground",
        )}
      >
        {isUser ? (
          <p className="whitespace-pre-wrap break-words">{content}</p>
        ) : (
          <div className="prose prose-sm max-w-none break-words dark:prose-invert prose-p:my-1 prose-ul:my-1 prose-ol:my-1 prose-pre:my-2 prose-headings:my-2">
            {content ? (
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
            ) : (
              <span className="inline-flex items-center gap-1 text-muted-foreground">
                <Loader2 className="h-3 w-3 animate-spin" />
                Pensando...
              </span>
            )}
            {isStreaming && content && (
              <span className="ml-1 inline-block h-3 w-1.5 animate-pulse bg-primary align-middle" />
            )}
          </div>
        )}
      </div>
      {isUser && (
        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground">
          <UserIcon className="h-4 w-4" />
        </div>
      )}
    </div>
  );
}
