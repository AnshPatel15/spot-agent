/**
 * Music Agent using LangChain
 * Handles Spotify API interactions and provides music recommendations
 */

import { createBasicLLM } from '../llms/openrouter.js';
import { spotifyTools } from '../tools/spotify-tool';
import { lastfmTools } from '../tools/lastfm-tool';
import {
  HumanMessage,
  AIMessage,
  SystemMessage,
  ToolMessage,
  BaseMessage,
} from '@langchain/core/messages';

type SendFn = (data: Record<string, unknown>) => void;
type HistoryMessage = { role: 'user' | 'assistant'; content: string };

function extractTextContent(content: unknown): string {
  if (typeof content === 'string') return content;
  if (Array.isArray(content)) {
    return content
      .filter((c: any) => c.type === 'text')
      .map((c: any) => c.text ?? '')
      .join('');
  }
  return '';
}

const allTools = [...spotifyTools, ...lastfmTools];

function buildSystemPrompt(): string {
  const now = new Date();
  const dateStr = now.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

  return `You are a helpful music assistant connected to both Last.fm and Spotify.
Today's date is ${dateStr}.

IMPORTANT — your training data has a knowledge cutoff, but your TOOLS have real-time access to Spotify and Last.fm. When a user asks for music from a specific year (including ${now.getFullYear()}), ALWAYS use tools to search — never refuse based on your training cutoff. For year-specific searches use Spotify's year filter: e.g. query="hip hop night drive year:${now.getFullYear()}".

Always call tools to provide real data — never fabricate track names or artists. Be efficient: answer in 1–3 tool calls maximum.

## Tool selection guide

**Mood / vibe requests** ("songs for a late-night drive", "chill study beats", "happy workout music"):
→ Use get_lastfm_tag_tracks with the closest mood tag (e.g. "night driving", "chill", "study", "workout").
  Then offer to search Spotify for the results or create a playlist.

**Year-specific music** ("2026 hip hop", "songs released this year"):
→ Use search_spotify_tracks with query including "year:${now.getFullYear()}" e.g. "hip hop night drive year:${now.getFullYear()}".
  Do NOT use Last.fm for year-specific requests — go straight to Spotify search.

**"Artists like X" / "similar to X artist"**:
→ Use get_lastfm_similar_artists, then search_spotify_tracks for their songs.

**"Songs like [track] by [artist]"**:
→ Use get_lastfm_similar_tracks.

**Album track listing** ("what songs are on X album"):
→ Use search_spotify_albums then get_spotify_album_tracks immediately.

**Direct Spotify search** ("find tracks by Artist", "search for Song Name"):
→ Use search_spotify_tracks.

**Playlist-based browsing** ("songs from the Lo-fi Chill playlist"):
→ Use search_spotify_playlists then get_spotify_playlist_tracks.

**Creating a Spotify playlist from suggestions**:
→ Gather track URIs with search_spotify_tracks, then create_spotify_playlist + add_tracks_to_spotify_playlist.

Available tools:
Last.fm (recommendations — not year-specific):
- get_lastfm_tag_tracks: Top tracks by mood/genre tag — PRIMARY for mood queries
- get_lastfm_similar_artists: Artists similar to a given artist
- get_lastfm_similar_tracks: Tracks similar to a specific song

Spotify (library & playlists — has real-time data including ${now.getFullYear()} releases):
- search_spotify_tracks: Search for tracks (supports year:YYYY filter in query)
- search_spotify_albums / get_spotify_album_tracks: Album track listings
- search_spotify_playlists / get_spotify_playlist_tracks: Browse playlists
- create_spotify_playlist / add_tracks_to_spotify_playlist: Create playlists
- get_spotify_track_details / get_spotify_user_profile: Details & profile`;
}

const TOOL_STATUS: Record<string, string> = {
  get_lastfm_tag_tracks:          'Finding tracks by mood…',
  get_lastfm_similar_artists:     'Finding similar artists…',
  get_lastfm_similar_tracks:      'Finding similar tracks…',
  search_spotify_playlists:       'Searching playlists…',
  get_spotify_playlist_tracks:    'Getting tracks…',
  search_spotify_tracks:          'Searching tracks…',
  search_spotify_albums:          'Searching albums…',
  get_spotify_album_tracks:       'Getting album tracks…',
  get_spotify_track_details:      'Getting track details…',
  create_spotify_playlist:        'Creating playlist…',
  add_tracks_to_spotify_playlist: 'Adding tracks to playlist…',
  get_spotify_user_profile:       'Getting profile…',
};

/**
 * Proper agentic loop — supports multi-step tool calling.
 * Uses LangChain typed messages (HumanMessage, AIMessage, ToolMessage) throughout
 * so the conversation format is consistent across all rounds.
 */
export async function processMusicMessageStream(
  message: string,
  accessToken: string | undefined,
  send: SendFn,
  history: HistoryMessage[] = []
): Promise<void> {
  const llm = createBasicLLM();
  const llmWithTools = llm.bindTools(allTools);

  // Build typed conversation — includes previous turns for follow-up context
  const conversation: BaseMessage[] = [
    new SystemMessage(buildSystemPrompt()),
    ...history.map(msg =>
      msg.role === 'user' ? new HumanMessage(msg.content) : new AIMessage(msg.content)
    ),
    new HumanMessage(message),
  ];

  const MAX_ROUNDS = 8;

  for (let round = 0; round < MAX_ROUNDS; round++) {
    send({ type: 'status', message: round === 0 ? 'Thinking…' : 'Continuing…' });

    let response: AIMessage;
    try {
      response = (await llmWithTools.invoke(conversation)) as AIMessage;
    } catch (err) {
      send({ type: 'error', message: `LLM error: ${err instanceof Error ? err.message : 'Unknown error'}` });
      return;
    }

    // No tool calls = final text response — send content directly (no extra LLM call)
    if (!response.tool_calls?.length) {
      const content = extractTextContent(response.content);
      if (content) {
        send({ type: 'token', content });
      } else {
        send({ type: 'error', message: 'No response generated. Please try again.' });
      }
      return;
    }

    // Add the AI's tool-call message using its native typed form
    conversation.push(response);

    // Execute each tool and append results as typed ToolMessages
    for (let i = 0; i < response.tool_calls.length; i++) {
      const toolCall = response.tool_calls[i];
      send({ type: 'status', message: TOOL_STATUS[toolCall.name] ?? 'Working…' });

      const tool = allTools.find(t => t.name === toolCall.name);
      let toolResult: unknown;

      if (tool) {
        try {
          toolResult = await (tool as any).func({ ...toolCall.args, accessToken });
        } catch (err) {
          toolResult = { error: err instanceof Error ? err.message : 'Tool execution failed' };
        }
      } else {
        toolResult = { error: `Unknown tool: ${toolCall.name}` };
      }

      // Ensure we always have a valid tool_call_id and string content
      const toolCallId = toolCall.id ?? `call_${Date.now()}_${i}`;
      const resultContent = JSON.stringify(toolResult) ?? 'null';

      conversation.push(
        new ToolMessage({ tool_call_id: toolCallId, content: resultContent })
      );
    }
  }

  // Safety net if max rounds exceeded
  send({ type: 'error', message: 'The agent took too many steps. Please try a simpler query.' });
}


