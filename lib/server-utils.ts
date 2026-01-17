import { cookies } from 'next/headers';

/**
 * Server-side utilities for cookie operations
 * These can only be used in Server Components or API routes
 */

/**
 * Get Spotify access token from cookies
 * @returns {Promise<string|null>} Spotify access token or null if not found
 */
export async function getSpotifyAccessToken() {
  const cookieStore = await cookies();
  return cookieStore.get('spotify_access_token')?.value || null;
}

/**
 * Get Spotify refresh token from cookies
 * @returns {Promise<string|null>} Spotify refresh token or null if not found
 */
export async function getSpotifyRefreshToken() {
  const cookieStore = await cookies();
  return cookieStore.get('spotify_refresh_token')?.value || null;
}

/**
 * Check if user is authenticated
 * @returns {Promise<boolean>} True if authenticated, false otherwise
 */
export async function isAuthenticated() {
  const accessToken = await getSpotifyAccessToken();
  return !!accessToken;
}