'use client';

import { useState, useRef, useEffect } from 'react';
import { useSession, signIn, signOut } from 'next-auth/react';
import type { Session } from 'next-auth';
import type { LucideIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Music2, Send, LogOut, Sparkles, ListMusic, Mic2, ChevronDown } from 'lucide-react';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface Message {
  role: 'user' | 'assistant';
  content: string;
  isError?: boolean;
}

interface Suggestion {
  icon: LucideIcon;
  label: string;
}

interface UserMenuProps {
  session: Session;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const SUGGESTIONS: Suggestion[] = [
  { icon: Sparkles, label: 'Suggest songs for a late-night drive' },
  { icon: ListMusic, label: 'Create a focus playlist for deep work' },
  { icon: Mic2, label: 'Find upbeat tracks similar to Daft Punk' },
];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatMessage(text: string): string {
  if (!text) return '';
  return text
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    .replace(
      /\[([^\]]+)\]\(([^)]+)\)/g,
      '<a href="$2" target="_blank" rel="noopener noreferrer" class="text-primary underline underline-offset-2 hover:opacity-80 transition-opacity">$1</a>'
    )
    .replace(/^(\d+)\.\s+(.+)$/gm, '<div class="ml-4 my-0.5">$1. $2</div>')
    .replace(/^##\s+(.+)$/gm, '<h2 class="text-base font-semibold mt-3 mb-1">$1</h2>')
    .replace(/^[-*]\s+(.+)$/gm, '<div class="ml-4 my-0.5">• $1</div>')
    .replace(/\n\n/g, '<br><br>')
    .replace(/\n/g, '<br>');
}

// ---------------------------------------------------------------------------
// UserMenu
// ---------------------------------------------------------------------------

function UserMenu({ session }: UserMenuProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm transition-colors hover:bg-accent"
      >
        <Avatar className="size-7">
          <AvatarImage src={session.user?.image ?? undefined} alt={session.user?.name ?? ''} />
          <AvatarFallback className="bg-primary/10 text-xs text-primary">
            {session.user?.name?.[0]?.toUpperCase() ?? 'U'}
          </AvatarFallback>
        </Avatar>
        <span className="hidden max-w-[120px] truncate text-sm font-medium sm:block">
          {session.user?.name}
        </span>
        <ChevronDown
          className={`size-3.5 text-muted-foreground transition-transform ${open ? 'rotate-180' : ''}`}
        />
      </button>

      {open && (
        <div className="absolute right-0 top-full z-50 mt-1.5 w-48 rounded-xl border border-border/50 bg-card/95 p-1 shadow-xl backdrop-blur-sm">
          <div className="mb-1 border-b border-border/50 px-3 py-2">
            <p className="truncate text-xs font-medium">{session.user?.name}</p>
            <p className="truncate text-xs text-muted-foreground">{session.user?.email}</p>
          </div>
          <button
            onClick={() => {
              setOpen(false);
              signOut({ callbackUrl: '/' });
            }}
            className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
          >
            <LogOut className="size-4" />
            Sign out
          </button>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// SpotifyIcon (inline SVG to avoid an extra dep)
// ---------------------------------------------------------------------------

function SpotifyIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden>
      <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z" />
    </svg>
  );
}

// ---------------------------------------------------------------------------
// AgentChat
// ---------------------------------------------------------------------------

export default function AgentChat() {
  const { data: session, status } = useSession();
  const isAuthenticated = !!session?.accessToken;
  const isLoadingAuth = status === 'loading';

  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const sendMessage = async (text?: string): Promise<void> => {
    const content = (text ?? input).trim();
    if (!content || isLoading) return;

    setMessages((prev) => [...prev, { role: 'user', content }]);
    setInput('');
    setIsLoading(true);

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 90_000);

      const res = await fetch('/api/agent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: content }),
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || data.error || `HTTP ${res.status}`);

      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: typeof data.message === 'string' ? data.message : JSON.stringify(data.message),
        },
      ]);
    } catch (err) {
      const error = err as Error;
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content:
            error.name === 'AbortError'
              ? 'Request timed out. Please try again.'
              : `Error: ${error.message ?? 'Something went wrong.'}`,
          isError: true,
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoadingAuth) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="size-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="flex h-screen flex-col w-screen">
      {/* ------------------------------------------------------------------ */}
      {/* Header                                                              */}
      {/* ------------------------------------------------------------------ */}
      <header className="sticky top-0 z-10 border-b border-border/50 bg-background/80 backdrop-blur-md">
        <div className="mx-auto flex h-14 max-w-3xl items-center justify-between px-4">
          <div className="flex items-center gap-2.5">
            <div className="flex size-8 items-center justify-center rounded-lg bg-primary/10">
              <Music2 className="size-4 text-primary" />
            </div>
            <div>
              <span className="text-sm font-semibold">Spotify Agent</span>
              <div className="hidden sm:block">
                {isAuthenticated ? (
                  <Badge variant="secondary" className="h-4 gap-1 px-1.5 text-[10px]">
                    <span className="size-1.5 rounded-full bg-primary" />
                    Connected
                  </Badge>
                ) : (
                  <Badge variant="outline" className="h-4 gap-1 px-1.5 text-[10px] text-muted-foreground">
                    <span className="size-1.5 rounded-full bg-muted-foreground/50" />
                    Limited mode
                  </Badge>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {isAuthenticated && session ? (
              <UserMenu session={session} />
            ) : (
              <Button
                size="sm"
                variant="outline"
                className="gap-1.5 text-xs"
                onClick={() => signIn('spotify', { callbackUrl: '/agent' })}
              >
                <SpotifyIcon className="size-3.5" />
                Connect Spotify
              </Button>
            )}
          </div>
        </div>
      </header>

      {/* ------------------------------------------------------------------ */}
      {/* Messages                                                            */}
      {/* ------------------------------------------------------------------ */}
      <ScrollArea className="flex-1">
        <div className="mx-auto max-w-3xl px-4 py-6">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="mb-5 flex size-16 items-center justify-center rounded-2xl bg-primary/10 ring-1 ring-primary/20">
                <Music2 className="size-8 text-primary" />
              </div>
              <h2 className="mb-2 text-xl font-semibold">Your Spotify Agent</h2>
              <p className="mb-8 max-w-sm text-sm text-muted-foreground">
                {isAuthenticated
                  ? "Ask for song recommendations or create a playlist — I'm connected to your Spotify."
                  : 'Ask for music recommendations. Connect Spotify to also create playlists.'}
              </p>
              <div className="flex w-full max-w-sm flex-col gap-2">
                {SUGGESTIONS.map(({ icon: Icon, label }) => (
                  <button
                    key={label}
                    onClick={() => sendMessage(label)}
                    className="flex items-center gap-3 rounded-xl border border-border/50 bg-card/60 px-4 py-3 text-left text-sm backdrop-blur-sm transition-colors hover:border-border hover:bg-accent"
                  >
                    <Icon className="size-4 shrink-0 text-primary" />
                    <span>{label}</span>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {messages.map((msg, i) => (
                <div
                  key={i}
                  className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}
                >
                  {msg.role === 'assistant' && (
                    <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                      <Music2 className="size-4 text-primary" />
                    </div>
                  )}
                  {msg.role === 'user' && (
                    <Avatar className="size-8 shrink-0">
                      <AvatarImage src={session?.user?.image ?? undefined} />
                      <AvatarFallback className="bg-primary/10 text-xs text-primary">
                        {session?.user?.name?.[0]?.toUpperCase() ?? 'U'}
                      </AvatarFallback>
                    </Avatar>
                  )}

                  <div
                    className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed sm:max-w-[70%] ${
                      msg.role === 'user'
                        ? 'rounded-tr-sm bg-primary text-primary-foreground'
                        : msg.isError
                          ? 'rounded-tl-sm border border-destructive/20 bg-destructive/10 text-destructive'
                          : 'rounded-tl-sm border border-border/50 bg-card/80 backdrop-blur-sm'
                    }`}
                  >
                    {msg.role === 'assistant' ? (
                      <div
                        dangerouslySetInnerHTML={{ __html: formatMessage(msg.content) }}
                        className="prose-sm prose-invert max-w-none"
                      />
                    ) : (
                      msg.content
                    )}
                  </div>
                </div>
              ))}

              {/* Typing indicator */}
              {isLoading && (
                <div className="flex gap-3">
                  <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                    <Music2 className="size-4 text-primary" />
                  </div>
                  <div className="flex items-center gap-1 rounded-2xl rounded-tl-sm border border-border/50 bg-card/80 px-4 py-3 backdrop-blur-sm">
                    <span className="size-1.5 animate-bounce rounded-full bg-muted-foreground [animation-delay:-0.3s]" />
                    <span className="size-1.5 animate-bounce rounded-full bg-muted-foreground [animation-delay:-0.15s]" />
                    <span className="size-1.5 animate-bounce rounded-full bg-muted-foreground" />
                  </div>
                </div>
              )}
              <div ref={bottomRef} />
            </div>
          )}
        </div>
      </ScrollArea>

      {/* ------------------------------------------------------------------ */}
      {/* Input bar                                                           */}
      {/* ------------------------------------------------------------------ */}
      <div className="border-t border-border/50 bg-background/80 backdrop-blur-md">
        <div className="mx-auto max-w-3xl px-4 py-3 sm:py-4">
          {!isAuthenticated && (
            <p className="mb-2 text-center text-xs text-muted-foreground">
              <button
                onClick={() => signIn('spotify', { callbackUrl: '/agent' })}
                className="text-primary underline underline-offset-2 hover:opacity-80"
              >
                Connect Spotify
              </button>{' '}
              to create playlists and unlock full features
            </p>
          )}
          <form
            onSubmit={(e: React.FormEvent<HTMLFormElement>) => {
              e.preventDefault();
              sendMessage();
            }}
            className="flex gap-2"
          >
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask for song recs or 'create a chill playlist'…"
              className="h-11 flex-1 bg-card/60 text-sm backdrop-blur-sm placeholder:text-muted-foreground"
              disabled={isLoading}
            />
            <Button
              type="submit"
              size="icon"
              className="size-11 shrink-0"
              disabled={!input.trim() || isLoading}
              aria-label="Send message"
            >
              <Send className="size-4" />
            </Button>
          </form>
          <p className="mt-1.5 text-center text-[12px] text-muted-foreground/90">
            AI can make mistakes. Verify important information.
          </p>
        </div>
      </div>
    </div>
  );
}
