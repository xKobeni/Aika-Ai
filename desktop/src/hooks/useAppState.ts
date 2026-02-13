import { useState, useCallback } from 'react';
import type { Agent, Tool, Message, Attachment, ToolLogEntry } from '../types';
import { nowTime, uid } from '../lib/utils';

const DEFAULT_AGENTS: Agent[] = [
  {
    id: 'general',
    name: 'General',
    desc: 'Balanced helper for everyday tasks.',
    skills: ['Reasoning', 'Coding', 'Writing', 'Planning'],
    icon: '🤖',
  },
  {
    id: 'dev',
    name: 'Dev Agent',
    desc: 'Builds, debugs, and explains code.',
    skills: ['JS', 'CSS', 'APIs', 'Debugging'],
    icon: '🧑‍💻',
  },
  {
    id: 'research',
    name: 'Research',
    desc: 'Finds, summarizes, and organizes knowledge.',
    skills: ['Summarize', 'Compare', 'Extract'],
    icon: '🧠',
  },
  {
    id: 'creative',
    name: 'Creative',
    desc: 'Brand voice, ideas, and content drafting.',
    skills: ['Copy', 'UX writing', 'Story'],
    icon: '✨',
  },
];

const DEFAULT_TOOLS: Tool[] = [
  { id: 'web', name: 'Web Search', desc: '(Disabled in local mode by default)', enabled: false },
  { id: 'files', name: 'File Reader', desc: 'Extract text from attachments (local).', enabled: true },
  { id: 'memory', name: 'Memory Store', desc: 'Save & recall user facts (local).', enabled: true },
  { id: 'image', name: 'Image Gen', desc: 'Generate images (local/remote).', enabled: true },
];

const DEFAULT_MEMORY = [
  'User prefers dark glass UI with neon accents.',
  'Project: Aika AI is a local personal assistant.',
];

export function useAppState() {
  const [view, setView] = useState('chat');
  const [rightPanelOpen, setRightPanelOpen] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(true); // Start with sidebar open
  const [showHero, setShowHero] = useState(true);
  const [prompt, setPrompt] = useState('');
  const [streamEnabled, setStreamEnabled] = useState(true);
  const [safeEnabled, setSafeEnabled] = useState(true);
  const [activeWorkspace, setActiveWorkspace] = useState('Personal');
  const [panelTab, setPanelTab] = useState('agent');

  const [agents] = useState<Agent[]>(DEFAULT_AGENTS);
  const [activeAgentId, setActiveAgentId] = useState('general');
  const [tools, setTools] = useState<Tool[]>(DEFAULT_TOOLS);
  const [memory, setMemory] = useState<string[]>(DEFAULT_MEMORY);
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [toolLog, setToolLog] = useState<ToolLogEntry[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [isStreaming, setIsStreaming] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [streamingMessageId, setStreamingMessageId] = useState<string | null>(null);

  const activeAgent = agents.find((a) => a.id === activeAgentId) ?? agents[0];
  const enabledToolsCount = tools.filter((t) => t.enabled).length;
  const memoryTool = tools.find((t) => t.id === 'memory');
  const memoryStateLabel = memoryTool?.enabled ? 'ON' : 'OFF';

  const addUserMessage = useCallback((text: string) => {
    const snap = attachments.map((a) => ({ ...a }));
    setMessages((prev) => [
      ...prev,
      {
        role: 'user',
        text,
        time: nowTime(),
        badges: snap.length ? [{ text: `${snap.length} file(s)`, kind: 'neutral' as const }] : [],
        attachments: snap,
      },
    ]);
    setAttachments([]);
  }, [attachments]);

  const addAssistantMessage = useCallback(
    (text: string, options: { badges?: Message['badges']; toolCalls?: Message['toolCalls'] } = {}) => {
      const agent = agents.find((a) => a.id === activeAgentId) ?? agents[0];
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          agentName: agent.name,
          agentIcon: agent.icon,
          text,
          time: nowTime(),
          badges: options.badges ?? [{ text: 'Local', kind: 'good' as const }],
          toolCalls: options.toolCalls ?? [],
        },
      ]);
    },
    [activeAgentId, agents]
  );

  const toggleTool = useCallback((id: string) => {
    setTools((prev) =>
      prev.map((t) => (t.id === id ? { ...t, enabled: !t.enabled } : t))
    );
  }, []);

  const addMemory = useCallback((fact: string) => {
    setMemory((prev) => [...prev, fact]);
    setToolLog((prev) => [
      ...prev,
      { name: 'memory.store', payload: JSON.stringify({ fact }, null, 2), time: nowTime() },
    ]);
  }, []);

  const removeMemory = useCallback((index: number) => {
    setMemory((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const clearMemory = useCallback(() => setMemory([]), []);

  const addAttachments = useCallback((files: File[]) => {
    setAttachments((prev) => [
      ...prev,
      ...files.map((f) => ({
        id: uid(),
        name: f.name,
        size: f.size,
        type: f.type,
      })),
    ]);
  }, []);

  const removeAttachment = useCallback((id: string) => {
    setAttachments((prev) => prev.filter((a) => a.id !== id));
  }, []);

  const pushToolLog = useCallback((entry: ToolLogEntry) => {
    setToolLog((prev) => [...prev, entry]);
  }, []);

  const newChat = useCallback(() => {
    setMessages([]);
    setAttachments([]);
    setSessionId(null); // Reset session for new chat
    setShowHero(true);
  }, []);

  const clearChat = useCallback(() => setMessages([]), []);

  const showChat = useCallback(() => {
    setShowHero(false);
  }, []);

  const navView = useCallback((v: string) => {
    setView(v);
    if (v === 'agents') setPanelTab('agent');
    if (v === 'tools') setPanelTab('tools');
    if (v === 'memory') setPanelTab('memory');
    if (v === 'files') setPanelTab('files');
    setShowHero(false);
  }, []);

  return {
    view,
    rightPanelOpen,
    setRightPanelOpen,
    sidebarOpen,
    setSidebarOpen,
    showHero,
    prompt,
    setPrompt,
    streamEnabled,
    setStreamEnabled,
    safeEnabled,
    setSafeEnabled,
    activeWorkspace,
    setActiveWorkspace,
    panelTab,
    setPanelTab,
    agents,
    activeAgentId,
    setActiveAgentId,
    activeAgent,
    tools,
    toggleTool,
    memory,
    addMemory,
    removeMemory,
    clearMemory,
    attachments,
    addAttachments,
    removeAttachment,
    toolLog,
    pushToolLog,
    messages,
    addUserMessage,
    addAssistantMessage,
    enabledToolsCount,
    memoryStateLabel,
    newChat,
    clearChat,
    showChat,
    navView,
    sessionId,
    setSessionId,
    isStreaming,
    setIsStreaming,
    isLoading,
    setIsLoading,
    streamingMessageId,
    setStreamingMessageId,
  };
}
