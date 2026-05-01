import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Download, FileText, ImageIcon, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Props {
  path: string;
  name: string | null;
  mime: string | null;
  size: number | null;
  mine: boolean;
}

function formatSize(bytes: number | null) {
  if (!bytes) return '';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function MessageAttachment({ path, name, mime, size, mine }: Props) {
  const isImage = mime?.startsWith('image/');
  const [url, setUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    setLoading(true);
    supabase.storage
      .from('chat-attachments')
      .createSignedUrl(path, 60 * 60)
      .then(({ data, error }) => {
        if (!active) return;
        if (error) {
          console.error('[MessageAttachment] signed url error', error);
        }
        setUrl(data?.signedUrl ?? null);
        setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [path]);

  if (isImage) {
    return (
      <a
        href={url ?? '#'}
        target="_blank"
        rel="noreferrer"
        className="mt-1 block overflow-hidden rounded-lg border border-border/40"
        onClick={(e) => {
          if (!url) e.preventDefault();
        }}
      >
        {loading || !url ? (
          <div className="flex h-40 w-60 items-center justify-center bg-muted/40">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <img
            src={url}
            alt={name ?? 'Anexo'}
            className="max-h-60 w-full max-w-[260px] object-cover"
            loading="lazy"
          />
        )}
      </a>
    );
  }

  // Generic file card
  return (
    <a
      href={url ?? '#'}
      target="_blank"
      rel="noreferrer"
      onClick={(e) => {
        if (!url) e.preventDefault();
      }}
      className={cn(
        'mt-1 flex max-w-[260px] items-center gap-2 rounded-lg border px-2.5 py-2 text-xs transition-colors',
        mine
          ? 'border-primary-foreground/30 bg-primary-foreground/10 hover:bg-primary-foreground/20'
          : 'border-border bg-background/60 hover:bg-background',
      )}
    >
      <div
        className={cn(
          'flex h-9 w-9 shrink-0 items-center justify-center rounded-md',
          mine ? 'bg-primary-foreground/20' : 'bg-muted',
        )}
      >
        {mime?.includes('pdf') || mime?.startsWith('application/') ? (
          <FileText className="h-4 w-4" />
        ) : (
          <ImageIcon className="h-4 w-4" />
        )}
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate font-medium">{name ?? 'Arquivo'}</p>
        <p className="opacity-70">{formatSize(size)}</p>
      </div>
      {loading ? (
        <Loader2 className="h-4 w-4 animate-spin opacity-70" />
      ) : (
        <Download className="h-4 w-4 opacity-70" />
      )}
    </a>
  );
}
