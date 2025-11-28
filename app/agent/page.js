/**
 * Agent page (/agent).
 * Learning: App router pages are server components by default.
 */

import AgentChat from '@/components/AgentChat';

export default function AgentPage() {
  return (
    <main className="container mx-auto p-8">
      <AgentChat />
    </main>
  );
}