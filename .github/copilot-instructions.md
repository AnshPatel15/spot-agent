# Copilot Instructions for Spotify Song Agent

## Architecture Overview

This is a Next.js 16 application that integrates LangChain AI agents with the Spotify API to create an AI-powered song suggestion and playlist creation system.

**Note**: Always use Context7 MCP for library/API documentation, code generation, setup, and configuration. This provides up-to-date, authoritative information without explicit requests.

**Important**: Never create `.md` files for instructions unless explicitly asked to do so.

### Key Components

1. **Authentication**: NextAuth.js with Spotify OAuth provider
   - Files: `app/api/auth/[...nextauth]/route.ts`, `types/next-auth.d.ts`
   - Stores Spotify tokens in JWT for client-side access
   - Custom session types extend NextAuth for token management

2. **AI Agent**: LangChain ReAct agent with Spotify tools
   - Core files: `lib/agents/songAgent.js`, `lib/tools/spotify.js`
   - Uses `@langchain/core` for agent framework
   - Spotify tools use `spotify-web-api-node` library

3. **LLM Integration**: OpenRouter via LangChain OpenAI compatibility
   - File: `lib/llms/openrouter.js`
   - Uses `@langchain/openai` package for OpenRouter API

4. **UI Components**: shadcn/ui with custom agent chat interface
   - Main chat: `components/AgentChat.js`
   - UI primitives: `components/ui/*` (Button, Input, ScrollArea, Avatar)

5. **Configuration**: Centralized environment validation
   - File: `lib/config.js`
   - Uses Zod for runtime environment validation

### Data Flow

1. User authenticates via Spotify OAuth → tokens stored in session
2. User interacts with AgentChat UI → messages sent to LangChain agent
3. Agent uses Spotify tools to search tracks, create playlists
4. OpenRouter LLM powers the reasoning and decision making
5. Results displayed in real-time chat interface

## Development Workflows

### Build & Run

```bash
# Development server
npm run dev

# Production build
npm run build
npm run start

# Linting
npm run lint
```

### Environment Setup

Required `.env` variables:
```
SPOTIFY_CLIENT_ID=your_spotify_client_id
SPOTIFY_CLIENT_SECRET=your_spotify_client_secret
SPOTIFY_REDIRECT_URI=http://localhost:3000/api/auth/callback
OPENROUTER_API_KEY=your_openrouter_api_key
```

### Key Patterns

1. **NextAuth Session Management**:
   - Use `useSession()` hook in client components
   - Access tokens via `session.accessToken`
   - Example: `components/AgentChat.js` shows session usage

2. **LangChain Tool Pattern**:
   - Tools are async functions with `@tool` decorator
   - Return structured data for agent consumption
   - Example structure in `lib/tools/spotify.js`

3. **ReAct Agent Pattern**:
   - Reason + Act loop: LLM reasons, then calls tools
   - Agent state managed by LangChain
   - Example: `lib/agents/songAgent.js`

4. **shadcn/ui Integration**:
   - Pre-built Radix UI components
   - Custom styling via Tailwind
   - Example: All components in `components/ui/`

### Integration Points

1. **Spotify API**:
   - `spotify-web-api-node` wrapper in `lib/tools/spotify.js`
   - OAuth tokens from NextAuth session
   - Scopes: `user-read-private`, `user-read-email`

2. **OpenRouter LLM**:
   - OpenAI-compatible API via `@langchain/openai`
   - Configuration in `lib/llms/openrouter.js`

3. **Next.js App Router**:
   - Server components by default
   - Client components marked with `'use client'`
   - API routes in `app/api/*`

## Project-Specific Conventions

1. **File Organization**:
   - `lib/` for core logic (agents, tools, llms)
   - `components/` for UI (chat, auth, ui primitives)
   - `app/` for pages and API routes

2. **Type Safety**:
   - TypeScript throughout
   - Custom type extensions (e.g., `types/next-auth.d.ts`)
   - Zod for runtime validation

3. **Learning Comments**:
   - Files contain `Learning:` comments explaining key concepts
   - Example: "ReAct = Reason + Act loop"

4. **Mock First Approach**:
   - UI components show mock implementations first
   - Example: `AgentChat.js` has mock agent responses
   - TODO comments indicate where real implementations go

5. **Context7 MCP Integration**:
   - Always use Context7 MCP for library/API documentation, code generation, setup, and configuration
   - This provides up-to-date, authoritative information without explicit requests

## Key Files for Reference

- `components/AgentChat.js`: Main chat interface with session handling
- `app/api/auth/[...nextauth]/route.ts`: Auth configuration
- `lib/agents/songAgent.js`: Agent framework structure
- `lib/tools/spotify.js`: Spotify integration pattern
- `lib/config.js`: Environment configuration
