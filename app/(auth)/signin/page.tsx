import { redirect } from 'next/navigation';
import { config } from '@/lib/config';
import { cookies } from 'next/headers';

export default async function SignInPage({ searchParams }: { searchParams: { error?: string; callbackUrl?: string } }) {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get('spotify_access_token')?.value;
  
  console.log('SignInPage - Access token:', accessToken ? 'Present' : 'Missing');
  console.log('SignInPage - Token value:', accessToken);
  console.log('SignInPage - Error param:', searchParams.error);
  console.log('SignInPage - Callback URL:', searchParams.callbackUrl);
  
  if (accessToken && accessToken.length > 0) {
    console.log('Redirecting to /agent due to existing token');
    redirect('/agent');
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-green-400 to-emerald-600">
      <div className="max-w-md w-full space-y-8 p-8 bg-white/20 backdrop-blur-lg rounded-3xl shadow-2xl">
        <div>
          <h2 className="mt-6 text-center text-3xl font-bold text-white">
            Sign in to Spotify Agent
          </h2>
        </div>
        {searchParams.error && (
          <div className="p-4 bg-red-100 text-red-700 rounded-lg text-center">
            <p className="font-medium">Authentication Error</p>
            <p className="text-sm">
              {searchParams.error === 'spotify' && 'Spotify authentication failed'}
              {searchParams.error === 'spotify_token' && 'Failed to get Spotify access token'}
              {searchParams.error === 'spotify_auth' && 'Authentication error occurred'}
              {searchParams.error === 'oauth' && 'OAuth flow failed'}
            </p>
            <p className="text-xs mt-1 opacity-75">Please try again</p>
          </div>
        )}
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