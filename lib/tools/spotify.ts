/**
 * Custom Spotify API utilities.
 * Uses spotify-web-api-node lib for easy Spotify API access.
 */

import SpotifyWebApi from 'spotify-web-api-node';

/**
 * Get Spotify API client with access token
 * @param {string} accessToken - Spotify access token
 * @returns {SpotifyWebApi} Configured Spotify API client
 */
export function getSpotifyClient(accessToken: string) {
  const spotifyApi = new SpotifyWebApi();
  spotifyApi.setAccessToken(accessToken);
  return spotifyApi;
}

/**
 * Search for tracks on Spotify
 * @param {SpotifyWebApi} spotifyApi - Configured Spotify client
 * @param {string} query - Search query
 * @param {number} limit - Number of results to return
 * @returns {Promise<Array>} Array of track objects
 */
export async function searchTracks(spotifyApi: SpotifyWebApi, query: string, limit = 5) {
  try {
    const response = await spotifyApi.searchTracks(query, { limit });
    return response.body.tracks?.items || [];
  } catch (error) {
    console.error('Spotify search error:', error);
    return [];
  }
}

export async function getTrackDetails(spotifyApi: SpotifyWebApi, trackId: string) {
  try {
    const response = await spotifyApi.getTrack(trackId);
    return response.body;
  } catch (error) {
    console.error('Spotify get track error:', error);
    return null;
  }
}

/**
 * Create a new playlist 
 * @param {SpotifyWebApi} spotifyApi - Configured Spotify client
 * @param {string} name - Playlist name (required)
 * @param {string} description - Playlist description
 * @returns {Promise<SpotifyApi.CreatePlaylistResponse>} Created playlist object
 */
export async function createPlaylist(spotifyApi: SpotifyWebApi, name: string, description = '') {
  try {
    // `@types/spotify-web-api-node` expects (playlistName, options?)
    const playlist = await spotifyApi.createPlaylist(name, {
      description: description,
      public: false,
    });
    return playlist;
  } catch (error) {
    console.error('Spotify create playlist error:', error);
    return null;
  }
}
        
/**
 * Add tracks to a playlist
 * @param {SpotifyWebApi} spotifyApi - Configured Spotify client
 * @param {string} playlistId - Playlist ID
 * @param {Array<string>} trackUris - Array of track URIs
 * @returns {Promise<Object>} Response from Spotify API
 */
export async function addTracksToPlaylist(spotifyApi: SpotifyWebApi, playlistId: string, trackUris: string[]) {
  try {
    const response = await spotifyApi.addTracksToPlaylist(playlistId, trackUris);
    return response.body;
  } catch (error) {
    console.error('Spotify add tracks error:', error);
    return null;
  }
}

/**
 * Get current user's profile
 * @param {SpotifyWebApi} spotifyApi - Configured Spotify client
 * @returns {Promise<Object>} User profile object
 */
export async function getUserProfile(spotifyApi: SpotifyWebApi) {
  try {
    const response = await spotifyApi.getMe();
    return response.body;
  } catch (error) {
    console.error('Spotify get user error:', error);
    return null;
  }
}