// API client for communicating with the backend
const API_URL = import.meta.env.VITE_API_URL || window.location.origin;

interface FetchOptions extends RequestInit {
  params?: Record<string, string | number | boolean>;
}

async function fetchAPI(endpoint: string, options: FetchOptions = {}) {
  const { params, ...fetchOptions } = options;
  
  // Build URL with query parameters
  let url = `${API_URL}${endpoint}`;
  if (params) {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      searchParams.append(key, String(value));
    });
    url += `?${searchParams.toString()}`;
  }

  const response = await fetch(url, {
    ...fetchOptions,
    headers: {
      'Content-Type': 'application/json',
      ...fetchOptions.headers,
    },
    credentials: 'include', // Important for cookies/sessions
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Request failed' }));
    throw new Error(error.error || `HTTP ${response.status}`);
  }

  return response.json();
}

// ==================== PROFILES ====================

export const profileAPI = {
  get: () => fetchAPI('/api/profile'),
  update: (data: any) => fetchAPI('/api/profile', {
    method: 'PUT',
    body: JSON.stringify(data),
  }),
};

// ==================== SERIES ====================

export const seriesAPI = {
  list: () => fetchAPI('/api/series'),
  create: (data: { title: string; description?: string }) =>
    fetchAPI('/api/series', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
};

// ==================== BOOKS ====================

export const booksAPI = {
  list: () => fetchAPI('/api/books'),
  create: (data: { title: string; description?: string; series_id?: string }) =>
    fetchAPI('/api/books', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  delete: (id: string) =>
    fetchAPI(`/api/books/${id}`, {
      method: 'DELETE',
    }),
};

// ==================== STORY ELEMENTS ====================

export const elementsAPI = {
  list: (bookId: string) => fetchAPI('/api/elements', { params: { book_id: bookId } }),
  get: (id: string) => fetchAPI(`/api/elements/${id}`),
  create: (data: {
    book_id: string;
    element_type: string;
    name: string;
    description?: string;
    notes?: string;
    metadata?: any;
  }) =>
    fetchAPI('/api/elements', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  update: (id: string, data: {
    name?: string;
    description?: string;
    notes?: string;
    metadata?: any;
  }) =>
    fetchAPI(`/api/elements/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  delete: (id: string) =>
    fetchAPI(`/api/elements/${id}`, {
      method: 'DELETE',
    }),
};

// ==================== PROMPTS ====================

export const promptsAPI = {
  list: (params?: { book_id?: string; limit?: number }) =>
    fetchAPI('/api/prompts', { params: params as any }),
  get: (id: string) => fetchAPI(`/api/prompts/${id}`),
  create: (data: {
    book_id?: string;
    prompt_text: string;
    prompt_type?: string;
    prompt_mode?: string;
    element_references?: string[];
  }) =>
    fetchAPI('/api/prompts', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
};

// ==================== RESPONSES ====================

export const responsesAPI = {
  list: (promptId: string) => fetchAPI('/api/responses', { params: { prompt_id: promptId } }),
  create: (data: {
    prompt_id: string;
    response_text: string;
    element_tags?: string[];
    word_count?: number;
  }) =>
    fetchAPI('/api/responses', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  update: (id: string, data: {
    response_text?: string;
    element_tags?: string[];
    word_count?: number;
  }) =>
    fetchAPI(`/api/responses/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
};

// ==================== AI / OPENAI ====================

export const aiAPI = {
  generatePrompt: (data: {
    promptMode: string;
    storyContext: { bookTitle: string; bookDescription?: string };
    selectedElements?: any[];
    availableElements?: any[];
    elementHistory?: any[];
  }) =>
    fetchAPI('/api/generate-prompt', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  availableModes: (elements: any[]) =>
    fetchAPI('/api/available-modes', {
      method: 'POST',
      body: JSON.stringify({ elements }),
    }),
  enhanceElementDescription: (elementId: string) =>
    fetchAPI('/api/enhance-element-description', {
      method: 'POST',
      body: JSON.stringify({ elementId }),
    }),
};

// Export a default object with all APIs
export const api = {
  profile: profileAPI,
  series: seriesAPI,
  books: booksAPI,
  elements: elementsAPI,
  prompts: promptsAPI,
  responses: responsesAPI,
  ai: aiAPI,
};
