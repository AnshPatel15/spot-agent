import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function getSpotifyAccessToken() {
  const session = await getServerSession(authOptions);
  return session?.accessToken ?? null;
}

export async function isAuthenticated() {
  const session = await getServerSession(authOptions);
  return !!session?.accessToken;
}
