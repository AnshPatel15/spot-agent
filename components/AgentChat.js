'use client';

import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import Link from 'next/link';

/**
 * Interactive chat UI for the LangChain Spotify agent.
 * Learning:
 * - useState/useRef: Local message state + scroll ref.
 * - Server Actions/API routes: Mock send → later call agent via action.
 * - shadcn/ui: ScrollArea, Button, Input, Avatar for polished UI.
 */

export default function AgentChat() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);

  // Check authentication status
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await fetch('/api/auth/check');
        const data = await response.json();
        
        if (response.ok && data.authenticated) {
          console.log('Authentication successful:', data);
          setIsAuthenticated(true);
        } else {
          console.log('Authentication failed:', data);
          setIsAuthenticated(false);
        }
      } catch (error) {
        console.error('Auth check error:', error);
        setIsAuthenticated(false);
      } finally {
        setIsLoadingAuth(false);
      }
    };
    
    checkAuth();
  }, []);

  // Auto-scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const sendMessage = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage = { role: 'user', content: input };
    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    // Mock agent response (replace with server action / LangChain call)
    setTimeout(() => {
      const agentResponse = {
        role: 'assistant',
        content: `🎵 Great idea! "${input}" → Suggesting songs like "Bohemian Rhapsody" by Queen. Want me to create a playlist? (Mock - real LangChain + Spotify tools coming!)`,
      };
      setMessages((prev) => [...prev, agentResponse]);
      setIsLoading(false);
    }, 1500);
  };

  if (isLoadingAuth) return <div className="flex items-center justify-center h-64">Loading...</div>;

  return (
    <div className="h-screen max-w-4xl mx-auto flex flex-col bg-gradient-to-b from-gray-900 via-purple-900/30 to-black text-white">
      {/* Header */}
      <div className="p-6 border-b border-purple-500/30 sticky top-0 bg-black/50 backdrop-blur-sm z-10">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
              🎵 Spotify Agent
            </h1>
            <p className="text-purple-300 text-sm mt-1">AI song suggestions & playlist creator</p>
          </div>
          <div className="flex items-center gap-4">
            {isAuthenticated ? (
              <div className="flex items-center gap-2 text-sm bg-green-500/20 px-3 py-1 rounded-full">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                <span>Connected to Spotify</span>
              </div>
            ) : (
              <Link href="/auth/signin">
                <Button className="bg-purple-600 hover:bg-purple-700">Sign In</Button>
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 p-6 overflow-y-auto">
        <div ref={scrollRef} className="space-y-6">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-96 text-center opacity-50">
              <Avatar className="w-24 h-24 mx-auto mb-4">
                <AvatarImage src="https://api.dicebear.com/7.x/bottts-neutral/svg?seed=agent" />
                <AvatarFallback>🤖</AvatarFallback>
              </Avatar>
              <h2 className="text-2xl font-semibold mb-2">Hi! I&apos;m your Spotify Agent</h2>
              <p>Ask me for song recommendations or &quot;create a playlist for workout&quot;</p>
            </div>
          ) : (
            messages.map((msg, idx) => (
              <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-2xl p-4 rounded-2xl ${msg.role === 'user' ? 'bg-purple-600 text-white rounded-br-sm' : 'bg-white/10 backdrop-blur-sm rounded-bl-sm border border-white/20'}`}>
                  <p>{msg.content}</p>
                </div>
              </div>
            ))
          )}
          {isLoading && (
            <div className="flex justify-start">
              <div className="max-w-2xl p-4 bg-white/10 backdrop-blur-sm rounded-bl-sm border border-white/20">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 border-2 border-purple-400 border-t-transparent rounded-full animate-spin" />
                  <span>Agent thinking...</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Input */}
      <div className="p-6 border-t border-purple-500/30 bg-black/50 backdrop-blur-sm">
        <div className="flex gap-3">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && sendMessage()}
            placeholder="Ask for song recs or &quot;create chill playlist&quot;..."
            className="flex-1 bg-white/10 border-white/30 text-white placeholder-purple-300 focus-visible:ring-purple-500 resize-none h-14"
            disabled={!isAuthenticated || isLoading}
          />
          <Button
            onClick={sendMessage}
            disabled={!isAuthenticated || !input.trim() || isLoading}
            className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 px-8 font-semibold"
          >
            Send
          </Button>
        </div>
        {!isAuthenticated && (
          <p className="text-center text-xs text-purple-400 mt-2">
            Sign in with Spotify to chat & create playlists
          </p>
        )}
      </div>
    </div>
  );
}