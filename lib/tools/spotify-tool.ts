/**
 * LangChain tool for Spotify API integration
 * Wraps Spotify utilities into LangChain-compatible tools
 */

import { tool } from '@langchain/core/tools';
import { z } from 'zod';
import { getSpotifyClient, searchTracks, getTrackDetails, createPlaylist, addTracksToPlaylist, getUserProfile, getPlaylistTracks, getRecommendations } from './spotify';

/**
 * Tool for searching Spotify tracks
 */
export const searchSpotifyTracks = tool(async ({ query, limit = 5, accessToken }) => {
  try {
    if (!accessToken) {
      return {
        success: false,
        error: 'Spotify access token required. Please sign in with Spotify to search for tracks.',
        tracks: [],
        message: 'To search for songs on Spotify, you need to connect your Spotify account. Click the "Sign In" button above.',
      };
    }

    const spotifyApi = getSpotifyClient(accessToken);
    const tracks = await searchTracks(spotifyApi, query, limit);

    return {
      success: true,
      tracks: tracks.map(track => ({
        id: track.id,
        name: track.name,
        artists: track.artists.map(artist => artist.name),
        album: track.album.name,
        uri: track.uri,
        external_urls: track.external_urls,
        preview_url: track.preview_url,
        duration_ms: track.duration_ms,
      })),
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      tracks: [],
    };
  }
}, {
  name: 'search_spotify_tracks',
  description: 'Search for tracks on Spotify by query. Returns track information including name, artists, album, and Spotify URI. Requires Spotify authentication.',
  schema: z.object({
    query: z.string().describe('Search query for tracks (song name, artist, album, etc.)'),
    limit: z.number().optional().default(5).describe('Maximum number of results to return'),
    accessToken: z.string().optional().describe('Spotify access token'),
  }),
});

/**
 * Tool for getting detailed track information
 */
export const getSpotifyTrackDetails = tool(async ({ trackId, accessToken }) => {
  try {
    const spotifyApi = getSpotifyClient(accessToken);
    const track = await getTrackDetails(spotifyApi, trackId);

    if (!track) {
      return {
        success: false,
        error: 'Track not found',
      };
    }

    return {
      success: true,
      track: {
        id: track.id,
        name: track.name,
        artists: track.artists.map(artist => artist.name),
        album: {
          name: track.album.name,
          release_date: track.album.release_date,
          total_tracks: track.album.total_tracks,
        },
        duration_ms: track.duration_ms,
        popularity: track.popularity,
        external_urls: track.external_urls,
        preview_url: track.preview_url,
        uri: track.uri,
      },
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}, {
  name: 'get_spotify_track_details',
  description: 'Get detailed information about a specific Spotify track by its ID.',
  schema: z.object({
    trackId: z.string().describe('Spotify track ID'),
    accessToken: z.string().describe('Spotify access token'),
  }),
});

/**
 * Tool for creating a Spotify playlist
 */
export const createSpotifyPlaylist = tool(async ({ name, description = '', accessToken }) => {
  try {
    const spotifyApi = getSpotifyClient(accessToken);
    const playlist = await createPlaylist(spotifyApi, name, description);

    if (!playlist) {
      return {
        success: false,
        error: 'Failed to create playlist',
      };
    }

    return {
      success: true,
      playlist: {
        id: playlist.body.id,
        name: playlist.body.name,
        description: playlist.body.description,
        uri: playlist.body.uri,
        external_urls: playlist.body.external_urls,
      },
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}, {
  name: 'create_spotify_playlist',
  description: 'Create a new Spotify playlist for the authenticated user.',
  schema: z.object({
    name: z.string().describe('Name of the playlist'),
    description: z.string().optional().default('').describe('Description of the playlist'),
    accessToken: z.string().describe('Spotify access token'),
  }),
});

/**
 * Tool for adding tracks to a playlist
 */
export const addTracksToSpotifyPlaylist = tool(async ({ playlistId, trackUris, accessToken }) => {
  try {
    const spotifyApi = getSpotifyClient(accessToken);
    const result = await addTracksToPlaylist(spotifyApi, playlistId, trackUris);

    if (!result) {
      return {
        success: false,
        error: 'Failed to add tracks to playlist',
      };
    }

    return {
      success: true,
      snapshot_id: result.snapshot_id,
      message: `Added ${trackUris.length} tracks to playlist`,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}, {
  name: 'add_tracks_to_spotify_playlist',
  description: 'Add tracks to an existing Spotify playlist.',
  schema: z.object({
    playlistId: z.string().describe('Spotify playlist ID'),
    trackUris: z.array(z.string()).describe('Array of Spotify track URIs to add'),
    accessToken: z.string().describe('Spotify access token'),
  }),
});

/**
 * Tool for searching Spotify albums
 */
export const searchSpotifyAlbums = tool(async ({ query, limit = 5, accessToken }) => {
  try {
    if (!accessToken) {
      return {
        success: false,
        error: 'Spotify access token required. Please sign in with Spotify to search for albums.',
        albums: [],
        message: 'To search for albums on Spotify, you need to connect your Spotify account. Click the "Sign In" button above.',
      };
    }

    const spotifyApi = getSpotifyClient(accessToken);
    const response = await spotifyApi.searchAlbums(query, { limit });

    return {
      success: true,
      albums: response.body.albums?.items.map(album => ({
        id: album.id,
        name: album.name,
        artists: album.artists.map(artist => artist.name),
        release_date: album.release_date,
        total_tracks: album.total_tracks,
        uri: album.uri,
        external_urls: album.external_urls,
        images: album.images,
      })) || [],
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      albums: [],
    };
  }
}, {
  name: 'search_spotify_albums',
  description: 'Search for albums on Spotify by query. Returns album information including name, artists, release date, and track count.',
  schema: z.object({
    query: z.string().describe('Search query for albums (album name, artist, etc.)'),
    limit: z.number().optional().default(5).describe('Maximum number of results to return'),
    accessToken: z.string().optional().describe('Spotify access token'),
  }),
});

/**
 * Tool for getting tracks from a specific album
 */
export const getSpotifyAlbumTracks = tool(async ({ albumId, limit = 50, accessToken }) => {
  try {
    if (!accessToken) {
      return {
        success: false,
        error: 'Spotify access token required. Please sign in with Spotify to get album tracks.',
        tracks: [],
        message: 'To view album tracks on Spotify, you need to connect your Spotify account. Click the "Sign In" button above.',
      };
    }

    const spotifyApi = getSpotifyClient(accessToken);
    const response = await spotifyApi.getAlbumTracks(albumId, { limit });

    return {
      success: true,
      tracks: response.body.items.map(track => ({
        id: track.id,
        name: track.name,
        artists: track.artists.map(artist => artist.name),
        track_number: track.track_number,
        duration_ms: track.duration_ms,
        uri: track.uri,
        external_urls: track.external_urls,
        preview_url: track.preview_url,
      })),
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      tracks: [],
    };
  }
}, {
  name: 'get_spotify_album_tracks',
  description: 'Get all tracks from a specific Spotify album by album ID.',
  schema: z.object({
    albumId: z.string().describe('Spotify album ID'),
    limit: z.number().optional().default(50).describe('Maximum number of tracks to return'),
    accessToken: z.string().optional().describe('Spotify access token'),
  }),
});

/**
 * Tool for getting user profile information
 */
export const getSpotifyUserProfile = tool(async ({ accessToken }) => {
  try {
    const spotifyApi = getSpotifyClient(accessToken);
    const profile = await getUserProfile(spotifyApi);

    if (!profile) {
      return {
        success: false,
        error: 'Failed to get user profile',
      };
    }

    return {
      success: true,
      user: {
        id: profile.id,
        display_name: profile.display_name,
        email: profile.email,
        country: profile.country,
        followers: profile.followers?.total || 0,
        external_urls: profile.external_urls,
        uri: profile.uri,
      },
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}, {
  name: 'get_spotify_user_profile',
  description: 'Get the current authenticated Spotify user profile information.',
  schema: z.object({
    accessToken: z.string().describe('Spotify access token'),
  }),
});

/**
 * Search for playlists by name for suggestions
 */
export const searchSpotifyPlaylists = tool(async ({ query, limit = 5, accessToken }) => {
  try {
    if (!accessToken) {
      return {
        success: false,
        error: 'Spotify access token required. Please sign in with Spotify to search playlists.',
        playlists: [],
        message: 'To search playlists on Spotify, you need to connect your Spotify account.',
      };
    }

    const spotifyApi = getSpotifyClient(accessToken);
    const response = await spotifyApi.searchPlaylists(query, { limit });
    return {
      success: true,
      playlists: response.body.playlists?.items.map(playlist => ({
        id: playlist.id,
        name: playlist.name,
        description: playlist.description,
        owner: playlist.owner.display_name,
        uri: playlist.uri,
        external_urls: playlist.external_urls,
      })) || [],
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      playlists: [],
    };
  }
}, {
  name: 'search_spotify_playlists',
  description: 'Search for Spotify playlists by name or mood keyword. Use this to find curated playlists, then call get_spotify_playlist_tracks to extract songs from them.',
  schema: z.object({
    query: z.string().describe('Search query for playlists (mood, genre, activity, etc.)'),
    limit: z.number().optional().default(5).describe('Maximum number of results to return'),
    accessToken: z.string().optional().describe('Spotify access token'),
  }),
});

/**
 * Get tracks from a specific playlist
 */
export const getSpotifyPlaylistTracks = tool(async ({ playlistId, limit = 20, accessToken }) => {
  try {
    if (!accessToken) {
      return { success: false, error: 'Spotify access token required.', tracks: [] };
    }
    const spotifyApi = getSpotifyClient(accessToken);
    const tracks = await getPlaylistTracks(spotifyApi, playlistId, limit);
    return {
      success: true,
      tracks: tracks.map(track => ({
        id: track.id,
        name: track.name,
        artists: track.artists.map(a => a.name),
        album: track.album.name,
        uri: track.uri,
        external_urls: track.external_urls,
        duration_ms: track.duration_ms,
      })),
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      tracks: [],
    };
  }
}, {
  name: 'get_spotify_playlist_tracks',
  description: 'Get tracks from a Spotify playlist by its ID. Use after search_spotify_playlists to retrieve the actual songs inside a curated playlist.',
  schema: z.object({
    playlistId:  z.string().describe('Spotify playlist ID'),
    limit:       z.number().optional().default(20).describe('Maximum number of tracks to return'),
    accessToken: z.string().optional().describe('Spotify access token'),
  }),
});

/**
 * Get mood-based recommendations via Spotify's recommendations endpoint.
 * This is the preferred approach for mood queries — maps directly to audio features
 * without needing to scrape playlists.
 */
export const getSpotifyRecommendations = tool(
  async ({ seedGenres, seedTracks, seedArtists, targetEnergy, targetValence, targetDanceability, targetTempo, limit = 10, accessToken }) => {
    if (!accessToken) {
      return { success: false, error: 'Spotify access token required.', tracks: [] };
    }
    const totalSeeds = (seedGenres?.length ?? 0) + (seedTracks?.length ?? 0) + (seedArtists?.length ?? 0);
    if (totalSeeds === 0) {
      return { success: false, error: 'Provide at least one seed (genre, track, or artist).', tracks: [] };
    }
    try {
      const spotifyApi = getSpotifyClient(accessToken);
      const options: Record<string, unknown> = { limit };
      if (seedGenres?.length)          options.seed_genres         = seedGenres.slice(0, 5);
      if (seedTracks?.length)          options.seed_tracks         = seedTracks.slice(0, 5);
      if (seedArtists?.length)         options.seed_artists        = seedArtists.slice(0, 5);
      if (targetEnergy != null)        options.target_energy       = targetEnergy;
      if (targetValence != null)       options.target_valence      = targetValence;
      if (targetDanceability != null)  options.target_danceability = targetDanceability;
      if (targetTempo != null)         options.target_tempo        = targetTempo;

      const tracks = await getRecommendations(
        spotifyApi,
        options as Parameters<typeof spotifyApi.getRecommendations>[0]
      );
      return {
        success: true,
        tracks: tracks.map(track => ({
          id: track.id,
          name: track.name,
          artists: track.artists.map(a => a.name),
          album: track.album.name,
          uri: track.uri,
          external_urls: track.external_urls,
          duration_ms: track.duration_ms,
        })),
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        tracks: [],
      };
    }
  },
  {
    name: 'get_spotify_recommendations',
    description: `Get Spotify track recommendations based on mood, genre, or seed tracks/artists.
PREFER THIS over playlist search for mood-based requests. Map mood to audio features:
- Happy/euphoric     → high valence (0.8+), high energy (0.7+)
- Sad/melancholic    → low valence (0.2-), low energy (0.3-)
- Calm/focus/study   → low-medium energy (0.2–0.4), medium valence
- Energetic/workout  → high energy (0.8+), high danceability (0.8+)
- Late-night/chill   → low tempo (60–90 BPM), low energy (0.3–0.5)
- Romantic           → medium energy (0.4–0.6), high valence (0.6+)
Example seed genres: pop, rock, hip-hop, jazz, electronic, classical, indie, r-n-b, chill, study, ambient`,
    schema: z.object({
      seedGenres:         z.array(z.string()).optional().describe('Up to 5 Spotify genre seeds'),
      seedTracks:         z.array(z.string()).optional().describe('Up to 5 Spotify track IDs as seeds'),
      seedArtists:        z.array(z.string()).optional().describe('Up to 5 Spotify artist IDs as seeds'),
      targetEnergy:       z.number().min(0).max(1).optional().describe('Target energy 0.0–1.0'),
      targetValence:      z.number().min(0).max(1).optional().describe('Target positiveness 0.0–1.0'),
      targetDanceability: z.number().min(0).max(1).optional().describe('Target danceability 0.0–1.0'),
      targetTempo:        z.number().optional().describe('Target tempo in BPM'),
      limit:              z.number().optional().default(10).describe('Number of tracks (max 100)'),
      accessToken:        z.string().optional().describe('Spotify access token'),
    }),
  }
);

/**
 * Array of all Spotify tools for easy import
 */
export const spotifyTools = [
  searchSpotifyTracks,
  getSpotifyTrackDetails,
  createSpotifyPlaylist,
  addTracksToSpotifyPlaylist,
  searchSpotifyAlbums,
  getSpotifyAlbumTracks,
  getSpotifyUserProfile,
  searchSpotifyPlaylists,
  getSpotifyPlaylistTracks,
  // getSpotifyRecommendations — removed: Spotify deprecated this endpoint for apps created after Nov 27 2024 (returns 404)
];
