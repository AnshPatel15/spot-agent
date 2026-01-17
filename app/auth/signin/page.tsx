import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';

export default async function SignInPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; callbackUrl?: string }>;
}) {
  // Check for Spotify access token in cookies
  const cookieStore = await cookies();
  const accessToken = cookieStore.get('spotify_access_token')?.value;
  
  // If already authenticated, redirect to agent
  if (accessToken) redirect('https://covalent-solely-elnora.ngrok-free.dev/agent');

  const { error } = await searchParams;

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-green-400 to-emerald-600">
      <div className="max-w-md w-full space-y-8 p-8 bg-white/20 backdrop-blur-lg rounded-3xl shadow-2xl">
        <div>
          <h2 className="mt-6 text-center text-3xl font-bold text-white">
            Sign in to Spotify Agent
          </h2>
          {error === 'spotify' && (
            <p className="mt-4 p-4 bg-red-500/20 border border-red-500/50 rounded-lg text-red-100 text-center">
              Spotify OAuth error. Check:
              <br />
              • Redirect URI exact match in Spotify dashboard
              <br />
              • Client ID/Secret correct
              <br />
              • App is public or your account is whitelisted (Development mode)
              <br />
              • Try incognito or clear cookies
            </p>
          )}
        </div>
        <div>
          <a
            href="/api/auth"
            className="group relative w-full flex justify-center py-4 px-4 border border-transparent text-lg font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-all duration-200 shadow-xl hover:shadow-2xl hover:-translate-y-1"
          >
            <span>Continue with Spotify</span>
          </a>
        </div>
      </div>
    </div>
  );
}