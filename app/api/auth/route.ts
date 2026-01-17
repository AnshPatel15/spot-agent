import { NextResponse } from 'next/server';
import querystring from 'querystring';

// Simple Spotify OAuth handler
const SPOTIFY_CLIENT_ID = process.env.SPOTIFY_CLIENT_ID!;
const SPOTIFY_CLIENT_SECRET = process.env.SPOTIFY_CLIENT_SECRET!;
const REDIRECT_URI = process.env.SPOTIFY_REDIRECT_URI || 'https://covalent-solely-elnora.ngrok-free.dev/api/auth/callback/spotify';
const SCOPES = ['user-read-private', 'user-read-email', 'playlist-modify-public', 'playlist-modify-private'];

// Generate random string for state parameter
function generateRandomString(length: number) {
  let text = '';
  const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  for (let i = 0; i < length; i++) {
    text += possible.charAt(Math.floor(Math.random() * possible.length));
  }
  return text;
}

// Spotify OAuth endpoints
const SPOTIFY_AUTH_URL = 'https://accounts.spotify.com/authorize';

// Main authentication endpoint
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');
  const error = searchParams.get('error');
  const returnedState = searchParams.get('state');
  
  // If there's an error, redirect to sign-in with error message
  if (error) {
    return NextResponse.redirect(
      new URL(`/auth/signin?error=spotify&callbackUrl=${encodeURIComponent(REDIRECT_URI)}`, request.url)
    );
  }
  
  // If we have a code, this should be handled by the callback endpoint
  if (code) {
    // Redirect to the callback endpoint to handle token exchange
    const callbackUrl = new URL('/api/auth/callback/spotify', request.url);
    callbackUrl.searchParams.set('code', code);
    if (returnedState) {
      callbackUrl.searchParams.set('state', returnedState);
    }
    return NextResponse.redirect(callbackUrl);
  }
  
  // If no code and no error, initiate OAuth flow
  const state = generateRandomString(16);
  const authUrl = `${SPOTIFY_AUTH_URL}?${querystring.stringify({
    response_type: 'code',
    client_id: SPOTIFY_CLIENT_ID,
    scope: SCOPES.join(' '),
    redirect_uri: REDIRECT_URI,
    state: state
  })}`;
  
  console.log('Redirecting to Spotify OAuth:', authUrl);
  return NextResponse.redirect(authUrl);
}

export { GET as POST };