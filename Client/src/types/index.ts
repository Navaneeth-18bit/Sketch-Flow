export interface AnalyzeResponse {
  mermaidCode: string;
}

export interface GenerateResponse {
  imageUrl: string;
}

export interface ExplainResponse {
  purpose: string;
  components: string[];
  relationships: string[];
  steps: string[];
  keyInsights: string[];
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'ai';
  text: string;
  timestamp: Date;
}

export interface ChatResponse {
  response: string;
}

export interface DiagramData {
  originalImage?: string;
  originalImageFile?: File; // Adding this to help with 'improve' requests later
  mermaidCode: string;
  generatedImageUrl?: string;
  explanation: ExplainResponse;
}
