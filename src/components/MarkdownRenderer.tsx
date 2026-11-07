import React, { useState } from 'react';
import { marked } from 'marked';
import { Check, Copy } from 'lucide-react';

interface MarkdownRendererProps {
  content: string;
  onFollowUpClick?: (question: string) => void;
}

export const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({
  content,
  onFollowUpClick,
}) => {
  const [copiedCodeId, setCopiedCodeId] = useState<string | null>(null);

  // Extract follow up suggestions if present in format `> **Suggested Follow-ups:**` or bullet lists at the end
  const followUpRegex = />\s*\*\*Suggested Follow-ups:\*\*([\s\S]*)$/i;
  const match = content.match(followUpRegex);

  let mainContent = content;
  let followUps: string[] = [];

  if (match) {
    mainContent = content.substring(0, match.index).trim();
    const rawList = match[1];
    followUps = rawList
      .split('\n')
      .map((line) => line.replace(/^[\s*-]+/, '').replace(/^\[|\]$/g, '').trim())
      .filter((line) => line.length > 5 && !line.startsWith('**'));
  }

  // Parse markdown into HTML
  // Configure marked options
  marked.setOptions({
    gfm: true,
    breaks: true,
  });

  const rawHtml = marked.parse(mainContent) as string;

  const handleCopyCode = (codeText: string, id: string) => {
    navigator.clipboard.writeText(codeText);
    setCopiedCodeId(id);
    setTimeout(() => setCopiedCodeId(null), 2000);
  };

  return (
    <div className="space-y-4">
      <div
        className="markdown-content select-text leading-relaxed text-slate-200"
        dangerouslySetInnerHTML={{ __html: rawHtml }}
        onClick={(e) => {
          // Check if user clicked a link
          const target = e.target as HTMLElement;
          if (target.tagName === 'A') {
            target.setAttribute('target', '_blank');
            target.setAttribute('rel', 'noopener noreferrer');
          }
        }}
      />

      {followUps.length > 0 && onFollowUpClick && (
        <div className="mt-6 pt-4 border-t border-slate-800/80">
          <div className="text-xs font-semibold uppercase tracking-wider text-indigo-400 mb-2.5 flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-400"></span>
            Suggested Follow-Up Questions
          </div>
          <div className="flex flex-wrap gap-2">
            {followUps.map((question, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => onFollowUpClick(question)}
                className="text-left text-xs sm:text-sm px-3.5 py-2 rounded-xl bg-indigo-950/40 hover:bg-indigo-900/60 border border-indigo-700/40 text-indigo-200 hover:text-white transition-all duration-200 hover:border-indigo-500/60 shadow-xs hover:shadow-indigo-950/30 group flex items-center gap-2 cursor-pointer"
              >
                <span>{question}</span>
                <span className="text-indigo-400 group-hover:translate-x-0.5 transition-transform text-xs">→</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
