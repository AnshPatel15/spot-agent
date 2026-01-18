import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    console.log('Auth check called');

    // Check cookies from request
    const accessToken = request.cookies.get('spotify_access_token')?.value;
    const refreshToken = request.cookies.get('spotify_refresh_token')?.value;

    console.log('Auth check - Access token:', accessToken ? 'Present' : 'Missing');
    console.log('Auth check - Refresh token:', refreshToken ? 'Present' : 'Missing');

    if (accessToken && accessToken.length > 0) {
      return NextResponse.json({
        authenticated: true,
        tokenPresent: true,
        hasRefreshToken: !!refreshToken,
        message: 'Valid Spotify access token found'
      });
    }

    return NextResponse.json({
      authenticated: false,
      tokenPresent: false,
      message: 'No valid Spotify access token found'
    }, { status: 401 });

  } catch (error: any) {
    console.error('Auth check error:', error);
    return NextResponse.json({
      authenticated: false,
      error: 'Auth check failed',
      details: error.message
    }, { status: 500 });
  }
}
