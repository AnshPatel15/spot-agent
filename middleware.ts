import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// List of paths that don't require authentication
const PUBLIC_PATHS = [
  '/auth/signin',
  '/auth/login',
  '/api/auth',
  '/api/auth/check',
  '/api/auth/callback',
  '/api/auth/callback/spotify',
  '/',
  '/favicon.ico'
];

export function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  
  // Skip middleware for public paths
  if (PUBLIC_PATHS.some(path => pathname.startsWith(path))) {
    return NextResponse.next();
  }
  
  // Check for Spotify access token in cookies
  const accessToken = request.cookies.get('spotify_access_token')?.value;
  
  console.log(`Middleware - Path: ${pathname}, Token: ${accessToken ? 'Present' : 'Missing'}`);
  
  // If no access token, redirect to sign-in
  if (!accessToken) {
    console.log(`Redirecting to sign-in from: ${pathname}`);
    const signInUrl = new URL('/auth/signin', request.url);
    signInUrl.searchParams.set('callbackUrl', encodeURIComponent(request.url));
    return NextResponse.redirect(signInUrl);
  }
  
  // If access token exists, allow the request to proceed
  return NextResponse.next();
}

// Match all routes except API routes and static files
export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};