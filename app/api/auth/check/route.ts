import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function GET() {
  try {
    const cookieStore = await cookies();
    const accessToken = cookieStore.get('spotify_access_token')?.value;
    
    console.log('Auth check - Access token:', accessToken ? 'Present' : 'Missing');
    
    if (accessToken) {
      // Verify token is not empty or invalid
      if (accessToken && accessToken.length > 0) {
        return NextResponse.json({ 
          authenticated: true, 
          tokenPresent: true,
          message: 'Valid Spotify access token found'
        });
      }
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