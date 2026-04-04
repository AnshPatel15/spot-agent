import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Music2, ListMusic, Sparkles, ArrowRight, Zap, MessageSquare } from 'lucide-react';

const features = [
  {
    icon: Sparkles,
    title: 'AI Recommendations',
    description: 'A LangChain ReAct agent powered by OpenRouter reasons over your request and finds the perfect songs.',
  },
  {
    icon: ListMusic,
    title: 'Instant Playlists',
    description: 'Ask the agent to create a playlist and it appears directly in your Spotify — no copy-paste needed.',
  },
  {
    icon: MessageSquare,
    title: 'Natural Conversation',
    description: 'Just describe a mood, activity, or genre. The agent understands context across the full conversation.',
  },
];

export default function Home() {
  return (
    <main className="relative min-h-screen overflow-hidden">
      {/* Subtle grid background */}
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,oklch(1_0_0/4%)_1px,transparent_1px),linear-gradient(to_bottom,oklch(1_0_0/4%)_1px,transparent_1px)] bg-[size:64px_64px]" />
      {/* Glow blobs */}
      <div className="pointer-events-none absolute top-[-10%] left-1/2 -translate-x-1/2 h-[500px] w-[700px] rounded-full bg-primary/10 blur-[120px]" />
      <div className="pointer-events-none absolute bottom-0 right-0 h-[300px] w-[400px] rounded-full bg-primary/5 blur-[100px]" />

      <div className="relative mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
        {/* Navbar */}
        <nav className="flex h-16 items-center justify-between sm:h-20">
          <div className="flex items-center gap-2">
            <div className="flex size-8 items-center justify-center rounded-lg bg-primary/10">
              <Music2 className="size-4 text-primary" />
            </div>
            <span className="font-semibold tracking-tight">Spotify Agent</span>
          </div>
          <div className="flex items-center gap-2">
            <Button asChild variant="ghost" size="sm">
              <Link href="/auth/signin">Sign In</Link>
            </Button>
            <Button asChild size="sm">
              <Link href="/agent">Launch Agent</Link>
            </Button>
          </div>
        </nav>

        {/* Hero */}
        <section className="py-20 text-center sm:py-32">
          <Badge variant="secondary" className="mb-6 gap-1.5 px-3 py-1 text-xs">
            <Zap className="size-3 text-primary" />
            LangChain · OpenRouter · Spotify API
          </Badge>

          <h1 className="mb-6 text-4xl font-bold tracking-tight sm:text-6xl lg:text-7xl">
            Your AI{' '}
            <span className="text-primary">Music Agent</span>
          </h1>

          <p className="mx-auto mb-10 max-w-xl text-base text-muted-foreground sm:text-lg">
            Discover songs, create playlists, and explore music — all through
            natural conversation with an AI connected directly to Spotify.
          </p>

          <div className="flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
            <Button asChild size="lg" className="w-full gap-2 sm:w-auto">
              <Link href="/agent">
                Launch Agent <ArrowRight className="size-4" />
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="w-full sm:w-auto">
              <Link href="/auth/signin">Sign in with Spotify</Link>
            </Button>
          </div>
        </section>

        {/* Feature cards */}
        <section className="pb-24">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            {features.map(({ icon: Icon, title, description }) => (
              <Card key={title} className="border-border bg-card backdrop-blur-sm">
                <CardContent className="p-6">
                  <div className="mb-4 flex size-10 items-center justify-center rounded-lg bg-primary/10">
                    <Icon className="size-5 text-primary" />
                  </div>
                  <h3 className="mb-2 font-semibold">{title}</h3>
                  <p className="text-sm leading-relaxed text-muted-foreground">{description}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Bottom CTA strip */}
          <div className="mt-10 flex flex-col items-center justify-between gap-4 rounded-xl border border-border bg-card p-6 backdrop-blur-sm sm:flex-row">
            <div>
              <p className="font-semibold">Ready to get started?</p>
              <p className="text-sm text-muted-foreground">Connect Spotify and start chatting.</p>
            </div>
            <Button asChild className="gap-2 whitespace-nowrap">
              <Link href="/agent">
                <Music2 className="size-4" /> Open the Agent
              </Link>
            </Button>
          </div>
        </section>
      </div>
    </main>
  );
}
