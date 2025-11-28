import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { config } from '@/lib/config';

export default async function SignInPage() {
  const session = await getServerSession();
  if (session) redirect('/agent');

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-green-400 to-emerald-600">
      <div className="max-w-md w-full space-y-8 p-8 bg-white/20 backdrop-blur-lg rounded-3xl shadow-2xl">
        <div>
          <h2 className="mt-6 text-center text-3xl font-bold text-white">
            Sign in to Spotify Agent
          </h2>
        </div>
        <div>
          <a
            href="/api/auth/signin/spotify"
            className="group relative w-full flex justify-center py-4 px-4 border border-transparent text-lg font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-all duration-200 shadow-xl hover:shadow-2xl hover:-translate-y-1"
          >
            <span>Continue with Spotify</span>
          </a>
        </div>
      </div>
    </div>
  );
}