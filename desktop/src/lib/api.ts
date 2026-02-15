/**
 * API client for Aika AI Backend
 * Handles all HTTP requests to the FastAPI backend
 */

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export interface ChatRequest {
  message: string;
  session_id?: string;
}

export interface ChatResponse {
  reply: string;
  session_id: string;
  tool_used?: {
    tool: string;
    args: Record<string, any>;
  };
  tool_result?: Record<string, any>;
  learned_facts?: string[];
}

export interface GreetingResponse {
  message: string;
}

export interface VisionRequest {
  message: string;
  image: File;
}

export interface VisionResponse {
  reply: string;
  model: string;
  filename?: string;
  image_id?: string;
  saved_path?: string;
  tool_used?: {
    tool: string;
    args: Record<string, any>;
  };
  tool_result?: Record<string, any>;
}

export interface MemoryPreferenceRequest {
  key: string;
  value: string;
}

export interface MemoryPreferenceResponse {
  saved: boolean;
}

export interface GetPreferencesResponse {
  preferences: Record<string, string>;
}

export interface SessionListItem {
  id: string;
  created_at: string;
  updated_at: string;
  preview: string;
}

export interface SessionMessageItem {
  role: string;
  content: string;
  created_at: string;
}

export interface SessionMessagesResponse {
  session_id: string;
  messages: SessionMessageItem[];
}

/**
 * Get authentication token from localStorage or environment
 */
function getAuthToken(): string | null {
  // In a real app, you'd get this from your auth system
  return localStorage.getItem('auth_token') || null;
}

/**
 * Make an authenticated fetch request with retry logic
 */
async function authenticatedFetch(
  url: string,
  options: RequestInit = {},
  retries: number = 2
): Promise<Response> {
  const token = getAuthToken();
  const headers = new Headers(options.headers);
  
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }
  headers.set('Content-Type', 'application/json');

  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const response = await fetch(`${API_BASE_URL}${url}`, {
        ...options,
        headers,
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({ detail: response.statusText }));
        const errorMessage = error.detail || `HTTP ${response.status}: ${response.statusText}`;
        
        // Retry on 5xx errors or network issues
        if (attempt < retries && (response.status >= 500 || response.status === 0)) {
          await new Promise((resolve) => setTimeout(resolve, 1000 * (attempt + 1)));
          continue;
        }
        
        throw new Error(errorMessage);
      }

      return response;
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      
      // Retry on network errors
      if (attempt < retries && (error instanceof TypeError || error.message.includes('Failed to fetch'))) {
        await new Promise((resolve) => setTimeout(resolve, 1000 * (attempt + 1)));
        continue;
      }
      
      throw lastError;
    }
  }

  throw lastError || new Error('Request failed');
}

/**
 * Chat API - Send a message and get a response
 */
export async function chatMessage(request: ChatRequest): Promise<ChatResponse> {
  const response = await authenticatedFetch('/chat', {
    method: 'POST',
    body: JSON.stringify(request),
  });
  return response.json();
}

/**
 * Chat API - Stream response using Server-Sent Events
 */
export async function* chatMessageStream(
  request: ChatRequest
): AsyncGenerator<{ type: string; text?: string; reply?: string; session_id?: string; tool_used?: any; tool_result?: any; learned_facts?: string[] }, void, unknown> {
  const token = getAuthToken();
  const headers: HeadersInit = {};
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}/chat/stream`, {
    method: 'POST',
    headers: {
      ...headers,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: response.statusText }));
    throw new Error(error.detail || `HTTP ${response.status}: ${response.statusText}`);
  }

  const reader = response.body?.getReader();
  const decoder = new TextDecoder();

  if (!reader) {
    throw new Error('No response body reader available');
  }

  let buffer = '';

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          try {
            const data = JSON.parse(line.slice(6));
            yield data;
          } catch (e) {
            console.warn('Failed to parse SSE data:', line, e);
          }
        }
      }
    }

    // Process remaining buffer
    if (buffer.startsWith('data: ')) {
      try {
        const data = JSON.parse(buffer.slice(6));
        yield data;
      } catch (e) {
        console.warn('Failed to parse final SSE data:', buffer, e);
      }
    }
  } finally {
    reader.releaseLock();
  }
}

/**
 * Get greeting message
 */
export async function getGreeting(): Promise<GreetingResponse> {
  const response = await authenticatedFetch('/chat/greeting', {
    method: 'GET',
  });
  return response.json();
}

/**
 * Vision API - Analyze an image with a message
 */
export async function analyzeImage(request: VisionRequest): Promise<VisionResponse> {
  const token = getAuthToken();
  const formData = new FormData();
  formData.append('message', request.message);
  formData.append('image', request.image);

  const headers: HeadersInit = {};
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}/vision`, {
    method: 'POST',
    headers,
    body: formData,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: response.statusText }));
    throw new Error(error.detail || `HTTP ${response.status}: ${response.statusText}`);
  }

  return response.json();
}

/**
 * Vision API - Propose tool based on image
 */
export async function proposeToolFromImage(
  imageId: string,
  message: string,
  execute: boolean = false
): Promise<VisionResponse> {
  const response = await authenticatedFetch('/vision/propose-tool', {
    method: 'POST',
    body: JSON.stringify({
      image_id: imageId,
      message,
      execute,
    }),
  });
  return response.json();
}

/**
 * Memory API - Save a preference
 */
export async function savePreference(
  request: MemoryPreferenceRequest
): Promise<MemoryPreferenceResponse> {
  const response = await authenticatedFetch('/memory/preferences', {
    method: 'POST',
    body: JSON.stringify(request),
  });
  return response.json();
}

/**
 * Memory API - Get all preferences
 */
export async function getPreferences(): Promise<GetPreferencesResponse> {
  const response = await authenticatedFetch('/memory/preferences', {
    method: 'GET',
  });
  return response.json();
}

/**
 * Chat sessions - list all sessions (by last activity)
 */
export async function getSessions(): Promise<SessionListItem[]> {
  const response = await authenticatedFetch('/chat/sessions', {
    method: 'GET',
  });
  return response.json();
}

/**
 * Chat sessions - get messages for a session
 */
export async function getSessionMessages(sessionId: string): Promise<SessionMessagesResponse> {
  const response = await authenticatedFetch(`/chat/sessions/${encodeURIComponent(sessionId)}/messages`, {
    method: 'GET',
  });
  return response.json();
}

/**
 * Health check
 */
export async function healthCheck(): Promise<{ status: string }> {
  try {
    const response = await fetch(`${API_BASE_URL}/health`, {
      method: 'GET',
    });
    if (!response.ok) {
      throw new Error(`Health check failed: ${response.status}`);
    }
    return response.json();
  } catch (error) {
    // Re-throw with more context
    throw new Error(`Failed to connect to backend at ${API_BASE_URL}: ${error instanceof Error ? error.message : String(error)}`);
  }
}
