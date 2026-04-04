'use client';

import { signIn } from 'next-auth/react';
import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';

function SignInForm() {
  const searchParams = useSearchParams();
  const error = searchParams.get('error');

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-green-400 to-emerald-600">
      <div className="max-w-md w-full space-y-8 p-8 bg-white/20 backdrop-blur-lg rounded-3xl shadow-2xl">
        <h2 className="mt-6 text-center text-3xl font-bold text-white">
          Sign in to Spotify Agent
        </h2>
        {error && (
          <div className="p-4 bg-red-500/20 border border-red-500/50 rounded-lg text-red-100 text-center">
            <p className="font-medium">Authentication Error</p>
            <p className="text-sm">
              {error === 'OAuthCallback'
                ? 'Spotify OAuth error. Check your redirect URI and credentials.'
                : 'An error occurred. Please try again.'}
            </p>
          </div>
        )}
        <button
          onClick={() => signIn('spotify', { callbackUrl: '/agent' })}
          className="group relative w-full flex justify-center py-4 px-4 border border-transparent text-lg font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-all duration-200 shadow-xl hover:shadow-2xl hover:-translate-y-1"
        >
          Continue with Spotify
        </button>
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
