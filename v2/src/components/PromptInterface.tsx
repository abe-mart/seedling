import { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { api } from '../lib/api';
import { Database } from '../lib/database.types';
import {
  ArrowLeft,
  Sparkles,
  Save,
  History,
  Loader2,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

type Book = Database['public']['Tables']['books']['Row'];
type StoryElement = Database['public']['Tables']['story_elements']['Row'];
type Prompt = Database['public']['Tables']['prompts']['Row'];

interface PromptInterfaceProps {
  onBack: () => void;
  onRefresh: () => void;
  onViewHistory?: () => void;
}

const PROMPT_MODES = [
  { id: 'general', label: 'General', description: 'Balanced prompts for overall development' },
  { id: 'character_deep_dive', label: 'Character Deep Dive', description: 'Explore motivations and relationships' },
  { id: 'plot_development', label: 'Plot Development', description: 'Expand key events and turning points' },
  { id: 'worldbuilding', label: 'Worldbuilding', description: 'Build locations, cultures, and systems' },
  { id: 'dialogue', label: 'Dialogue Practice', description: 'Develop voice and tone through scenarios' },
  { id: 'conflict_theme', label: 'Conflict & Theme', description: 'Examine moral choices and narrative tension' },
];

// Helper function to determine available modes based on elements
function getAvailableModes(elements: StoryElement[]): string[] {
  const modes = ['general'];
  const elementTypes = new Set(elements.map(el => el.element_type));
  
  if (elementTypes.has('character')) {
    modes.push('character_deep_dive');
  }
  
  if (elementTypes.has('plot_point') || elementTypes.has('character')) {
    modes.push('plot_development');
  }
  
  if (elementTypes.has('location') || elementTypes.has('item') || elementTypes.has('theme')) {
    modes.push('worldbuilding');
  }
  
  if (elementTypes.has('character')) {
    modes.push('dialogue');
  }
  
  if (elementTypes.has('theme') || elementTypes.has('character') || elementTypes.has('plot_point')) {
    modes.push('conflict_theme');
  }
  
  return modes;
}

export default function PromptInterface({ onBack, onRefresh, onViewHistory }: PromptInterfaceProps) {
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
  const [autoSaveTimeout, setAutoSaveTimeout] = useState<NodeJS.Timeout | null>(null);
  const [showAdvancedModes, setShowAdvancedModes] = useState(false);

  useEffect(() => {
    loadBooks();
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
    
    try {
      // Get most recent book (by last prompt generated)
      const recentPrompts = await api.prompts.list({ limit: 1 });
      const recentPrompt = recentPrompts[0];

      const data = await api.books.list();
      
      setBooks(data);
      if (data.length > 0 && !selectedBook) {
        // Default to most recently prompted book, or first book if no prompts yet
        const defaultBook = recentPrompt?.book_id 
          ? data.find((b: Book) => b.id === recentPrompt.book_id)?.id || data[0].id
          : data[0].id;
        setSelectedBook(defaultBook);
      }
    } catch (error) {
      console.error('Error loading books:', error);
    }
  };

  const loadElements = async (bookId: string) => {
    try {
      const data = await api.elements.list(bookId);
      setElements(data);
    } catch (error) {
      console.error('Error loading elements:', error);
    }
  };

  const generatePrompt = async () => {
    if (!user || !selectedBook) return;

    setLoading(true);
    try {
      // Get selected book details from state
      const bookData = books.find((b) => b.id === selectedBook);
      if (!bookData) throw new Error('Book not found');

      // Get selected or determine which elements to use
      const selectedElements = elements.filter((el) => selectedTags.includes(el.id));
      
      // For now, simplified without loading full history
      // You can expand this if needed
      const elementHistory: any[] = [];

      // Generate AI prompt via backend
      const result = await api.ai.generatePrompt({
        promptMode: selectedMode,
        storyContext: {
          bookTitle: bookData.title,
          bookDescription: bookData.description || undefined,
        },
        selectedElements: selectedElements,
        availableElements: elements,
        elementHistory: elementHistory,
      });
      
      const aiPromptText = result.prompt;
      const usedElements = result.usedElements || [];

      // Use the actual elements that were used by the AI, not a guess
      const finalElementReferences = usedElements.map((el: any) => el.id);

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

    try {
      const profile = await api.profile.get();

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

          await api.profile.update({
            current_streak: newStreak,
            longest_streak: longestStreak,
            last_prompt_date: today,
          });

          onRefresh();
        }
      }
    } catch (error) {
      console.error('Error updating streak:', error);
    }
  };

  const autoSaveResponse = async () => {
    if (!user || !currentPrompt || !responseText.trim()) return;
    
    // Don't auto-save if the prompt hasn't been saved to the database yet
    if (currentPrompt.id.toString().startsWith('temp-')) return;

    const wordCount = responseText.trim().split(/\s+/).length;

    try {
      const responses = await api.responses.list(currentPrompt.id);
      const existingResponse = responses[0];

      if (existingResponse) {
        await api.responses.update(existingResponse.id, {
          response_text: responseText,
          word_count: wordCount,
          element_tags: selectedTags,
        });
      } else {
        await api.responses.create({
          prompt_id: currentPrompt.id,
          response_text: responseText,
          word_count: wordCount,
          element_tags: selectedTags,
        });
      }
    } catch (error) {
      console.error('Error auto-saving response:', error);
    }
  };

  const saveResponse = async () => {
    if (!user || !currentPrompt || !responseText.trim()) return;

    setSaving(true);
    try {
      let savedPromptId = currentPrompt.id;

      // If this is a temporary prompt (not yet saved to database), save it now
      if (currentPrompt.id.toString().startsWith('temp-')) {
        const savedPrompt = await api.prompts.create({
          book_id: currentPrompt.book_id!,
          prompt_text: generatedPromptText,
          prompt_type: selectedMode as any,
          prompt_mode: selectedMode,
          element_references: generatedElementRefs,
        });

        savedPromptId = savedPrompt.id;
        // Update the current prompt with the real saved data
        setCurrentPrompt(savedPrompt);
      }

      // Now save the response with the real prompt ID
      const wordCount = responseText.trim().split(/\s+/).length;

      const responses = await api.responses.list(savedPromptId);
      const existingResponse = responses[0];

      if (existingResponse) {
        await api.responses.update(existingResponse.id, {
          response_text: responseText,
          word_count: wordCount,
          element_tags: generatedElementRefs,
        });
      } else {
        await api.responses.create({
          prompt_id: savedPromptId,
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
            {onViewHistory && (
              <button
                onClick={onViewHistory}
                className="flex items-center gap-2 px-4 py-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <History className="w-4 h-4" />
                History
              </button>
            )}
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
