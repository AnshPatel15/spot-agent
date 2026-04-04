'use client';

import { signIn } from 'next-auth/react';
import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import { Button } from '@/components/ui/button';
import { AlertCircle, Music2 } from 'lucide-react';

function SignInForm() {
  const searchParams = useSearchParams();
  const error = searchParams.get('error');

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden p-4">
      {/* Background */}
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,oklch(1_0_0/3%)_1px,transparent_1px),linear-gradient(to_bottom,oklch(1_0_0/3%)_1px,transparent_1px)] bg-[size:48px_48px]" />
      <div className="pointer-events-none absolute top-1/4 left-1/2 -translate-x-1/2 h-[400px] w-[600px] rounded-full bg-primary/8 blur-[100px]" />

      <div className="relative w-full max-w-sm">
        {/* Logo */}
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex size-14 items-center justify-center rounded-2xl bg-primary/10 ring-1 ring-primary/20">
            <Music2 className="size-7 text-primary" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight">Spotify Agent</h1>
          <p className="mt-1.5 text-sm text-muted-foreground">
            Sign in to start discovering music with AI
          </p>
        </div>

        {/* Error */}
        {error && (
          <div className="mb-5 flex items-start gap-2.5 rounded-lg border border-destructive/20 bg-destructive/10 p-3 text-sm text-destructive">
            <AlertCircle className="mt-0.5 size-4 shrink-0" />
            <span>
              {error === 'OAuthCallback'
                ? 'Spotify auth failed. Verify your redirect URI in the Spotify dashboard.'
                : 'Authentication error. Please try again.'}
            </span>
          </div>
        )}

        {/* Sign in card */}
        <div className="rounded-2xl border border-border/50 bg-card/80 p-8 backdrop-blur-sm">
          <Button
            size="lg"
            className="w-full gap-3 font-semibold"
            onClick={() => signIn('spotify', { callbackUrl: '/agent' })}
          >
            {/* Spotify icon */}
            <svg viewBox="0 0 24 24" className="size-5 shrink-0" fill="currentColor" aria-hidden>
              <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z"/>
            </svg>
            Continue with Spotify
          </Button>

          <p className="mt-5 text-center text-xs text-muted-foreground">
            By continuing you agree to Spotify&apos;s{' '}
            <a
              href="https://www.spotify.com/legal/end-user-agreement/"
              target="_blank"
              rel="noopener noreferrer"
              className="underline underline-offset-2 hover:text-foreground transition-colors"
            >
              Terms of Service
            </a>
          </p>
        </div>

        <p className="mt-6 text-center text-xs text-muted-foreground">
          Powered by LangChain · OpenRouter · Next.js
        </p>
      </div>
    </div>
  );
}

export default function SignInPage() {
  return (
    <Suspense>
      <SignInForm />
    </Suspense>
  );
}
