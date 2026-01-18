/**
 * Music Agent API Route
 * Handles chat interactions with the music assistant
 */

import { NextRequest, NextResponse } from 'next/server';
import { processMusicMessage, simpleMusicChat } from '../../../lib/agents/musicAgent';
// import { getServerSession } from 'next-auth/next'; // Commented out - will use direct token handling

// Simple in-memory storage for chat history (in production, use a database)
const chatHistory = new Map<string, Array<{role: string, content: string}>>();

export async function POST(request: NextRequest) {
  console.log('Agent API called');

  try {
    const body = await request.json();
    const { message, sessionId = 'default', useSpotify = false } = body;

    console.log('Request body:', { message: message?.substring(0, 100), sessionId, useSpotify });

    if (!message || typeof message !== 'string') {
      console.log('Invalid message format');
      return NextResponse.json(
        { error: 'Message is required and must be a string' },
        { status: 400 }
      );
    }

    // Check if OPENROUTER_API_KEY is available
    if (!process.env.OPENROUTER_API_KEY) {
      console.log('OPENROUTER_API_KEY not set');
      return NextResponse.json(
        { error: 'API key not configured', message: 'OpenRouter API key is not configured on the server.' },
        { status: 500 }
      );
    }

    console.log('OPENROUTER_API_KEY is set, proceeding...');

    // Check for access token in request body or cookies
    let accessToken = body.accessToken as string | undefined;

    // If no token in body, check cookies
    if (!accessToken) {
      const cookieToken = (request as any).cookies?.get?.('spotify_access_token')?.value;
      if (cookieToken) {
        accessToken = cookieToken;
        console.log('Using access token from cookies');
      }
    }

    let response;

    console.log('Calling LLM...', { useSpotify, hasAccessToken: !!accessToken });

    // Always try to use the agent with Spotify tools first
    // The tools will handle missing access tokens gracefully
    try {
      response = await processMusicMessage(message, accessToken);
      console.log('Agent with tools succeeded');
    } catch (agentError) {
      console.log('Agent with tools failed, falling back to simple chat:', agentError);
      // Fall back to simple chat if agent fails
      const chatResponse = await simpleMusicChat(message);
      response = {
        success: true,
        response: chatResponse,
      };
    }

    console.log('LLM response received:', { success: response.success, responseLength: response.response?.length });

    // Store chat history
    if (!chatHistory.has(sessionId)) {
      chatHistory.set(sessionId, []);
    }

    const history = chatHistory.get(sessionId)!;
    history.push({ role: 'user', content: message });
    history.push({ role: 'assistant', content: typeof response.response === 'string' ? response.response : JSON.stringify(response.response) });

    // Keep only last 20 messages to prevent memory issues
    if (history.length > 40) {
      history.splice(0, history.length - 40);
    }

    return NextResponse.json({
      success: response.success,
      message: response.response,
      sessionId,
      hasSpotifyAccess: !!accessToken,
      toolResults: response.toolResults,
    });

  } catch (error) {
    console.error('Agent API error:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        message: 'Sorry, I encountered an error processing your request.',
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  const sessionId = request.nextUrl.searchParams.get('sessionId') || 'default';

  const history = chatHistory.get(sessionId) || [];

  return NextResponse.json({
    history,
    sessionId,
  });
}
