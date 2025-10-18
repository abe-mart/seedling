import { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { Database } from '../lib/database.types';
import { generateAIPrompt, getAvailableModes } from '../lib/openai';
import {
  ArrowLeft,
  Sparkles,
  Save,
  History,
  BookOpen,
  Loader2,
  Calendar,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

type Book = Database['public']['Tables']['books']['Row'];
type StoryElement = Database['public']['Tables']['story_elements']['Row'];
type Prompt = Database['public']['Tables']['prompts']['Row'];
type Response = Database['public']['Tables']['responses']['Row'];

interface PromptInterfaceProps {
  onBack: () => void;
  onRefresh: () => void;
}

const PROMPT_MODES = [
  { id: 'general', label: 'General', description: 'Balanced prompts for overall development' },
  { id: 'character_deep_dive', label: 'Character Deep Dive', description: 'Explore motivations and relationships' },
  { id: 'plot_development', label: 'Plot Development', description: 'Expand key events and turning points' },
  { id: 'worldbuilding', label: 'Worldbuilding', description: 'Build locations, cultures, and systems' },
  { id: 'dialogue', label: 'Dialogue Practice', description: 'Develop voice and tone through scenarios' },
  { id: 'conflict_theme', label: 'Conflict & Theme', description: 'Examine moral choices and narrative tension' },
];

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

export default function PromptInterface({ onBack, onRefresh }: PromptInterfaceProps) {
  const { user } = useAuth();
  const [books, setBooks] = useState<Book[]>([]);
  const [elements, setElements] = useState<StoryElement[]>([]);
  const [currentPrompt, setCurrentPrompt] = useState<Prompt | null>(null);
  const [generatedPromptText, setGeneratedPromptText] = useState<string>(''); // Temporary storage before saving
  const [generatedElementRefs, setGeneratedElementRefs] = useState<string[]>([]); // Temporary storage before saving
  const [responseText, setResponseText] = useState('');
  const [selectedBook, setSelectedBook] = useState<string>('');
  const [selectedMode, setSelectedMode] = useState('general');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [promptHistory, setPromptHistory] = useState<(Prompt & { responses: Response[] })[]>([]);
  const [autoSaveTimeout, setAutoSaveTimeout] = useState<NodeJS.Timeout | null>(null);
  const [showAdvancedModes, setShowAdvancedModes] = useState(false);

  useEffect(() => {
    loadBooks();
    loadPromptHistory();
  }, [user]);

  useEffect(() => {
    if (selectedBook) {
      loadElements(selectedBook);
    }
  }, [selectedBook]);

  useEffect(() => {
    if (responseText && currentPrompt) {
      if (autoSaveTimeout) {
        clearTimeout(autoSaveTimeout);
      }
      const timeout = setTimeout(() => {
        autoSaveResponse();
      }, 2000);
      setAutoSaveTimeout(timeout);
    }
    return () => {
      if (autoSaveTimeout) {
        clearTimeout(autoSaveTimeout);
      }
    };
  }, [responseText]);

  const loadBooks = async () => {
    if (!user) return;
    
    // Get most recent book (by last prompt generated)
    const { data: recentPrompt } = await supabase
      .from('prompts')
      .select('book_id')
      .eq('user_id', user.id)
      .order('generated_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    const { data } = await supabase
      .from('books')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });
      
    if (data) {
      setBooks(data);
      if (data.length > 0 && !selectedBook) {
        // Default to most recently prompted book, or first book if no prompts yet
        const defaultBook = recentPrompt?.book_id 
          ? data.find(b => b.id === recentPrompt.book_id)?.id || data[0].id
          : data[0].id;
        setSelectedBook(defaultBook);
      }
    }
  };

  const loadElements = async (bookId: string) => {
    const { data } = await supabase
      .from('story_elements')
      .select('*')
      .eq('book_id', bookId)
      .order('created_at', { ascending: false });
    if (data) setElements(data);
  };

  const loadPromptHistory = async () => {
    if (!user) return;
    const { data: prompts } = await supabase
      .from('prompts')
      .select('*')
      .eq('user_id', user.id)
      .order('generated_at', { ascending: false })
      .limit(20);

    if (prompts) {
      const promptsWithResponses = await Promise.all(
        prompts.map(async (prompt) => {
          const { data: responses } = await supabase
            .from('responses')
            .select('*')
            .eq('prompt_id', prompt.id);
          return { ...prompt, responses: responses || [] };
        })
      );
      setPromptHistory(promptsWithResponses);
    }
  };

  const generatePrompt = async () => {
    if (!user || !selectedBook) return;

    setLoading(true);
    try {
      // Get selected book details
      const { data: bookData } = await supabase
        .from('books')
        .select('*')
        .eq('id', selectedBook)
        .single();

      if (!bookData) throw new Error('Book not found');

      // Get selected or determine which elements to use
      const selectedElements = elements.filter((el) => selectedTags.includes(el.id));
      
      // Load history for the selected elements (or all if none selected)
      const elementsForHistory = selectedElements.length > 0 ? selectedElements : elements;
      const elementHistory = await Promise.all(
        elementsForHistory.slice(0, 5).map(async (element) => {
          const { data: prompts } = await supabase
            .from('prompts')
            .select('*')
            .contains('element_references', [element.id])
            .order('generated_at', { ascending: false })
            .limit(3);

          if (!prompts) return { element, prompts: [] };

          const promptsWithResponses = await Promise.all(
            prompts.map(async (prompt) => {
              const { data: responses } = await supabase
                .from('responses')
                .select('*')
                .eq('prompt_id', prompt.id)
                .limit(1);
              return { ...prompt, responses: responses || [] };
            })
          );

          return { element, prompts: promptsWithResponses };
        })
      );

      // Generate AI prompt
      const aiPromptText = await generateAIPrompt({
        promptMode: selectedMode,
        storyContext: {
          bookTitle: bookData.title,
          bookDescription: bookData.description || undefined,
        },
        selectedElements: selectedElements,
        availableElements: elements,
        elementHistory: elementHistory,
      });

      // Determine which elements were actually referenced in the generated prompt
      let finalElementReferences = selectedTags;
      if (finalElementReferences.length === 0 && elements.length > 0) {
        // If no elements were selected, the AI service picked one - we need to figure out which
        // For now, we'll use the first element from availableElements that matches the mode preference
        const modePreferences: Record<string, string[]> = {
          character_deep_dive: ['character'],
          plot_development: ['plot_point', 'character'],
          worldbuilding: ['location', 'item', 'theme'],
          dialogue: ['character'],
          conflict_theme: ['theme', 'character', 'plot_point'],
          general: ['character', 'location', 'plot_point', 'item', 'theme'],
        };
        const preferredTypes = modePreferences[selectedMode] || modePreferences.general;
        const matchedElement = elements.find(el => preferredTypes.includes(el.element_type));
        if (matchedElement) {
          finalElementReferences = [matchedElement.id];
        }
      }

      // Store the generated prompt in memory (don't save to database yet)
      setGeneratedPromptText(aiPromptText);
      setGeneratedElementRefs(finalElementReferences);
      setResponseText('');
      
      // Set a temporary prompt object for display purposes
      setCurrentPrompt({
        id: 'temp-' + Date.now(),
        user_id: user.id,
        book_id: selectedBook,
        prompt_text: aiPromptText,
        prompt_type: selectedMode as any,
        prompt_mode: selectedMode,
        element_references: finalElementReferences,
        generated_at: new Date().toISOString(),
      } as Prompt);

    } catch (error) {
      console.error('Error generating prompt:', error);
      alert('Failed to generate prompt. Please check your OpenAI API key in .env file.');
    } finally {
      setLoading(false);
    }
  };

  const updateStreak = async () => {
    if (!user) return;

    const { data: profile } = await supabase
      .from('profiles')
      .select('current_streak, longest_streak, last_prompt_date')
      .eq('id', user.id)
      .maybeSingle();

    if (profile) {
      const today = new Date().toISOString().split('T')[0];
      const lastDate = profile.last_prompt_date;
      let newStreak = profile.current_streak;

      if (lastDate !== today) {
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayStr = yesterday.toISOString().split('T')[0];

        if (lastDate === yesterdayStr) {
          newStreak += 1;
        } else {
          newStreak = 1;
        }

        const longestStreak = Math.max(newStreak, profile.longest_streak);

        await supabase
          .from('profiles')
          .update({
            current_streak: newStreak,
            longest_streak: longestStreak,
            last_prompt_date: today,
          })
          .eq('id', user.id);

        onRefresh();
      }
    }
  };

  const autoSaveResponse = async () => {
    if (!user || !currentPrompt || !responseText.trim()) return;
    
    // Don't auto-save if the prompt hasn't been saved to the database yet
    if (currentPrompt.id.toString().startsWith('temp-')) return;

    const wordCount = responseText.trim().split(/\s+/).length;

    const { data: existingResponse } = await supabase
      .from('responses')
      .select('id')
      .eq('prompt_id', currentPrompt.id)
      .maybeSingle();

    if (existingResponse) {
      await supabase
        .from('responses')
        .update({
          response_text: responseText,
          word_count: wordCount,
          element_tags: selectedTags,
        })
        .eq('id', existingResponse.id);
    } else {
      await supabase.from('responses').insert({
        prompt_id: currentPrompt.id,
        user_id: user.id,
        response_text: responseText,
        word_count: wordCount,
        element_tags: selectedTags,
      });
    }
  };

  const saveResponse = async () => {
    if (!user || !currentPrompt || !responseText.trim()) return;

    setSaving(true);
    try {
      let savedPromptId = currentPrompt.id;

      // If this is a temporary prompt (not yet saved to database), save it now
      if (currentPrompt.id.toString().startsWith('temp-')) {
        const { data: savedPrompt, error } = await supabase
          .from('prompts')
          .insert({
            user_id: user.id,
            book_id: currentPrompt.book_id,
            prompt_text: generatedPromptText,
            prompt_type: selectedMode as any,
            prompt_mode: selectedMode,
            element_references: generatedElementRefs,
          })
          .select()
          .single();

        if (error || !savedPrompt) {
          throw new Error('Failed to save prompt');
        }

        savedPromptId = savedPrompt.id;
        // Update the current prompt with the real saved data
        setCurrentPrompt(savedPrompt);
      }

      // Now save the response with the real prompt ID
      const wordCount = responseText.trim().split(/\s+/).length;

      const { data: existingResponse } = await supabase
        .from('responses')
        .select('id')
        .eq('prompt_id', savedPromptId)
        .maybeSingle();

      if (existingResponse) {
        await supabase
          .from('responses')
          .update({
            response_text: responseText,
            word_count: wordCount,
            element_tags: generatedElementRefs,
          })
          .eq('id', existingResponse.id);
      } else {
        await supabase.from('responses').insert({
          prompt_id: savedPromptId,
          user_id: user.id,
          response_text: responseText,
          word_count: wordCount,
          element_tags: generatedElementRefs,
        });
      }

      // Update streak after successfully saving
      await updateStreak();

      // Clear state
      setCurrentPrompt(null);
      setResponseText('');
      setSelectedTags([]);
      setGeneratedPromptText('');
      setGeneratedElementRefs([]);
      await loadPromptHistory();
      onRefresh();
    } catch (error) {
      console.error('Error saving response:', error);
      alert('Failed to save response. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const wordCount = responseText.trim().split(/\s+/).filter(Boolean).length;

  // Filter elements based on selected prompt mode
  const getFilteredElements = () => {
    if (selectedMode === 'general') {
      return elements; // General mode can use any element
    }

    const modeElementTypes: Record<string, string[]> = {
      character_deep_dive: ['character'],
      plot_development: ['plot_point', 'character'],
      worldbuilding: ['character','location', 'item', 'theme'],
      dialogue: ['character'],
      conflict_theme: ['theme', 'character', 'plot_point'],
    };

    const allowedTypes = modeElementTypes[selectedMode] || [];
    return elements.filter(el => allowedTypes.includes(el.element_type));
  };

  const filteredElements = getFilteredElements();

  if (showHistory) {
    return (
      <div className="min-h-screen bg-slate-50">
        <header className="bg-white border-b border-slate-200">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex items-center gap-4">
              <button
                onClick={() => setShowHistory(false)}
                className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <h1 className="text-2xl font-bold text-slate-900">Prompt History</h1>
            </div>
          </div>
        </header>

        <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="space-y-4">
            <div className="flex items-center justify-between mb-6">
              <p className="text-slate-600">
                {promptHistory.length} {promptHistory.length === 1 ? 'prompt' : 'prompts'} generated
              </p>
            </div>

            {promptHistory.map((prompt) => {
              const colors = PROMPT_TYPE_COLORS[prompt.prompt_type] || PROMPT_TYPE_COLORS.general;
              const book = prompt.book_id ? books.find(b => b.id === prompt.book_id) : null;
              
              return (
                <div
                  key={prompt.id}
                  className="bg-white rounded-xl p-6 shadow-sm border border-slate-200 hover:shadow-md transition-shadow"
                >
                  <div className="flex flex-wrap items-center gap-2 mb-4">
                    {/* Date */}
                    <div className="flex items-center gap-1.5 text-sm text-slate-500">
                      <Calendar className="w-4 h-4" />
                      {new Date(prompt.generated_at).toLocaleDateString('en-US', { 
                        month: 'short', 
                        day: 'numeric', 
                        year: 'numeric' 
                      })}
                    </div>
                    
                    <div className="h-4 w-px bg-slate-300" />
                    
                    {/* Story Tag */}
                    {book && (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-slate-900 text-white border border-slate-900">
                        <BookOpen className="w-3 h-3" />
                        {book.title}
                      </span>
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

                  <div className="prose prose-slate max-w-none mb-4">
                    <p className="text-slate-900 leading-relaxed whitespace-pre-wrap">
                      {prompt.prompt_text}
                    </p>
                  </div>

                  {prompt.responses.length > 0 && (
                    <div className="border-t border-slate-200 pt-4">
                      {prompt.responses.map((response) => (
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
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-slate-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button onClick={onBack} className="p-2 hover:bg-slate-100 rounded-lg transition-colors">
                <ArrowLeft className="w-5 h-5" />
              </button>
              <h1 className="text-2xl font-bold text-slate-900">Writing Prompt</h1>
            </div>
            <button
              onClick={() => setShowHistory(true)}
              className="flex items-center gap-2 px-4 py-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
            >
              <History className="w-4 h-4" />
              History
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {!currentPrompt ? (
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8">
            <div className="mb-6">
              <label className="block text-sm font-medium text-slate-700 mb-2">Select Project</label>
              <select
                value={selectedBook}
                onChange={(e) => setSelectedBook(e.target.value)}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900 focus:border-transparent outline-none"
              >
                {books.map((book) => (
                  <option key={book.id} value={book.id}>
                    {book.title}
                  </option>
                ))}
              </select>
            </div>

            {/* Advanced modes - collapsible */}
            {getAvailableModes(elements).length > 1 && (
              <div className="mb-4">
                <button
                  onClick={() => {
                    if (showAdvancedModes) {
                      // Reset to general mode when collapsing
                      setSelectedMode('general');
                    }
                    setShowAdvancedModes(!showAdvancedModes);
                  }}
                  className="w-full flex items-center justify-center gap-2 text-sm text-slate-600 hover:text-slate-900 py-2 transition-colors"
                >
                  {showAdvancedModes ? (
                    <>
                      <ChevronUp className="w-4 h-4" />
                      Hide Advanced Options
                    </>
                  ) : (
                    <>
                      <ChevronDown className="w-4 h-4" />
                      Show Advanced Prompt Types
                    </>
                  )}
                </button>

                {showAdvancedModes && (
                  <div className="mt-4 p-4 bg-slate-50 rounded-xl border border-slate-200">
                    <label className="block text-sm font-medium text-slate-700 mb-3">
                      Specialized Prompt Types
                    </label>
                    <div className="grid grid-cols-1 gap-2">
                      {getAvailableModes(elements).filter(mode => mode !== 'general').map((modeId) => {
                        const mode = PROMPT_MODES.find(m => m.id === modeId);
                        if (!mode) return null;
                        return (
                          <button
                            key={mode.id}
                            onClick={() => setSelectedMode(mode.id)}
                            className={`p-3 rounded-lg border-2 transition-all text-left ${
                              selectedMode === mode.id
                                ? 'border-lime-500 bg-lime-50'
                                : 'border-slate-200 hover:border-slate-300 bg-white'
                            }`}
                          >
                            <div className="font-medium text-slate-900 text-sm">{mode.label}</div>
                            <div className="text-xs text-slate-600 mt-0.5">{mode.description}</div>
                          </button>
                        );
                      })}
                    </div>
                    
                    {selectedMode !== 'general' && (
                      <button
                        onClick={() => setSelectedMode('general')}
                        className="mt-3 text-xs text-slate-500 hover:text-slate-700 transition-colors"
                      >
                        ← Clear Specialized Prompt Type
                      </button>
                    )}
                  </div>
                )}
              </div>
            )}

            {filteredElements.length > 0 && showAdvancedModes && (
              <div className="mb-4 p-4 bg-slate-50 rounded-xl border border-slate-200">
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Focus on Specific Elements (Optional)
                </label>
                <div className="flex flex-wrap gap-2">
                  {filteredElements.map((element) => (
                    <button
                      key={element.id}
                      onClick={() =>
                        setSelectedTags((prev) =>
                          prev.includes(element.id)
                            ? prev.filter((id) => id !== element.id)
                            : [...prev, element.id]
                        )
                      }
                      className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                        selectedTags.includes(element.id)
                          ? 'bg-lime-600 text-white'
                          : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
                      }`}
                    >
                      {element.name}
                    </button>
                  ))}
                </div>
                <p className="text-xs text-slate-500 mt-2">
                  Leave unselected for AI to choose relevant elements automatically
                </p>
              </div>
            )}

            {/* Generate button - now appears after advanced options */}
            <button
              onClick={generatePrompt}
              disabled={loading || !selectedBook}
              className="w-full bg-gradient-to-r from-lime-500 to-green-600 text-white py-4 px-6 rounded-xl font-semibold hover:from-lime-600 hover:to-green-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg shadow-lime-500/30"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5" />
                  Generate Prompt
                </>
              )}
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-xl p-8 text-white shadow-lg">
              <div className="flex items-start gap-3 mb-4">
                <Sparkles className="w-6 h-6 flex-shrink-0 mt-1" />
                <p className="text-lg leading-relaxed">{currentPrompt.prompt_text}</p>
              </div>
              <div className="text-slate-300 text-sm">
                {selectedMode.replace('_', ' ')} • {new Date().toLocaleDateString()}
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <label className="text-lg font-semibold text-slate-900">Your Response</label>
                <div className="flex items-center gap-4 text-sm text-slate-500">
                  <div>{wordCount} words</div>
                  {autoSaveTimeout && <div className="text-green-600">Auto-saving...</div>}
                </div>
              </div>

              <textarea
                value={responseText}
                onChange={(e) => setResponseText(e.target.value)}
                placeholder="Start writing your response..."
                className="w-full min-h-[400px] px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900 focus:border-transparent outline-none resize-none text-slate-900 leading-relaxed"
              />

              <div className="mt-4 flex gap-3">
                <button
                  onClick={saveResponse}
                  disabled={saving || !responseText.trim()}
                  className="flex-1 bg-slate-900 text-white py-3 px-6 rounded-lg font-semibold hover:bg-slate-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {saving ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="w-5 h-5" />
                      Save & Finish
                    </>
                  )}
                </button>
                <button
                  onClick={() => {
                    if (confirm('Discard this prompt and start over?')) {
                      setCurrentPrompt(null);
                      setResponseText('');
                      setSelectedTags([]);
                      setGeneratedPromptText('');
                      setGeneratedElementRefs([]);
                    }
                  }}
                  className="px-6 py-3 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
