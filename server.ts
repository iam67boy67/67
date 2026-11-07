import express, { Request, Response } from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT) : 3000;
const isProd = process.env.NODE_ENV === 'production';

app.use(express.json({ limit: '25mb' }));

// Enable CORS for iframe and client requests
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, DELETE');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
    return;
  }
  next();
});

// Initialize GoogleGenAI server-side with User-Agent header
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY || '',
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

// System prompt modes
const MODE_INSTRUCTIONS: Record<string, string> = {
  general: `You are OmniKnow, the ultimate all-knowing AI answer engine.
Your purpose is to answer EVERY question asked of you—ranging from cutting-edge science, deep history, practical coding, philosophy, mathematics, real-world troubleshooting, and daily life curiosities.
Guidelines:
- Provide direct, insightful, comprehensive, and engaging answers.
- Use clean Markdown with headers, bullet points, and code blocks where helpful.
- When an answer involves nuance or ongoing scientific debates, present the facts clearly.
- If the question is brief or open-ended, provide a rich, multi-layered explanation and naturally suggest 2-3 fascinating follow-up questions at the very end in a '> **Suggested Follow-ups:**' block.`,

  deep_reasoning: `You are OmniKnow in Deep Analytical & Reasoning Mode.
For every question:
1. Deconstruct the question from first principles.
2. Unpack the underlying physics, logic, mathematics, or cognitive frameworks.
3. Walk through step-by-step causality, mechanisms, and edge cases.
4. Address common misconceptions or fallacies.
5. End with a synthesised key takeaway.`,

  eli5: `You are OmniKnow in ELI5 (Explain Like I'm 5) Mode.
Explain the topic so that a curious 10-year-old or someone completely new to the topic can immediately grasp it.
- Use vivid, everyday analogies and metaphors (like comparing atoms to LEGO blocks, or electricity to water flow).
- Keep the language lively, crystal clear, and warm.
- Avoid intimidating jargon; if a technical term is necessary, demystify it instantly with a simple illustration.`,

  code: `You are OmniKnow in Code & Technical Architect Mode.
- Provide clean, robust, and modern production-ready code with clear syntax highlighting.
- State time and space complexity where relevant.
- Highlight best practices, pitfalls to avoid, and testing considerations.
- Keep explanations crisp, technical, and actionable.`,

  debate: `You are OmniKnow in Multi-Perspective & Nuanced Debate Mode.
Provide a balanced, objective, and intellectually rigorous breakdown:
- Present the main viewpoints and arguments for each side.
- Highlight key philosophical, ethical, economic, or empirical foundations.
- Discuss where consensus exists and where unresolved tensions remain.
- Maintain an unbiased, insightful stance.`,

  fast: `You are OmniKnow in Direct & Concise Mode.
- Answer immediately and directly with zero filler or lengthy preambles.
- Use crisp bullet points, precise numbers, and essential facts.
- Maximum information density with minimal reading time.`
};

// Curated questions for discovery / surprise-me
const CURATED_QUESTIONS = [
  {
    category: "Astrophysics & Cosmos",
    question: "What actually happens to time and space inside a black hole's event horizon?",
    mode: "deep_reasoning"
  },
  {
    category: "Consciousness & Mind",
    question: "Why do humans dream, and is there any evolutionary consensus on it?",
    mode: "general"
  },
  {
    category: "Quantum Mechanics",
    question: "Explain quantum entanglement like I'm five years old without using math.",
    mode: "eli5"
  },
  {
    category: "Computer Science",
    question: "How does the Raft consensus algorithm work in distributed systems?",
    mode: "code"
  },
  {
    category: "Philosophy & Paradoxes",
    question: "Can an artificial general intelligence ever have subjective experiences (qualia)?",
    mode: "debate"
  },
  {
    category: "Ancient Mysteries",
    question: "How did the Bronze Age Collapse happen and why did major civilizations crumble at once?",
    mode: "general"
  },
  {
    category: "Biology & Genetics",
    question: "How does CRISPR-Cas9 locate the exact DNA sequence among 3 billion base pairs?",
    mode: "deep_reasoning"
  },
  {
    category: "Everyday Physics",
    question: "Why is ice slippery? Is it really melting under pressure or something else?",
    mode: "fast"
  },
  {
    category: "Economics & Game Theory",
    question: "What is the Prisoner's Dilemma, and how does tit-for-tat win in repeated games?",
    mode: "general"
  },
  {
    category: "Earth & Climate",
    question: "How do ocean thermohaline conveyor belts regulate Earth's climate stability?",
    mode: "deep_reasoning"
  }
];

// Health check endpoint
app.get('/api/health', (_req: Request, res: Response) => {
  res.json({
    status: 'ok',
    hasApiKey: Boolean(process.env.GEMINI_API_KEY),
    model: 'gemini-3.8-flash'
  });
});

// Random curated questions endpoint
app.get('/api/random-question', (_req: Request, res: Response) => {
  const shuffled = [...CURATED_QUESTIONS].sort(() => 0.5 - Math.random());
  res.json({
    curated: shuffled.slice(0, 4)
  });
});

// Helper to clean up error messages
function cleanErrorMessage(error: any): string {
  const rawMsg = error?.message || String(error);
  try {
    const parsed = JSON.parse(rawMsg);
    if (parsed?.error?.message) {
      const inner = parsed.error.message;
      if (typeof inner === 'string' && inner.includes('{')) {
        try {
          const innerParsed = JSON.parse(inner);
          if (innerParsed?.error?.message) return innerParsed.error.message;
        } catch {}
      }
      return inner;
    }
  } catch {}

  if (rawMsg.includes('503') || rawMsg.includes('high demand') || rawMsg.includes('UNAVAILABLE')) {
    return 'The AI service is experiencing a temporary spike in demand. Please try asking again in a few moments.';
  }
  if (rawMsg.includes('RESOURCE_EXHAUSTED') || rawMsg.includes('429')) {
    return 'Rate limit reached. Please wait a moment and try again.';
  }
  return rawMsg;
}

// Streaming Question Answer endpoint (SSE) with auto-retry
app.post('/api/ask/stream', async (req: Request, res: Response): Promise<void> => {
  const { query, mode = 'general', enableSearch = false, conversationHistory = [], imageAttachment } = req.body;

  if (!query || typeof query !== 'string' || !query.trim()) {
    res.status(400).json({ error: 'Question query is required.' });
    return;
  }

  if (!process.env.GEMINI_API_KEY) {
    res.status(500).json({
      error: 'GEMINI_API_KEY is not configured on the server. Please check the Secrets panel in AI Studio.'
    });
    return;
  }

  // Setup SSE
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache, no-transform');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');
  res.flushHeaders?.();

  try {
    const systemInstruction = MODE_INSTRUCTIONS[mode] || MODE_INSTRUCTIONS.general;

    // Construct content parts
    const currentParts: any[] = [];
    if (imageAttachment && imageAttachment.data) {
      const cleanData = imageAttachment.data.includes('base64,')
        ? imageAttachment.data.split('base64,')[1]
        : imageAttachment.data;
      currentParts.push({
        inlineData: {
          mimeType: imageAttachment.mimeType || 'image/png',
          data: cleanData
        }
      });
    }
    currentParts.push({ text: query.trim() });

    // Format multi-turn conversation contents
    const contents: any[] = [];
    if (Array.isArray(conversationHistory) && conversationHistory.length > 0) {
      const recent = conversationHistory.slice(-8);
      for (const msg of recent) {
        if (msg.text && (msg.role === 'user' || msg.role === 'model')) {
          contents.push({
            role: msg.role === 'user' ? 'user' : 'model',
            parts: [{ text: msg.text }]
          });
        }
      }
    }
    contents.push({
      role: 'user',
      parts: currentParts
    });

    const tools: any[] = [];
    if (enableSearch) {
      tools.push({ googleSearch: {} });
    }

    // List of models to try in order of responsiveness
    const modelsToTry = ['gemini-flash-lite-latest', 'gemini-3.8-flash'];
    let streamResult: any = null;
    let lastError: any = null;

    for (const modelName of modelsToTry) {
      try {
        // Attempt with tools if requested
        const configWithTools: any = {
          systemInstruction,
          ...(tools.length > 0 ? { tools } : {}),
        };

        streamResult = await ai.models.generateContentStream({
          model: modelName,
          contents,
          config: configWithTools,
        });
        break;
      } catch (err: any) {
        lastError = err;
        const errStr = JSON.stringify(err);

        // If tools / search caused quota error (429) or forbidden (403), retry without tools immediately
        if (tools.length > 0 && (errStr.includes('429') || errStr.includes('RESOURCE_EXHAUSTED') || errStr.includes('quota'))) {
          try {
            console.log(`Retrying ${modelName} without search tools due to quota limits...`);
            streamResult = await ai.models.generateContentStream({
              model: modelName,
              contents,
              config: { systemInstruction },
            });
            break;
          } catch (retryErr: any) {
            lastError = retryErr;
          }
        }
      }
    }

    if (!streamResult) {
      throw lastError || new Error('Unable to connect to AI engine.');
    }

    let sentGrounding = false;

    for await (const chunk of streamResult) {
      const text = chunk.text;
      if (text) {
        res.write(`data: ${JSON.stringify({ text })}\n\n`);
      }

      // Extract search grounding metadata if available
      const grounding = chunk.candidates?.[0]?.groundingMetadata;
      if (grounding && !sentGrounding && grounding.groundingChunks?.length) {
        const sources = grounding.groundingChunks
          .map((c: any) => c.web)
          .filter((w: any) => w && w.uri);
        
        const searchQueries = grounding.webSearchQueries || [];

        if (sources.length > 0 || searchQueries.length > 0) {
          res.write(`data: ${JSON.stringify({ sources, searchQueries })}\n\n`);
          sentGrounding = true;
        }
      }
    }

    res.write('data: [DONE]\n\n');
    res.end();
  } catch (error: any) {
    console.error('Gemini generation error:', error);
    const friendlyMessage = cleanErrorMessage(error);
    res.write(`data: ${JSON.stringify({ error: friendlyMessage })}\n\n`);
    res.write('data: [DONE]\n\n');
    res.end();
  }
});

// Non-streaming fallback endpoint
app.post('/api/ask', async (req: Request, res: Response): Promise<void> => {
  const { query, mode = 'general', enableSearch = false, conversationHistory = [], imageAttachment } = req.body;

  if (!query || typeof query !== 'string' || !query.trim()) {
    res.status(400).json({ error: 'Question query is required.' });
    return;
  }

  if (!process.env.GEMINI_API_KEY) {
    res.status(500).json({
      error: 'GEMINI_API_KEY is not configured on the server. Please check the Secrets panel in AI Studio.'
    });
    return;
  }

  try {
    const systemInstruction = MODE_INSTRUCTIONS[mode] || MODE_INSTRUCTIONS.general;

    const currentParts: any[] = [];
    if (imageAttachment && imageAttachment.data) {
      const cleanData = imageAttachment.data.includes('base64,')
        ? imageAttachment.data.split('base64,')[1]
        : imageAttachment.data;
      currentParts.push({
        inlineData: {
          mimeType: imageAttachment.mimeType || 'image/png',
          data: cleanData
        }
      });
    }
    currentParts.push({ text: query.trim() });

    const contents: any[] = [];
    if (Array.isArray(conversationHistory) && conversationHistory.length > 0) {
      const recent = conversationHistory.slice(-8);
      for (const msg of recent) {
        if (msg.text && (msg.role === 'user' || msg.role === 'model')) {
          contents.push({
            role: msg.role === 'user' ? 'user' : 'model',
            parts: [{ text: msg.text }]
          });
        }
      }
    }
    contents.push({
      role: 'user',
      parts: currentParts
    });

    const tools: any[] = [];
    if (enableSearch) {
      tools.push({ googleSearch: {} });
    }

    const modelsToTry = ['gemini-flash-lite-latest', 'gemini-3.8-flash'];
    let response: any = null;
    let lastError: any = null;

    for (const modelName of modelsToTry) {
      try {
        response = await ai.models.generateContent({
          model: modelName,
          contents,
          config: {
            systemInstruction,
            ...(tools.length > 0 ? { tools } : {}),
          },
        });
        break;
      } catch (err: any) {
        lastError = err;
        const errStr = JSON.stringify(err);
        if (tools.length > 0 && (errStr.includes('429') || errStr.includes('RESOURCE_EXHAUSTED') || errStr.includes('quota'))) {
          try {
            response = await ai.models.generateContent({
              model: modelName,
              contents,
              config: { systemInstruction },
            });
            break;
          } catch (retryErr: any) {
            lastError = retryErr;
          }
        }
      }
    }

    if (!response) {
      throw lastError || new Error('Failed to generate response.');
    }

    const text = response.text || '';
    const grounding = response.candidates?.[0]?.groundingMetadata;
    const sources = (grounding?.groundingChunks || [])
      .map((c: any) => c.web)
      .filter((w: any) => w && w.uri);
    const searchQueries = grounding?.webSearchQueries || [];

    res.json({
      text,
      sources,
      searchQueries
    });
  } catch (error: any) {
    console.error('Gemini generateContent error:', error);
    res.status(500).json({
      error: cleanErrorMessage(error) || 'Failed to answer question.'
    });
  }
});

// Vite middleware in dev or static files in prod
async function startServer() {
  if (!isProd) {
    const { createServer } = await import('vite');
    const vite = await createServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`OmniKnow Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Fatal server start error:', err);
  process.exit(1);
});
