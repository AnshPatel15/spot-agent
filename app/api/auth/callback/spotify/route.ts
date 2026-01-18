import { NextResponse } from 'next/server';
import querystring from 'querystring';

// Spotify OAuth token endpoint
const SPOTIFY_CLIENT_ID = process.env.SPOTIFY_CLIENT_ID!;
const SPOTIFY_CLIENT_SECRET = process.env.SPOTIFY_CLIENT_SECRET!;
const REDIRECT_URI = process.env.SPOTIFY_REDIRECT_URI || 'https://covalent-solely-elnora.ngrok-free.dev/api/auth/callback/spotify';
const SPOTIFY_TOKEN_URL = 'https://accounts.spotify.com/api/token';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');
  const error = searchParams.get('error');
  const state = searchParams.get('state');
  
  // If there's an error, redirect to sign-in with error message
  if (error) {
    console.error('Spotify OAuth error:', error);
    return NextResponse.redirect(
      new URL(`/auth/signin?error=spotify&callbackUrl=${encodeURIComponent(REDIRECT_URI)}`, request.url)
    );
  }
  
  // If no code, redirect to main auth endpoint
  if (!code) {
    return NextResponse.redirect(new URL('/api/auth', request.url));
  }
  
  // Exchange authorization code for tokens
  try {
    const authOptions = {
      method: 'POST',
      headers: {
        'Authorization': 'Basic ' + Buffer.from(SPOTIFY_CLIENT_ID + ':' + SPOTIFY_CLIENT_SECRET).toString('base64'),
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: querystring.stringify({
        code,
        redirect_uri: REDIRECT_URI,
        grant_type: 'authorization_code'
      })
    };
    
    console.log('Exchanging code for tokens...');
    const response = await fetch(SPOTIFY_TOKEN_URL, authOptions);
    const data = await response.json();
    
    console.log('Token exchange response:', response.status, data);
    
    if (response.ok) {
      // Store tokens in cookies and redirect to callback URL or agent page
      const callbackUrl = searchParams.get('callbackUrl') || '/agent';

      // For ngrok deployments, use the external URL instead of localhost
      const baseUrl = REDIRECT_URI.startsWith('http')
        ? REDIRECT_URI.replace('/api/auth/callback/spotify', '')
        : new URL(request.url).origin;

      const responseWithCookies = NextResponse.redirect(new URL(callbackUrl, baseUrl));
      
      // Set secure based on whether we're using HTTPS (ngrok uses HTTP in free tier)
      const isSecure = REDIRECT_URI.startsWith('https://');

      console.log('Setting cookies, secure:', isSecure);

      responseWithCookies.cookies.set('spotify_access_token', data.access_token, {
        httpOnly: true,
        secure: isSecure, // Only secure for HTTPS
        sameSite: 'lax',
        path: '/',
        maxAge: data.expires_in || 3600
      });

      if (data.refresh_token) {
        responseWithCookies.cookies.set('spotify_refresh_token', data.refresh_token, {
          httpOnly: true,
          secure: isSecure, // Only secure for HTTPS
          sameSite: 'lax',
          path: '/',
          maxAge: 60 * 60 * 24 * 30 // 30 days
        });
      }
      
      console.log('Authentication successful, redirecting to:', callbackUrl);
      return responseWithCookies;
    } else {
      console.error('Spotify token exchange error:', data);
      return NextResponse.redirect(
        new URL(`/auth/signin?error=spotify_token&callbackUrl=${encodeURIComponent(REDIRECT_URI)}`, request.url)
      );
    }
  } catch (err) {
    console.error('Spotify auth error:', err);
    return NextResponse.redirect(
      new URL(`/auth/signin?error=spotify_auth&callbackUrl=${encodeURIComponent(REDIRECT_URI)}`, request.url)
    );
  }
}

export { GET as POST };
