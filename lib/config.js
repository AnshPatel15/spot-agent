/**
 * Configuration loader for environment variables.
 * Learning: Always validate env vars early to fail fast.
 */

// TODO: Implement env validation with zod or similar
export const config = {
  spotify: {
    clientId: process.env.SPOTIFY_CLIENT_ID,
    clientSecret: process.env.SPOTIFY_CLIENT_SECRET,
    redirectUri: process.env.SPOTIFY_REDIRECT_URI || 'http://localhost:3000/api/auth/callback',
  },
  openrouter: {
    apiKey: process.env.OPENROUTER_API_KEY,
  },
};