import React, { useState } from 'react';
import {
  MessageSquare,
  Trash2,
  Star,
  Search,
  X,
  Plus,
  Download,
  Clock,
  Sparkles,
} from 'lucide-react';
import { Conversation } from '../types';

interface HistorySidebarProps {
  isOpen: boolean;
  onClose: () => void;
  conversations: Conversation[];
  currentId: string | null;
  onSelectConversation: (id: string) => void;
  onNewQuestion: () => void;
  onDeleteConversation: (id: string) => void;
  onToggleFavorite: (id: string) => void;
  onClearAll: () => void;
}

export const HistorySidebar: React.FC<HistorySidebarProps> = ({
  isOpen,
  onClose,
  conversations,
  currentId,
  onSelectConversation,
  onNewQuestion,
  onDeleteConversation,
  onToggleFavorite,
  onClearAll,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterFavorites, setFilterFavorites] = useState(false);

  const filtered = conversations.filter((c) => {
    const matchesSearch =
      c.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.messages.some((m) => m.text.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesFav = filterFavorites ? c.isFavorite : true;
    return matchesSearch && matchesFav;
  });

  const exportAllHistory = () => {
    const dataStr = JSON.stringify(conversations, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `omniknow-history-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-xs z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar Panel */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 w-80 bg-slate-950/95 backdrop-blur-md border-r border-slate-800/80 flex flex-col transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Header */}
        <div className="p-4 border-b border-slate-800/80 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-indigo-400" />
            <h2 className="font-semibold text-sm text-slate-100">Question Vault</h2>
            <span className="text-xs px-2 py-0.5 rounded-full bg-slate-800 text-slate-400">
              {conversations.length}
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* New Question Action */}
        <div className="p-3">
          <button
            onClick={() => {
              onNewQuestion();
              if (window.innerWidth < 1024) onClose();
            }}
            className="w-full flex items-center justify-center gap-2 px-3.5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-xs shadow-md shadow-indigo-600/20 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Ask New Question</span>
          </button>
        </div>

        {/* Search & Favorites Filter */}
        <div className="px-3 pb-2 space-y-2">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search past questions..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs text-slate-200 placeholder-slate-500 focus:outline-hidden focus:border-indigo-500"
            />
          </div>

          <div className="flex items-center justify-between px-1">
            <button
              onClick={() => setFilterFavorites(!filterFavorites)}
              className={`flex items-center gap-1.5 text-xs font-medium cursor-pointer transition-colors ${
                filterFavorites ? 'text-amber-400' : 'text-slate-400 hover:text-slate-300'
              }`}
            >
              <Star className={`w-3.5 h-3.5 ${filterFavorites ? 'fill-amber-400' : ''}`} />
              <span>Starred only</span>
            </button>

            {conversations.length > 0 && (
              <button
                onClick={exportAllHistory}
                title="Export history as JSON"
                className="flex items-center gap-1 text-[11px] text-slate-500 hover:text-slate-300 transition-colors cursor-pointer"
              >
                <Download className="w-3 h-3" />
                <span>Export</span>
              </button>
            )}
          </div>
        </div>

        {/* Conversations List */}
        <div className="flex-1 overflow-y-auto px-3 py-1 space-y-1">
          {filtered.length === 0 ? (
            <div className="text-center py-12 px-4 text-slate-500 text-xs">
              <Sparkles className="w-8 h-8 text-slate-700 mx-auto mb-2" />
              {searchTerm || filterFavorites
                ? 'No questions match your filter.'
                : 'No saved questions yet. Ask anything to begin!'}
            </div>
          ) : (
            filtered.map((conv) => {
              const isSelected = currentId === conv.id;
              const dateStr = new Date(conv.updatedAt).toLocaleDateString(undefined, {
                month: 'short',
                day: 'numeric',
              });

              return (
                <div
                  key={conv.id}
                  className={`group relative flex items-center justify-between p-2.5 rounded-xl text-xs transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-indigo-950/50 text-indigo-200 border border-indigo-700/60'
                      : 'text-slate-300 hover:bg-slate-900/80 border border-transparent'
                  }`}
                  onClick={() => {
                    onSelectConversation(conv.id);
                    if (window.innerWidth < 1024) onClose();
                  }}
                >
                  <div className="min-w-0 flex-1 pr-2">
                    <div className="flex items-center gap-1.5">
                      <MessageSquare className="w-3 h-3 text-slate-500 shrink-0" />
                      <div className="truncate font-medium text-slate-200 group-hover:text-white">
                        {conv.title}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 mt-1 text-[10px] text-slate-500">
                      <span>{dateStr}</span>
                      <span>•</span>
                      <span>{conv.messages.length} messages</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onToggleFavorite(conv.id);
                      }}
                      className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-amber-400 cursor-pointer"
                    >
                      <Star
                        className={`w-3.5 h-3.5 ${
                          conv.isFavorite ? 'fill-amber-400 text-amber-400' : ''
                        }`}
                      />
                    </button>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteConversation(conv.id);
                      }}
                      className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-rose-400 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        {conversations.length > 0 && (
          <div className="p-3 border-t border-slate-800/80 flex items-center justify-between">
            <button
              onClick={() => {
                if (window.confirm('Are you sure you want to clear your entire question history?')) {
                  onClearAll();
                }
              }}
              className="text-xs text-rose-400/80 hover:text-rose-300 flex items-center gap-1.5 px-2 py-1 rounded hover:bg-rose-950/30 transition-colors cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Clear History</span>
            </button>
            <div className="text-[10px] text-slate-500">OmniKnow v2.0</div>
          </div>
        )}
      </aside>
    </>
  );
};
