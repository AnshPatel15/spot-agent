import Link from 'next/link';
import { Button } from '@/components/ui/button'; // shadcn Button (adjust path if ui/ folder)

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24 bg-gradient-to-br from-purple-500 to-blue-600 text-white">
      <div className="max-w-4xl text-center">
        <h1 className="text-6xl font-bold mb-8 drop-shadow-2xl">
          Spotify Song Agent
        </h1>
        <p className="text-2xl mb-12 opacity-90 leading-relaxed">
          AI-powered song suggestions & automatic playlist creation using{' '}
          <span className="font-semibold">LangChain + OpenRouter + Spotify API</span>.
          Chat, discover, create!
        </p>
        <div className="flex flex-col sm:flex-row gap-6 justify-center">
          <Link href="/agent">
            <Button size="lg" className="text-xl px-8 py-6 bg-white text-purple-600 hover:bg-gray-100 shadow-2xl">
              🎵 Launch Agent
            </Button>
          </Link>
          <Link href="/auth/signin">
            <Button variant="outline" size="lg" className="text-xl px-8 py-6 border-white bg-transparent hover:bg-white hover:text-purple-600">
              Sign in with Spotify
            </Button>
          </Link>
        </div>
        <p className="mt-12 text-lg opacity-75">
          Learning session: Build agent step-by-step!
        </p>
      </div>
    </main>
  );
}
