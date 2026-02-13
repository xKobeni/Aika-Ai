import { Panel } from '../components/layout/Panel';
import { AgentSection } from '../components/panel/AgentSection';
import { ToolsSection } from '../components/panel/ToolsSection';
import { MemorySection } from '../components/panel/MemorySection';
import { FilesSection } from '../components/panel/FilesSection';
import type { Agent, Tool, Attachment, ToolLogEntry } from '../types';

interface PanelPageProps {
  panelOpen: boolean;
  activeTab: string;
  onTabChange: (tab: string) => void;
  onClose: () => void;
  activeAgent: Agent;
  modelName: string;
  latency: string;
  onSwitchAgent: () => void;
  onEditPersonality?: () => void;
  tools: Tool[];
  toolLog: ToolLogEntry[];
  onToggleTool: (id: string) => void;
  memory: string[];
  onAddMemory: () => void;
  onClearMemory: () => void;
  onRemoveMemory: (index: number) => void;
  attachments: Attachment[];
  onRemoveFile: (id: string) => void;
  onOpenImageGen: () => void;
}

export function PanelPage({
  panelOpen,
  activeTab,
  onTabChange,
  onClose,
  activeAgent,
  modelName,
  latency,
  onSwitchAgent,
  onEditPersonality,
  tools,
  toolLog,
  onToggleTool,
  memory,
  onAddMemory,
  onClearMemory,
  onRemoveMemory,
  attachments,
  onRemoveFile,
  onOpenImageGen,
}: PanelPageProps) {
  return (
    <Panel
      panelOpen={panelOpen}
      activeTab={activeTab}
      onTabChange={onTabChange}
      onClose={onClose}
    >
      {activeTab === 'agent' && (
        <AgentSection
          agent={activeAgent}
          modelName={modelName}
          latency={latency}
          onSwitchAgent={onSwitchAgent}
          onEditPersonality={onEditPersonality}
        />
      )}
      {activeTab === 'tools' && (
        <ToolsSection
          tools={tools}
          toolLog={toolLog}
          onToggleTool={onToggleTool}
        />
      )}
      {activeTab === 'memory' && (
        <MemorySection
          memory={memory}
          onAdd={onAddMemory}
          onClear={onClearMemory}
          onRemove={onRemoveMemory}
        />
      )}
      {activeTab === 'files' && (
        <FilesSection
          attachments={attachments}
          onRemoveFile={onRemoveFile}
          onOpenImageGen={onOpenImageGen}
        />
      )}
    </Panel>
  );
}
