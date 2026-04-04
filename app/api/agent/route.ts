/**
 * Music Agent API Route — streams responses via Server-Sent Events (SSE)
 * so the browser never hits an idle timeout during long LLM / tool calls.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { processMusicMessageStream } from '../../../lib/agents/musicAgent';

const SSE_HEADERS = {
  'Content-Type':  'text/event-stream',
  'Cache-Control': 'no-cache',
  'Connection':    'keep-alive',
};

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { message, history = [] } = body;

  if (!message || typeof message !== 'string') {
    return NextResponse.json({ error: 'Message is required and must be a string' }, { status: 400 });
  }

  if (!process.env.OPENROUTER_API_KEY) {
    return NextResponse.json({ error: 'OpenRouter API key is not configured on the server.' }, { status: 500 });
  }

  const session = await getServerSession(authOptions);
  const accessToken = session?.accessToken;

  const encoder = new TextEncoder();
  let isClosed = false;

  const stream = new ReadableStream({
    async start(controller) {
      // Guard against "Controller is already closed" errors (e.g. client disconnects)
      const send = (data: Record<string, unknown>) => {
        if (isClosed) return;
        try {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
        } catch {
          isClosed = true;
        }
      };

      try {
        await processMusicMessageStream(message, accessToken, send, history);
      } catch (error) {
        console.error('Agent stream error:', error);
        send({ type: 'error', message: 'Sorry, I encountered an error processing your request.' });
      } finally {
        send({ type: 'done' });
        isClosed = true;
        try { controller.close(); } catch { /* already closed */ }
      }
    },
    cancel() {
      // Client disconnected — stop sending
      isClosed = true;
    },
  });

  return new Response(stream, { headers: SSE_HEADERS });
}

export async function GET(request: NextRequest) {
  const sessionId = request.nextUrl.searchParams.get('sessionId') || 'default';
  return NextResponse.json({ history: [], sessionId });
}

