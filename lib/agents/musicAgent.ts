/**
 * Music Agent using LangChain
 * Handles Spotify API interactions and provides music recommendations
 */

import { ChatOpenAI } from '@langchain/openai';
import { createBasicLLM } from '../llms/openrouter.js';
import { spotifyTools } from '../tools/spotify-tool';

/**
 * Process a user message with Spotify tools
 * @param {string} message - User message
 * @param {string} accessToken - Spotify access token
 * @returns {Promise<Object>} Agent response
 */
export async function processMusicMessage(message: string, accessToken?: string) {
  try {
    const llm = createBasicLLM();

    // Bind tools to LLM
    const llmWithTools = llm.bindTools(spotifyTools);

    const systemPrompt = `You are a helpful music assistant that can search Spotify, get track information, create playlists, and provide music recommendations.

You have access to Spotify's API through various tools. Always call tools to provide real data — never fabricate track names or artists.

## Tool selection guide

**Mood / vibe requests** ("songs for a late-night drive", "upbeat workout music", "chill study beats"):
→ Use search_spotify_playlists with a descriptive mood/vibe keyword to find curated playlists,
  then call get_spotify_playlist_tracks on the most relevant result to extract the actual songs.
  Example: query "late night drive chill" → get tracks from the top playlist result.
  Pick 2–3 playlists and combine tracks for variety if needed.

**Album track listing** ("what songs are on X album"):
→ Use search_spotify_albums to find the album, then immediately call get_spotify_album_tracks.

**Direct search** ("find tracks by Artist", "search for Song Name"):
→ Use search_spotify_tracks.

**Creating a playlist from suggestions**:
→ First gather track URIs using the search/playlist tools, then call create_spotify_playlist
  followed by add_tracks_to_spotify_playlist.

Available tools:
- search_spotify_playlists: Find curated playlists by mood/genre/activity keyword (PRIMARY for mood queries)
- get_spotify_playlist_tracks: Get songs from a specific playlist
- search_spotify_tracks: Search for individual tracks
- search_spotify_albums: Search for albums
- get_spotify_album_tracks: Get all tracks from an album
- get_spotify_track_details: Get detailed info for a specific track
- create_spotify_playlist: Create a new playlist
- add_tracks_to_spotify_playlist: Add tracks to a playlist
- get_spotify_user_profile: Get user profile`;

    const messages = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: message }
    ];

    console.log('Invoking LLM with tools...');
    const response = await llmWithTools.invoke(messages);
    console.log('LLM response:', response);
    console.log('Tool calls:', response.tool_calls);

    // Check if tools were called
    if (response.tool_calls && response.tool_calls.length > 0) {
      // Execute the tools and get results
      const toolResults = [];
      let foundAlbum = null;
      let shouldGetTracks = message.toLowerCase().includes('songs') ||
                           message.toLowerCase().includes('tracks') ||
                           message.toLowerCase().includes('list');

      for (const toolCall of response.tool_calls) {
        const tool = spotifyTools.find(t => t.name === toolCall.name);
        if (tool) {
          try {
            // Add access token to tool arguments
            const toolArgs = {
              ...toolCall.args,
              accessToken: accessToken,
            };
            const result = await (tool as any).func(toolArgs);
            toolResults.push({
              tool: toolCall.name,
              result: result,
            });

            // If this was an album search and user wants tracks, store the album for later
            if (toolCall.name === 'search_spotify_albums' && shouldGetTracks && result.success && result.albums?.length > 0) {
              foundAlbum = result.albums[0]; // Take the first (most relevant) album
            }
          } catch (error) {
            toolResults.push({
              tool: toolCall.name,
              error: error instanceof Error ? error.message : 'Tool execution failed',
            });
          }
        }
      }

      // If we found an album and user wants tracks, automatically get the tracks
      if (foundAlbum && shouldGetTracks) {
        console.log('Automatically fetching tracks for album:', foundAlbum.name);
        try {
          const tracksTool = spotifyTools.find(t => t.name === 'get_spotify_album_tracks');
          if (tracksTool) {
            const tracksResult = await (tracksTool as any).func({
              albumId: foundAlbum.id,
              accessToken: accessToken,
            });
            toolResults.push({
              tool: 'get_spotify_album_tracks',
              result: tracksResult,
            });
          }
        } catch (error) {
          toolResults.push({
            tool: 'get_spotify_album_tracks',
            error: error instanceof Error ? error.message : 'Failed to get album tracks',
          });
        }
      }

      // Generate final response with tool results
      const toolResultsText = toolResults.map(tr =>
        `Tool: ${tr.tool}\nResult: ${tr.result ? JSON.stringify(tr.result, null, 2) : tr.error}`
      ).join('\n\n');

      const finalPrompt = `${systemPrompt}

Tool Results:
${toolResultsText}

Based on the above tool results, provide a helpful response to the user's query: "${message}"`;

      const finalResponse = await llm.invoke(finalPrompt);
      return {
        success: true,
        response: finalResponse.content,
        toolResults: toolResults,
      };
    } else {
      // No tools called, return direct response
      return {
        success: true,
        response: response.content,
      };
    }
  } catch (error) {
    console.error('Music agent error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
      response: 'Sorry, I encountered an error while processing your request. Please try again.',
    };
  }
}



/**
 * Simple chat function without full agent setup (for basic responses)
 * @param {string} message - User message
 * @returns {Promise<string>} LLM response
 */
export async function simpleMusicChat(message: string): Promise<string> {
  console.log('Simple chat called with message:', message);

  try {
    console.log('Creating LLM instance...');
    const llm = createBasicLLM();
    console.log('LLM instance created');

    const prompt = `You are a music assistant. Respond helpfully to: ${message}

Keep your response conversational and engaging. If the user is asking about specific music, suggest they connect their Spotify account for more detailed information.`;

    console.log('Invoking LLM with prompt length:', prompt.length);
    const response = await llm.invoke(prompt);
    console.log('LLM response received:', typeof response, response);

    const content = response.content as string;
    console.log('Response content:', content);

    return content;
  } catch (error) {
    console.error('Simple chat error:', error);
    console.error('Error details:', error instanceof Error ? error.message : String(error), error instanceof Error ? error.stack : undefined);
    return 'Sorry, I encountered an error. Please try again.';
  }
}
