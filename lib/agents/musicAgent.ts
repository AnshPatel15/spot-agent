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

You have access to Spotify's API through various tools. When a user asks about music, artists, albums, or songs, use the appropriate Spotify tools to provide accurate information.

CRITICAL: When users ask for songs/tracks from a specific album, you MUST:
1. First call search_spotify_albums to find the album
2. Then immediately call get_spotify_album_tracks with the album ID to get the complete track list
3. Present the track list with song names, artists, track numbers, and durations

Always be helpful and engaging. If you need to use Spotify tools, make sure you have the access token available. If something goes wrong, explain what happened and suggest alternatives.

Available tools:
- search_spotify_tracks: Search for individual tracks by query
- search_spotify_albums: Search for albums by query (use this when users mention specific albums)
- get_spotify_album_tracks: Get all tracks from a specific album (ALWAYS call this after finding an album to show the track list)
- get_spotify_track_details: Get detailed information about a specific track
- create_spotify_playlist: Create a new playlist
- add_tracks_to_spotify_playlist: Add tracks to an existing playlist
- get_spotify_user_profile: Get user profile information

When searching for music, provide relevant details like artist names, album names, track numbers, and direct links when possible.

IMPORTANT: Never just mention that you'll get tracks - actually call the get_spotify_album_tracks tool immediately after finding an album.`;

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
