import { useState, useEffect } from 'react';
import { ArrowLeft, Calendar, BookOpen, Lightbulb, Tag } from 'lucide-react';
import { Database } from '../lib/database.types';
import { supabase } from '../lib/supabase';

type Prompt = Database['public']['Tables']['prompts']['Row'];
type Response = Database['public']['Tables']['responses']['Row'];
type StoryElement = Database['public']['Tables']['story_elements']['Row'];
type Book = Database['public']['Tables']['books']['Row'];

interface PromptHistoryProps {
  onBack: () => void;
  prompts: Prompt[];
  onNavigateToElement?: (bookId: string, elementId: string) => void;
  onNavigateToStory?: (bookId: string) => void;
  isLoading?: boolean;
}

const PROMPT_TYPE_LABELS: Record<string, string> = {
  character_deep_dive: 'Character Deep Dive',
  plot_development: 'Plot Development',
  worldbuilding: 'Worldbuilding',
  dialogue: 'Dialogue',
  conflict_theme: 'Conflict & Theme',
  general: 'General',
};

const PROMPT_TYPE_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  character_deep_dive: { bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-200' },
  plot_development: { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200' },
  worldbuilding: { bg: 'bg-green-50', text: 'text-green-700', border: 'border-green-200' },
  dialogue: { bg: 'bg-yellow-50', text: 'text-yellow-700', border: 'border-yellow-200' },
  conflict_theme: { bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-200' },
  general: { bg: 'bg-slate-50', text: 'text-slate-700', border: 'border-slate-200' },
};

export default function PromptHistory({ onBack, prompts, onNavigateToElement, onNavigateToStory, isLoading = false }: PromptHistoryProps) {
  const [elementMap, setElementMap] = useState<Map<string, StoryElement>>(new Map());
  const [bookMap, setBookMap] = useState<Map<string, Book>>(new Map());
  const [responseMap, setResponseMap] = useState<Map<string, Response[]>>(new Map());

  useEffect(() => {
    loadElements();
    loadBooks();
    loadResponses();
  }, [prompts]);

  const loadElements = async () => {
    // Collect all unique element IDs from all prompts
    const elementIds = new Set<string>();
    prompts.forEach(prompt => {
      prompt.element_references?.forEach(id => elementIds.add(id));
    });

    if (elementIds.size === 0) return;

    // Load all referenced elements
    const { data } = await supabase
      .from('story_elements')
      .select('*')
      .in('id', Array.from(elementIds));

    if (data) {
      const map = new Map<string, StoryElement>();
      data.forEach(element => map.set(element.id, element));
      setElementMap(map);
    }
  };

  const loadBooks = async () => {
    // Collect all unique book IDs from all prompts
    const bookIds = new Set<string>();
    prompts.forEach(prompt => {
      if (prompt.book_id) bookIds.add(prompt.book_id);
    });

    if (bookIds.size === 0) return;

    // Load all referenced books
    const { data } = await supabase
      .from('books')
      .select('*')
      .in('id', Array.from(bookIds));

    if (data) {
      const map = new Map<string, Book>();
      data.forEach(book => map.set(book.id, book));
      setBookMap(map);
    }
  };

  const loadResponses = async () => {
    if (prompts.length === 0) return;

    // Load all responses for all prompts
    const promptIds = prompts.map(p => p.id);
    const { data } = await supabase
      .from('responses')
      .select('*')
      .in('prompt_id', promptIds)
      .order('created_at', { ascending: false });

    if (data) {
      const map = new Map<string, Response[]>();
      data.forEach(response => {
        const existing = map.get(response.prompt_id) || [];
        map.set(response.prompt_id, [...existing, response]);
      });
      setResponseMap(map);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-slate-200 shadow-sm sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center gap-4">
            <button
              onClick={onBack}
              className="flex items-center gap-2 text-slate-600 hover:text-slate-900 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              <span className="font-medium">Back</span>
            </button>
            <div className="h-6 w-px bg-slate-300" />
            <h1 className="text-2xl font-bold text-slate-900">Prompt History</h1>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {isLoading ? (
          <div className="text-center py-12">
            <div className="text-slate-600">Loading prompt history...</div>
          </div>
        ) : prompts.length === 0 ? (
          <div className="bg-white rounded-xl p-12 text-center shadow-sm border border-slate-200">
            <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Lightbulb className="w-8 h-8 text-slate-400" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-2">No prompts yet</h3>
            <p className="text-slate-600 mb-6">Generate your first prompt to start building your story world</p>
            <button
              onClick={onBack}
              className="bg-slate-900 text-white px-6 py-3 rounded-lg font-semibold hover:bg-slate-800 transition-colors"
            >
              Go to Dashboard
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between mb-6">
              <p className="text-slate-600">
                {prompts.length} {prompts.length === 1 ? 'prompt' : 'prompts'} generated
              </p>
            </div>

            {prompts.map((prompt) => {
              const colors = PROMPT_TYPE_COLORS[prompt.prompt_type] || PROMPT_TYPE_COLORS.general;
              const book = prompt.book_id ? bookMap.get(prompt.book_id) : null;
              const responses = responseMap.get(prompt.id) || [];
              
              return (
                <div
                  key={prompt.id}
                  className="bg-white rounded-xl p-6 shadow-sm border border-slate-200 hover:shadow-md transition-shadow"
                >
                  <div className="flex flex-wrap items-center gap-2 mb-4">
                    {/* Date */}
                    <div className="flex items-center gap-1.5 text-sm text-slate-500">
                      <Calendar className="w-4 h-4" />
                      {formatDate(prompt.generated_at)}
                    </div>
                    
                    <div className="h-4 w-px bg-slate-300" />
                    
                    {/* Story Tag */}
                    {book && (
                      <button
                        onClick={() => onNavigateToStory && onNavigateToStory(book.id)}
                        className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-slate-900 hover:bg-slate-800 text-white border border-slate-900 transition-colors"
                      >
                        <BookOpen className="w-3 h-3" />
                        {book.title}
                      </button>
                    )}
                    
                    {/* Prompt Type Tag */}
                    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border ${colors.bg} ${colors.text} ${colors.border}`}>
                      {PROMPT_TYPE_LABELS[prompt.prompt_type] || 'General'}
                    </span>
                    
                    {/* Prompt Mode Tag - only show if it's different from the type */}
                    {prompt.prompt_mode && prompt.prompt_mode !== prompt.prompt_type && (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-700 border border-slate-200">
                        {prompt.prompt_mode}
                      </span>
                    )}
                  </div>

                  <div className="prose prose-slate max-w-none">
                    <p className="text-slate-900 leading-relaxed whitespace-pre-wrap">
                      {prompt.prompt_text}
                    </p>
                  </div>

                  {prompt.element_references && prompt.element_references.length > 0 && (
                    <div className="mt-4 pt-4 border-t border-slate-100">
                      <div className="flex items-start gap-2">
                        <div className="flex items-center gap-2 text-sm text-slate-600 flex-shrink-0">
                          <Tag className="w-4 h-4" />
                          <span className="font-medium">Elements:</span>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {prompt.element_references.map((elementId) => {
                            const element = elementMap.get(elementId);
                            if (!element) return null;
                            
                            return (
                              <button
                                key={elementId}
                                onClick={() => onNavigateToElement && onNavigateToElement(element.book_id, elementId)}
                                className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-full text-xs font-medium transition-colors"
                              >
                                <BookOpen className="w-3 h-3" />
                                {element.name}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  )}

                  {responses.length > 0 && (
                    <div className="mt-4 pt-4 border-t border-slate-200">
                      {responses.map((response) => (
                        <div key={response.id} className="text-slate-700 text-sm">
                          <div className="mb-2 text-slate-500 text-xs">
                            {response.word_count} words
                          </div>
                          <p className="whitespace-pre-wrap">{response.response_text}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
