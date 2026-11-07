import React from 'react';
import { Sparkles, Brain, Baby, Code, Scale, Zap, Globe } from 'lucide-react';
import { QuestionMode } from '../types';

interface ModeSelectorProps {
  currentMode: QuestionMode;
  onSelectMode: (mode: QuestionMode) => void;
  enableSearch: boolean;
  onToggleSearch: (enabled: boolean) => void;
}

export const MODES: {
  id: QuestionMode;
  name: string;
  icon: React.ReactNode;
  tagline: string;
}[] = [
  {
    id: 'general',
    name: 'Universal',
    icon: <Sparkles className="w-3.5 h-3.5" />,
    tagline: 'Deep, engaging, and all-knowing',
  },
  {
    id: 'deep_reasoning',
    name: 'Deep Reasoning',
    icon: <Brain className="w-3.5 h-3.5" />,
    tagline: 'First principles, step-by-step logic',
  },
  {
    id: 'eli5',
    name: 'ELI5',
    icon: <Baby className="w-3.5 h-3.5" />,
    tagline: 'Crystal clear analogies & simplicity',
  },
  {
    id: 'code',
    name: 'Code & Logic',
    icon: <Code className="w-3.5 h-3.5" />,
    tagline: 'Production code & algorithms',
  },
  {
    id: 'debate',
    name: 'Multi-Perspective',
    icon: <Scale className="w-3.5 h-3.5" />,
    tagline: 'Unbiased pros/cons & viewpoints',
  },
  {
    id: 'fast',
    name: 'Direct & Crisp',
    icon: <Zap className="w-3.5 h-3.5" />,
    tagline: 'High-density, immediate bullets',
  },
];

export const ModeSelector: React.FC<ModeSelectorProps> = ({
  currentMode,
  onSelectMode,
  enableSearch,
  onToggleSearch,
}) => {
  return (
    <div className="flex flex-wrap items-center justify-between gap-2.5 py-2">
      {/* Mode pills */}
      <div className="flex flex-wrap items-center gap-1.5 overflow-x-auto scrollbar-none py-1">
        {MODES.map((m) => {
          const isActive = currentMode === m.id;
          return (
            <button
              key={m.id}
              type="button"
              onClick={() => onSelectMode(m.id)}
              title={m.tagline}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-all duration-150 cursor-pointer ${
                isActive
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/25 ring-1 ring-indigo-400'
                  : 'bg-slate-900/90 text-slate-400 hover:text-slate-200 hover:bg-slate-800 border border-slate-800'
              }`}
            >
              <span className={isActive ? 'text-white' : 'text-slate-400'}>{m.icon}</span>
              <span>{m.name}</span>
            </button>
          );
        })}
      </div>

      {/* Web Search Grounding toggle */}
      <button
        type="button"
        onClick={() => onToggleSearch(!enableSearch)}
        title="Toggle real-time Google Search grounding for live facts, current events, and web citations"
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-all duration-150 cursor-pointer ${
          enableSearch
            ? 'bg-cyan-600 text-white shadow-md shadow-cyan-600/25 ring-1 ring-cyan-400'
            : 'bg-slate-900/90 text-slate-400 hover:text-slate-200 hover:bg-slate-800 border border-slate-800'
        }`}
      >
        <Globe className={`w-3.5 h-3.5 ${enableSearch ? 'text-cyan-200 animate-pulse' : 'text-slate-400'}`} />
        <span>Live Web Grounding</span>
        {enableSearch && (
          <span className="w-1.5 h-1.5 rounded-full bg-cyan-200 animate-ping"></span>
        )}
      </button>
    </div>
  );
};
