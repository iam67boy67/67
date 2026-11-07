import React, { useState, useEffect, useRef } from 'react';
import {
  Sparkles,
  Send,
  Image as ImageIcon,
  X,
  History,
  RotateCcw,
  Copy,
  Check,
  Compass,
  ArrowUp,
  Brain,
  Globe,
  Share2,
  FileDown,
  Trash2,
  Layers,
  HelpCircle,
  Dice5,
  Paperclip,
  CheckCircle2,
} from 'lucide-react';
import { QuestionMode, Message, Conversation } from './types';
import { MarkdownRenderer } from './components/MarkdownRenderer';
import { SourceBadges } from './components/SourceBadges';
import { ModeSelector, MODES } from './components/ModeSelector';
import { VoiceDictation, SpeechPlayer } from './components/VoiceSpeech';
import { HistorySidebar } from './components/HistorySidebar';

const EXPLORATION_CATEGORIES = [
  {
    category: '🌌 Cosmos & Physics',
    questions: [
      'What actually happens to time and space inside a black hole event horizon?',
      'Why does time only flow forward and never backward?',
      'What happened during the cosmic inflation epoch before the Big Bang?',
    ],
  },
  {
    category: '🧠 Mind & Consciousness',
    questions: [
      'How are memories physically encoded and retrieved in the human brain?',
      'What is the evolutionary purpose of consciousness and subjective experience?',
      'Why do humans experience deja vu from a neurological perspective?',
    ],
  },
  {
    category: '💻 Algorithms & Tech',
    questions: [
      'How does backpropagation and gradient descent work under the hood in transformers?',
      'Explain the P vs NP problem in clear intuitive terms with real-world examples.',
      'How does public-key RSA cryptography mathematically prevent decryption?',
    ],
  },
  {
    category: '📜 History & Civilizations',
    questions: [
      'How did Roman concrete survive underwater for 2,000 years while modern concrete degrades?',
      'What caused the sudden Bronze Age Collapse around 1200 BCE?',
      'How did ancient Polynesian navigators cross thousands of miles of open Pacific without maps?',
    ],
  },
  {
    category: '⚖️ Philosophy & Decisions',
    questions: [
      'Is free will compatible with a deterministic universe?',
      'What is the best framework for making irreversible high-stakes life decisions?',
      'What are the strongest counter-arguments to Nick Bostrom\'s Simulation Argument?',
    ],
  },
];

const SURPRISE_QUESTIONS = [
  'Why is the night sky dark if the universe is filled with countless stars (Olbers\' Paradox)?',
  'How do trees in a dense forest share nutrients and communicate through mycorrhizal fungal networks?',
  'Can an AI ever truly experience aesthetic pleasure or emotion, or only emulate the patterns?',
  'Why do bicycle wheels stay upright when moving forward? Is it gyroscopic force or caster steer?',
  'What is quantum tunneling, and how does your phone\'s flash memory rely on it every day?',
  'If light has no mass, how does gravity from a black hole bend and trap it?',
  'How did life transition from non-living organic chemistry to self-replicating RNA/DNA (Abiogenesis)?',
  'What would an observer actually see if they traveled at 99.9% the speed of light toward Earth?',
];

export default function App() {
  const [conversations, setConversations] = useState<Conversation[]>(() => {
    try {
      const saved = localStorage.getItem('omniknow_conversations');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [currentId, setCurrentId] = useState<string | null>(null);
  const [inputQuery, setInputQuery] = useState('');
  const [currentMode, setCurrentMode] = useState<QuestionMode>('general');
  const [enableSearch, setEnableSearch] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [imageAttachment, setImageAttachment] = useState<{
    data: string;
    mimeType: string;
    previewUrl?: string;
  } | null>(null);

  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [errorNotice, setErrorNotice] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Active conversation
  const currentConversation = conversations.find((c) => c.id === currentId);
  const messages = currentConversation ? currentConversation.messages : [];

  // Save conversations to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('omniknow_conversations', JSON.stringify(conversations));
    } catch (e) {
      console.warn('Could not save conversations to localStorage', e);
    }
  }, [conversations]);

  // Scroll to bottom when new messages arrive or stream updates
  useEffect(() => {
    if (messages.length > 0) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isGenerating]);

  // Keyboard shortcut to focus textarea
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === '/' && document.activeElement !== textareaRef.current) {
        e.preventDefault();
        textareaRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Handle image upload
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setErrorNotice('Please select an image file (PNG, JPG, WebP, GIF).');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      setImageAttachment({
        data: result,
        mimeType: file.type,
        previewUrl: result,
      });
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  // Start a new question thread
  const handleNewQuestion = () => {
    setCurrentId(null);
    setInputQuery('');
    setImageAttachment(null);
    setErrorNotice(null);
    setTimeout(() => {
      textareaRef.current?.focus();
    }, 100);
  };

  // Delete conversation
  const handleDeleteConversation = (id: string) => {
    setConversations((prev) => prev.filter((c) => c.id !== id));
    if (currentId === id) {
      setCurrentId(null);
    }
  };

  // Toggle favorite
  const handleToggleFavorite = (id: string) => {
    setConversations((prev) =>
      prev.map((c) => (c.id === id ? { ...c, isFavorite: !c.isFavorite } : c))
    );
  };

  // Clear all
  const handleClearAll = () => {
    setConversations([]);
    setCurrentId(null);
  };

  // Surprise me random question
  const handleSurpriseMe = () => {
    const randomQuestion =
      SURPRISE_QUESTIONS[Math.floor(Math.random() * SURPRISE_QUESTIONS.length)];
    setInputQuery(randomQuestion);
    textareaRef.current?.focus();
  };

  // Send question and stream answer
  const handleAskQuestion = async (overrideQuery?: string) => {
    const queryToSend = (overrideQuery || inputQuery).trim();
    if (!queryToSend || isGenerating) return;

    setErrorNotice(null);
    setInputQuery('');

    const userMessageId = `user-${Date.now()}`;
    const modelMessageId = `model-${Date.now()}`;

    const userMessage: Message = {
      id: userMessageId,
      role: 'user',
      text: queryToSend,
      mode: currentMode,
      imageAttachment: imageAttachment || undefined,
      timestamp: Date.now(),
    };

    const initialModelMessage: Message = {
      id: modelMessageId,
      role: 'model',
      text: '',
      mode: currentMode,
      timestamp: Date.now(),
      isStreaming: true,
    };

    let activeConvId = currentId;

    if (!activeConvId) {
      // Create new conversation
      activeConvId = `conv-${Date.now()}`;
      const title =
        queryToSend.length > 50 ? queryToSend.substring(0, 47) + '...' : queryToSend;
      const newConv: Conversation = {
        id: activeConvId,
        title,
        messages: [userMessage, initialModelMessage],
        createdAt: Date.now(),
        updatedAt: Date.now(),
        mode: currentMode,
      };
      setConversations((prev) => [newConv, ...prev]);
      setCurrentId(activeConvId);
    } else {
      // Append to existing conversation
      setConversations((prev) =>
        prev.map((c) => {
          if (c.id === activeConvId) {
            return {
              ...c,
              messages: [...c.messages, userMessage, initialModelMessage],
              updatedAt: Date.now(),
            };
          }
          return c;
        })
      );
    }

    // Reset attachment for next turn
    const sentAttachment = imageAttachment;
    setImageAttachment(null);
    setIsGenerating(true);

    // Prepare conversation history
    const history = currentConversation
      ? currentConversation.messages.map((m) => ({
          role: m.role,
          text: m.text,
        }))
      : [];

    try {
      const payload = {
        query: queryToSend,
        mode: currentMode,
        enableSearch,
        conversationHistory: history,
        imageAttachment: sentAttachment
          ? {
              data: sentAttachment.data,
              mimeType: sentAttachment.mimeType,
            }
          : undefined,
      };

      let answerCompleted = false;

      // Tier 1: Try real-time streaming via /api/ask/stream
      try {
        const streamResponse = await fetch('/api/ask/stream', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload),
        });

        if (streamResponse.ok && streamResponse.body) {
          const reader = streamResponse.body.getReader();
          const decoder = new TextDecoder();
          let accumulatedText = '';
          let accumulatedSources: any[] = [];
          let accumulatedQueries: string[] = [];
          let buffer = '';

          while (true) {
            const { value, done } = await reader.read();
            if (done) break;

            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split('\n');
            buffer = lines.pop() || '';

            for (const line of lines) {
              const trimmed = line.trim();
              if (!trimmed.startsWith('data:')) continue;

              const dataStr = trimmed.replace(/^data:\s*/, '');
              if (dataStr === '[DONE]') {
                break;
              }

              try {
                const parsed = JSON.parse(dataStr);
                if (parsed.error) {
                  throw new Error(parsed.error);
                }
                if (parsed.text) {
                  accumulatedText += parsed.text;
                }
                if (parsed.sources) {
                  accumulatedSources = [...accumulatedSources, ...parsed.sources];
                }
                if (parsed.searchQueries) {
                  accumulatedQueries = [...accumulatedQueries, ...parsed.searchQueries];
                }

                // Update state in real-time
                setConversations((prev) =>
                  prev.map((c) => {
                    if (c.id === activeConvId) {
                      return {
                        ...c,
                        messages: c.messages.map((m) => {
                          if (m.id === modelMessageId) {
                            return {
                              ...m,
                              text: accumulatedText,
                              sources: accumulatedSources,
                              searchQueries: accumulatedQueries,
                              isStreaming: true,
                            };
                          }
                          return m;
                        }),
                      };
                    }
                    return c;
                  })
                );
              } catch (e: any) {
                if (e.message && e.message !== 'Unexpected end of JSON input') {
                  console.warn('Stream chunk parsing note:', e);
                }
              }
            }
          }

          if (accumulatedText.trim()) {
            answerCompleted = true;
            setConversations((prev) =>
              prev.map((c) => {
                if (c.id === activeConvId) {
                  return {
                    ...c,
                    messages: c.messages.map((m) => {
                      if (m.id === modelMessageId) {
                        return {
                          ...m,
                          text: accumulatedText,
                          isStreaming: false,
                        };
                      }
                      return m;
                    }),
                  };
                }
                return c;
              })
            );
          }
        }
      } catch (streamErr) {
        console.warn('Stream failed or was interrupted, falling back to direct JSON response:', streamErr);
      }

      // Tier 2: If stream failed (e.g. iframe proxy blocked SSE chunking), call standard JSON /api/ask
      if (!answerCompleted) {
        const fallbackRes = await fetch('/api/ask', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload),
        });

        if (!fallbackRes.ok) {
          const errData = await fallbackRes.json().catch(() => ({}));
          throw new Error(errData.error || `Server responded with ${fallbackRes.status}`);
        }

        const data = await fallbackRes.json();
        setConversations((prev) =>
          prev.map((c) => {
            if (c.id === activeConvId) {
              return {
                ...c,
                messages: c.messages.map((m) => {
                  if (m.id === modelMessageId) {
                    return {
                      ...m,
                      text: data.text || 'No answer generated.',
                      sources: data.sources || [],
                      searchQueries: data.searchQueries || [],
                      isStreaming: false,
                    };
                  }
                  return m;
                }),
              };
            }
            return c;
          })
        );
      }
    } catch (err: any) {
      console.error('Error answering question:', err);
      setErrorNotice(err.message || 'Failed to complete question.');

      // Mark model message with error
      setConversations((prev) =>
        prev.map((c) => {
          if (c.id === activeConvId) {
            return {
              ...c,
              messages: c.messages.map((m) => {
                if (m.id === modelMessageId) {
                  return {
                    ...m,
                    text:
                      m.text ||
                      `⚠️ **Unable to complete response:** ${err.message || 'Connection or API error.'}\n\nPlease check that your Gemini API key is configured in the AI Studio Settings > Secrets panel.`,
                    isStreaming: false,
                  };
                }
                return m;
              }),
            };
          }
          return c;
        })
      );
    } finally {
      setIsGenerating(false);
    }
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const exportConversationMarkdown = () => {
    if (!currentConversation) return;

    let md = `# ${currentConversation.title}\n\n`;
    md += `*Generated by OmniKnow on ${new Date(currentConversation.createdAt).toLocaleString()}*\n\n---\n\n`;

    for (const msg of currentConversation.messages) {
      if (msg.role === 'user') {
        md += `### ❓ Question:\n${msg.text}\n\n`;
      } else {
        md += `### 💡 Answer (${msg.mode || 'general'}):\n${msg.text}\n\n`;
        if (msg.sources && msg.sources.length > 0) {
          md += `**Sources:**\n`;
          msg.sources.forEach((s) => {
            md += `- [${s.title || s.uri}](${s.uri})\n`;
          });
          md += '\n';
        }
        md += '---\n\n';
      }
    }

    const blob = new Blob([md], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${currentConversation.title.toLowerCase().replace(/[^a-z0-9]/g, '-').slice(0, 30)}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-[#0c0e14] text-slate-100 flex flex-col font-sans">
      {/* History Sidebar */}
      <HistorySidebar
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
        conversations={conversations}
        currentId={currentId}
        onSelectConversation={(id) => setCurrentId(id)}
        onNewQuestion={handleNewQuestion}
        onDeleteConversation={handleDeleteConversation}
        onToggleFavorite={handleToggleFavorite}
        onClearAll={handleClearAll}
      />

      {/* Top Navbar */}
      <header className="sticky top-0 z-30 bg-[#0c0e14]/90 backdrop-blur-md border-b border-slate-800/80 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsHistoryOpen(!isHistoryOpen)}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-200 hover:bg-slate-800/80 transition-colors cursor-pointer"
            title="Toggle Vault & History"
          >
            <History className="w-5 h-5" />
          </button>

          <div
            onClick={handleNewQuestion}
            className="flex items-center gap-2 cursor-pointer group"
          >
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-amber-400 flex items-center justify-center shadow-md shadow-indigo-600/30 group-hover:scale-105 transition-transform">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-sm tracking-tight text-white group-hover:text-indigo-300 transition-colors">
                  OmniKnow
                </span>
                <span className="text-[10px] uppercase tracking-wider font-semibold px-2 py-0.5 rounded-full bg-indigo-950 text-indigo-300 border border-indigo-700/50">
                  Universal AI
                </span>
              </div>
              <div className="text-[11px] text-slate-400 hidden sm:block">
                Every Question Answered with Deep Reasoning
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {currentConversation && (
            <>
              <button
                onClick={exportConversationMarkdown}
                title="Download thread as Markdown"
                className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 transition-colors cursor-pointer"
              >
                <FileDown className="w-3.5 h-3.5" />
                <span>Export MD</span>
              </button>

              <button
                onClick={handleNewQuestion}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium bg-indigo-600 hover:bg-indigo-500 text-white shadow-xs shadow-indigo-600/30 transition-colors cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>New Question</span>
              </button>
            </>
          )}

          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-950/60 border border-emerald-800/40 text-[11px] text-emerald-400">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span className="hidden md:inline">Gemini AI Online</span>
            <span className="md:hidden">Online</span>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-4xl w-full mx-auto px-4 py-6 flex flex-col justify-between">
        {/* Welcome / Empty State */}
        {messages.length === 0 ? (
          <div className="my-auto py-8 text-center space-y-8 animate-in fade-in duration-300">
            {/* Hero Heading */}
            <div className="space-y-3 max-w-2xl mx-auto">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-950/70 border border-indigo-800/50 text-indigo-300 text-xs font-medium">
                <Compass className="w-3.5 h-3.5 text-indigo-400" />
                <span>Boundless Knowledge Engine</span>
              </div>
              <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-white leading-tight">
                Ask <span className="bg-gradient-to-r from-indigo-400 via-sky-300 to-amber-300 bg-clip-text text-transparent">Any Question</span> in the Universe.
              </h1>
              <p className="text-sm sm:text-base text-slate-400 leading-relaxed">
                From quantum astrophysics to ancient secrets, algorithmic architectures, life decisions, or daily curiosities—get clear, rigorously reasoned answers backed by real-time web grounding.
              </p>
            </div>

            {/* Quick Actions */}
            <div className="flex flex-wrap items-center justify-center gap-3">
              <button
                type="button"
                onClick={handleSurpriseMe}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-950 to-slate-900 hover:from-indigo-900 hover:to-slate-800 border border-indigo-700/50 text-indigo-200 hover:text-white text-xs sm:text-sm font-medium transition-all shadow-sm hover:shadow-indigo-950/50 cursor-pointer"
              >
                <Dice5 className="w-4 h-4 text-amber-400 animate-spin-slow" />
                <span>Roll a Surprise Wonder</span>
              </button>
            </div>

            {/* Curiosity Explorer Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left max-w-3xl mx-auto pt-2">
              {EXPLORATION_CATEGORIES.slice(0, 4).map((cat, idx) => (
                <div
                  key={idx}
                  className="p-4 rounded-2xl bg-slate-900/40 border border-slate-800/70 hover:border-indigo-800/60 transition-all hover:bg-slate-900/70 group"
                >
                  <div className="text-xs font-bold uppercase tracking-wider text-indigo-400 mb-2.5">
                    {cat.category}
                  </div>
                  <div className="space-y-1.5">
                    {cat.questions.map((q, qIdx) => (
                      <button
                        key={qIdx}
                        type="button"
                        onClick={() => handleAskQuestion(q)}
                        className="w-full text-left text-xs text-slate-300 hover:text-white hover:bg-slate-800/70 p-1.5 rounded-lg transition-colors cursor-pointer flex items-center justify-between group/btn"
                      >
                        <span className="line-clamp-1">{q}</span>
                        <ArrowUp className="w-3 h-3 text-indigo-400 rotate-45 opacity-0 group-hover/btn:opacity-100 transition-opacity shrink-0 ml-1" />
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          /* Active Conversation Thread */
          <div className="space-y-6 pb-28">
            {messages.map((message) => {
              const isUser = message.role === 'user';
              const modeObj = MODES.find((m) => m.id === message.mode);

              return (
                <div
                  key={message.id}
                  className={`flex flex-col ${
                    isUser ? 'items-end' : 'items-start'
                  } space-y-2`}
                >
                  {/* Sender metadata badge */}
                  <div className="flex items-center gap-2 px-1 text-[11px] text-slate-400">
                    {isUser ? (
                      <>
                        <span>You</span>
                        <span>•</span>
                        <span className="capitalize">{message.mode || 'Universal'}</span>
                      </>
                    ) : (
                      <>
                        <div className="w-2 h-2 rounded-full bg-indigo-400"></div>
                        <span className="font-semibold text-indigo-300">OmniKnow</span>
                        {modeObj && (
                          <span className="px-2 py-0.5 rounded-md bg-slate-800 text-slate-300 border border-slate-700/60 text-[10px]">
                            {modeObj.name}
                          </span>
                        )}
                      </>
                    )}
                  </div>

                  {/* Message bubble */}
                  <div
                    className={`rounded-2xl p-4 sm:p-5 transition-all w-full ${
                      isUser
                        ? 'max-w-2xl bg-indigo-950/70 border border-indigo-700/60 text-indigo-50 shadow-sm'
                        : 'bg-slate-900/70 border border-slate-800/90 text-slate-200 shadow-md'
                    }`}
                  >
                    {/* User Image Attachment */}
                    {isUser && message.imageAttachment && (
                      <div className="mb-3">
                        <img
                          src={message.imageAttachment.previewUrl || message.imageAttachment.data}
                          alt="User visual upload"
                          className="max-h-60 rounded-xl border border-indigo-700/50 object-contain bg-black/40"
                        />
                      </div>
                    )}

                    {/* Content */}
                    {isUser ? (
                      <div className="text-sm sm:text-base font-medium whitespace-pre-wrap leading-relaxed">
                        {message.text}
                      </div>
                    ) : (
                      <div>
                        {message.text ? (
                          <MarkdownRenderer
                            content={message.text}
                            onFollowUpClick={(q) => handleAskQuestion(q)}
                          />
                        ) : (
                          <div className="flex items-center gap-2 text-slate-400 text-sm py-2">
                            <span className="w-2 h-2 rounded-full bg-indigo-400 animate-ping"></span>
                            <span>Synthesizing universal answer...</span>
                          </div>
                        )}

                        {/* Streaming cursor */}
                        {message.isStreaming && message.text && (
                          <span className="inline-block w-2 h-4 ml-1 bg-indigo-400 animate-pulse align-middle"></span>
                        )}

                        {/* Grounding web sources */}
                        {message.sources && message.sources.length > 0 && (
                          <SourceBadges
                            sources={message.sources}
                            searchQueries={message.searchQueries}
                          />
                        )}

                        {/* Action Toolbar on Model Answer */}
                        {!message.isStreaming && message.text && (
                          <div className="mt-4 pt-3 border-t border-slate-800/70 flex flex-wrap items-center justify-between gap-2">
                            <div className="flex items-center gap-1.5">
                              {/* Audio Listen */}
                              <SpeechPlayer text={message.text} />

                              {/* Copy answer */}
                              <button
                                type="button"
                                onClick={() => copyToClipboard(message.text, message.id)}
                                title="Copy answer"
                                className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium text-slate-400 hover:text-slate-200 hover:bg-slate-800/80 border border-transparent hover:border-slate-700 transition-colors cursor-pointer"
                              >
                                {copiedId === message.id ? (
                                  <>
                                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                                    <span className="text-emerald-400">Copied!</span>
                                  </>
                                ) : (
                                  <>
                                    <Copy className="w-3.5 h-3.5" />
                                    <span>Copy</span>
                                  </>
                                )}
                              </button>
                            </div>

                            <div className="text-[11px] text-slate-500">
                              {new Date(message.timestamp).toLocaleTimeString([], {
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </div>
        )}

        {/* Error notification banner */}
        {errorNotice && (
          <div className="fixed bottom-28 left-4 right-4 max-w-xl mx-auto p-3.5 rounded-xl bg-rose-950/90 border border-rose-800/80 text-rose-200 text-xs shadow-xl flex items-center justify-between gap-2 z-20 animate-in slide-in-from-bottom duration-200">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-rose-300">Notice:</span>
              <span>{errorNotice}</span>
            </div>
            <button
              onClick={() => setErrorNotice(null)}
              className="text-rose-400 hover:text-rose-200 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}
      </main>

      {/* Floating Bottom Question Composer */}
      <footer className="sticky bottom-0 z-20 bg-[#0c0e14]/95 backdrop-blur-md border-t border-slate-800/80 px-4 py-3">
        <div className="max-w-4xl mx-auto space-y-2">
          {/* Mode Switcher & Grounding Toggle */}
          <ModeSelector
            currentMode={currentMode}
            onSelectMode={(mode) => setCurrentMode(mode)}
            enableSearch={enableSearch}
            onToggleSearch={(enabled) => setEnableSearch(enabled)}
          />

          {/* Attached Image Preview */}
          {imageAttachment && (
            <div className="flex items-center gap-2 p-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-300 w-fit">
              <img
                src={imageAttachment.previewUrl || imageAttachment.data}
                alt="Upload preview"
                className="w-10 h-10 rounded-lg object-cover border border-slate-700"
              />
              <div className="space-y-0.5">
                <div className="font-medium text-slate-200">Attached Visual / Diagram</div>
                <div className="text-[10px] text-slate-400">Ready to analyze with question</div>
              </div>
              <button
                type="button"
                onClick={() => setImageAttachment(null)}
                className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-rose-400 cursor-pointer ml-2"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* Input Box */}
          <div className="relative flex items-end gap-2 p-2 rounded-2xl bg-slate-900/90 border border-slate-700/80 focus-within:border-indigo-500 focus-within:ring-2 focus-within:ring-indigo-500/20 transition-all shadow-lg">
            {/* Hidden file input */}
            <input
              type="file"
              ref={fileInputRef}
              accept="image/*"
              className="hidden"
              onChange={handleImageUpload}
            />

            {/* Attach Image Button */}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              title="Attach diagram, math formula, or screenshot"
              className="p-2.5 rounded-xl text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors cursor-pointer shrink-0"
            >
              <ImageIcon className="w-4 h-4" />
            </button>

            {/* Voice Dictation */}
            <VoiceDictation
              isBusy={isGenerating}
              onTranscript={(transcript) => {
                setInputQuery((prev) => (prev ? `${prev} ${transcript}` : transcript));
              }}
            />

            {/* Textarea */}
            <textarea
              ref={textareaRef}
              rows={1}
              value={inputQuery}
              onChange={(e) => {
                setInputQuery(e.target.value);
                // Auto grow
                e.target.style.height = 'auto';
                e.target.style.height = `${Math.min(e.target.scrollHeight, 180)}px`;
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleAskQuestion();
                }
              }}
              placeholder="Ask any question... (Press Enter to ask, Shift+Enter for new line, '/' to focus)"
              className="flex-1 bg-transparent border-0 text-slate-100 placeholder-slate-500 text-sm focus:outline-hidden resize-none py-2 px-1 max-h-44"
            />

            {/* Submit Button */}
            <button
              type="button"
              disabled={isGenerating || !inputQuery.trim()}
              onClick={() => handleAskQuestion()}
              className={`p-2.5 rounded-xl font-medium transition-all shrink-0 cursor-pointer ${
                isGenerating || !inputQuery.trim()
                  ? 'bg-slate-800 text-slate-600 cursor-not-allowed'
                  : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-md shadow-indigo-600/30'
              }`}
            >
              {isGenerating ? (
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin inline-block"></span>
              ) : (
                <Send className="w-4 h-4" />
              )}
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
}
