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
  mermaidCode: string;
  generatedImageUrl: string;
  explanation: ExplainResponse;
}
