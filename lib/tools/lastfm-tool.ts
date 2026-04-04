/**
 * Last.fm tools — replacement for the deprecated Spotify recommendations endpoint.
 *
 * All calls are read-only and require only LASTFM_API_KEY (no OAuth).
 *
 * Three tools:
 *  - get_lastfm_tag_tracks    → top tracks for a mood/genre tag  (primary mood tool)
 *  - get_lastfm_similar_artists → artists similar to a given artist
 *  - get_lastfm_similar_tracks  → tracks similar to a given track
 */

import { tool } from '@langchain/core/tools';
import { z } from 'zod';

const BASE = 'https://ws.audioscrobbler.com/2.0/';

function apiKey() {
  const key = process.env.LASTFM_API_KEY;
  if (!key) throw new Error('LASTFM_API_KEY environment variable is not set');
  return key;
}

async function lastfmFetch(params: Record<string, string>) {
  const url = new URL(BASE);
  url.searchParams.set('api_key', apiKey());
  url.searchParams.set('format', 'json');
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);

  const res = await fetch(url.toString());
  if (!res.ok) throw new Error(`Last.fm API error: ${res.status} ${res.statusText}`);
  return res.json();
}

// ---------------------------------------------------------------------------
// get_lastfm_tag_tracks
// ---------------------------------------------------------------------------

export const getLastfmTagTracks = tool(
  async ({ tag, limit = 15 }) => {
    try {
      const data = await lastfmFetch({ method: 'tag.getTopTracks', tag, limit: String(limit) });
      const tracks = data?.tracks?.track;
      if (!tracks?.length) return { success: false, error: `No tracks found for tag "${tag}"`, tracks: [] };

      return {
        success: true,
        tag,
        tracks: tracks.map((t: any) => ({
          name:   t.name,
          artist: typeof t.artist === 'string' ? t.artist : t.artist?.name,
          url:    t.url,
          rank:   t['@attr']?.rank,
        })),
      };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error', tracks: [] };
    }
  },
  {
    name: 'get_lastfm_tag_tracks',
    description: `Get top tracks for a mood, genre, or activity tag from Last.fm.
This is the PRIMARY tool for mood-based requests ("late-night drive", "workout", "study", "happy").
Map the mood to a Last.fm tag — use short, common tags:
- Late-night / drive  → "night driving" or "late night"
- Chill / relax       → "chill" or "chillout"
- Study / focus       → "study" or "concentration"
- Workout / energetic → "workout" or "running"
- Happy / upbeat      → "happy" or "feel good"
- Sad / melancholic   → "sad" or "melancholy"
- Romantic            → "romantic" or "love songs"
- Indie / alternative → "indie" or "indie pop"
After getting tracks, offer to search Spotify for them or create a playlist.`,
    schema: z.object({
      tag:   z.string().describe('Last.fm tag name (mood, genre, or activity)'),
      limit: z.number().optional().default(15).describe('Number of tracks to return (max 50)'),
    }),
  }
);

// ---------------------------------------------------------------------------
// get_lastfm_similar_artists
// ---------------------------------------------------------------------------

export const getLastfmSimilarArtists = tool(
  async ({ artist, limit = 8 }) => {
    try {
      const data = await lastfmFetch({ method: 'artist.getSimilar', artist, limit: String(limit) });
      const artists = data?.similarartists?.artist;
      if (!artists?.length) return { success: false, error: `No similar artists found for "${artist}"`, artists: [] };

      return {
        success: true,
        seed: artist,
        artists: artists.map((a: any) => ({
          name:  a.name,
          match: parseFloat(a.match).toFixed(2),
          url:   a.url,
        })),
      };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error', artists: [] };
    }
  },
  {
    name: 'get_lastfm_similar_artists',
    description: 'Get artists similar to a given artist using Last.fm data. Use when the user asks for artists "like X" or "similar to X". After getting results, search Spotify for their tracks.',
    schema: z.object({
      artist: z.string().describe('Artist name to find similar artists for'),
      limit:  z.number().optional().default(8).describe('Number of similar artists to return'),
    }),
  }
);

// ---------------------------------------------------------------------------
// get_lastfm_similar_tracks
// ---------------------------------------------------------------------------

export const getLastfmSimilarTracks = tool(
  async ({ track, artist, limit = 10 }) => {
    try {
      const data = await lastfmFetch({ method: 'track.getSimilar', track, artist, limit: String(limit) });
      const tracks = data?.similartracks?.track;
      if (!tracks?.length) return { success: false, error: `No similar tracks found for "${track}" by "${artist}"`, tracks: [] };

      return {
        success: true,
        seed: { track, artist },
        tracks: tracks.map((t: any) => ({
          name:   t.name,
          artist: typeof t.artist === 'string' ? t.artist : t.artist?.name,
          match:  parseFloat(t.match).toFixed(2),
          url:    t.url,
        })),
      };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error', tracks: [] };
    }
  },
  {
    name: 'get_lastfm_similar_tracks',
    description: 'Get tracks similar to a specific song using Last.fm data. Use when the user says "more songs like [song] by [artist]".',
    schema: z.object({
      track:  z.string().describe('Track name'),
      artist: z.string().describe('Artist name'),
      limit:  z.number().optional().default(10).describe('Number of similar tracks to return'),
    }),
  }
);

export const lastfmTools = [getLastfmTagTracks, getLastfmSimilarArtists, getLastfmSimilarTracks];
