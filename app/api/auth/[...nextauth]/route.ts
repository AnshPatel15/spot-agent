import NextAuth from 'next-auth';
import SpotifyProvider from 'next-auth/providers/spotify';
import type { NextAuthOptions } from 'next-auth';

const handler = NextAuth({
  providers: [
    SpotifyProvider({
      clientId: process.env.SPOTIFY_CLIENT_ID!,
      clientSecret: process.env.SPOTIFY_CLIENT_SECRET!,
    }),
  ],
  callbacks: {
    async jwt({ token, account }) {
      // Persist Spotify tokens to JWT
      if (account) {
        token.accessToken = (account as any).access_token as string;
        token.refreshToken = (account as any).refresh_token as string;
        token.expiresAt = Date.now() + ((account as any).expires_in ?? 3600) * 1000;
      }
      return token;
    },
    async session({ session, token }) {
      if (token) {
        session.accessToken = token.accessToken as string;
        session.refreshToken = token.refreshToken as string;
        session.expiresAt = token.expiresAt as number;
      }
      return session;
    },
  },
  pages: {
    signIn: '/auth/signin',
  },
} satisfies NextAuthOptions);

export { handler as GET, handler as POST };