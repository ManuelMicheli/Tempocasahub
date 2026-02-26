'use client';

import { createContext, useContext } from 'react';
import type { Agent } from '@/types/database';

const AgentContext = createContext<Agent | null>(null);

export function AgentProvider({ agent, children }: { agent: Agent; children: React.ReactNode }) {
  return <AgentContext.Provider value={agent}>{children}</AgentContext.Provider>;
}

export function useAgent() {
  const agent = useContext(AgentContext);
  if (!agent) throw new Error('useAgent must be used within AgentProvider');
  return agent;
}
