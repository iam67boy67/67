import React, { useState } from 'react';
import { ExternalLink, Globe, Search, ChevronDown, ChevronUp } from 'lucide-react';
import { GroundingSource } from '../types';

interface SourceBadgesProps {
  sources?: GroundingSource[];
  searchQueries?: string[];
}

export const SourceBadges: React.FC<SourceBadgesProps> = ({ sources = [], searchQueries = [] }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  if (sources.length === 0 && searchQueries.length === 0) return null;

  // Deduplicate sources by URI
  const uniqueSources = Array.from(
    new Map(sources.map((item) => [item.uri, item])).values()
  );

  const displaySources = isExpanded ? uniqueSources : uniqueSources.slice(0, 4);

  return (
    <div className="mt-4 p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 text-xs text-slate-300">
      <div className="flex items-center justify-between mb-2.5">
        <div className="flex items-center gap-2 text-indigo-400 font-medium">
          <Globe className="w-3.5 h-3.5" />
          <span>Real-Time Web Grounding ({uniqueSources.length} Sources)</span>
        </div>
        {uniqueSources.length > 4 && (
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="flex items-center gap-1 text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
          >
            <span>{isExpanded ? 'Show Less' : `+${uniqueSources.length - 4} More`}</span>
            {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          </button>
        )}
      </div>

      {searchQueries.length > 0 && (
        <div className="flex items-center flex-wrap gap-1.5 mb-2.5">
          <span className="text-slate-500 flex items-center gap-1 text-[11px]">
            <Search className="w-3 h-3" /> Queries:
          </span>
          {searchQueries.map((q, i) => (
            <span
              key={i}
              className="px-2 py-0.5 rounded-md bg-slate-800 text-slate-300 border border-slate-700/60 text-[11px]"
            >
              "{q}"
            </span>
          ))}
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {displaySources.map((source, idx) => {
          let domain = '';
          try {
            domain = new URL(source.uri).hostname.replace('www.', '');
          } catch {
            domain = 'web source';
          }

          return (
            <a
              key={idx}
              href={source.uri}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-start gap-2 p-2 rounded-lg bg-slate-950/60 hover:bg-indigo-950/40 border border-slate-800/80 hover:border-indigo-700/50 transition-all group"
            >
              <div className="w-4 h-4 rounded bg-slate-800 flex items-center justify-center shrink-0 mt-0.5 text-[10px] text-slate-400 group-hover:text-indigo-400">
                {idx + 1}
              </div>
              <div className="min-w-0 flex-1">
                <div className="truncate text-slate-200 font-medium group-hover:text-indigo-300 transition-colors">
                  {source.title || domain}
                </div>
                <div className="text-[10px] text-slate-500 truncate">{domain}</div>
              </div>
              <ExternalLink className="w-3 h-3 text-slate-600 group-hover:text-indigo-400 shrink-0 mt-0.5 transition-colors" />
            </a>
          );
        })}
      </div>
    </div>
  );
};
