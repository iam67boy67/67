export type QuestionMode = 'general' | 'deep_reasoning' | 'eli5' | 'code' | 'debate' | 'fast';

export interface GroundingSource {
  uri: string;
  title: string;
}

export interface Message {
  id: string;
  role: 'user' | 'model';
  text: string;
  mode?: QuestionMode;
  sources?: GroundingSource[];
  searchQueries?: string[];
  imageAttachment?: {
    data: string;
    mimeType: string;
    previewUrl?: string;
  };
  timestamp: number;
  isStreaming?: boolean;
}

export interface Conversation {
  id: string;
  title: string;
  messages: Message[];
  createdAt: number;
  updatedAt: number;
  isFavorite?: boolean;
  mode: QuestionMode;
}

export interface ModeInfo {
  id: QuestionMode;
  name: string;
  iconName: string;
  tagline: string;
  description: string;
  badgeColor: string;
}
