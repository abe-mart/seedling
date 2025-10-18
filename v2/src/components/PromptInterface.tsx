import { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { Database } from '../lib/database.types';
import {
  ArrowLeft,
  Sparkles,
  Save,
  History,
  Settings,
  BookOpen,
  Tag,
  Loader2,
  Clock,
  Search,
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

export default function PromptInterface({ onBack, onRefresh }: PromptInterfaceProps) {
  const { user } = useAuth();
  const [books, setBooks] = useState<Book[]>([]);
  const [elements, setElements] = useState<StoryElement[]>([]);
  const [currentPrompt, setCurrentPrompt] = useState<Prompt | null>(null);
  const [responseText, setResponseText] = useState('');
  const [selectedBook, setSelectedBook] = useState<string>('');
  const [selectedMode, setSelectedMode] = useState('general');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [promptHistory, setPromptHistory] = useState<(Prompt & { responses: Response[] })[]>([]);
  const [autoSaveTimeout, setAutoSaveTimeout] = useState<NodeJS.Timeout | null>(null);

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
    const { data } = await supabase
      .from('books')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });
    if (data) {
      setBooks(data);
      if (data.length > 0 && !selectedBook) {
        setSelectedBook(data[0].id);
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
      const selectedElements = elements.filter((el) => selectedTags.includes(el.id));
      const elementContext = selectedElements.map((el) => `${el.element_type}: ${el.name}`).join(', ');

      const prompts = {
        general: [
          `What unexpected connection exists between ${elementContext || 'your story elements'}?`,
          'Describe a moment of quiet reflection for one of your characters. What are they thinking about?',
          'What hidden detail about your world would surprise your readers?',
        ],
        character_deep_dive: [
          `What secret fear drives ${elementContext || 'your character'} that they would never admit to others?`,
          `Describe a childhood memory that still influences ${elementContext || 'your character'} today.`,
          `What would ${elementContext || 'your character'} sacrifice everything for?`,
        ],
        plot_development: [
          'What crucial decision point could change the entire direction of your story?',
          'Describe the moment when everything goes wrong for your protagonist.',
          'What truth is hiding in plain sight that your characters have not yet discovered?',
        ],
        worldbuilding: [
          `What makes ${elementContext || 'this location'} unique in your world?`,
          'What unwritten rule governs daily life in your story world?',
          'Describe a cultural tradition that reveals the values of your world.',
        ],
        dialogue: [
          `Write a tense conversation between two characters where neither says what they truly mean.`,
          'What would your character say in their darkest moment?',
          'Capture a moment of humor or levity that reveals character personality.',
        ],
        conflict_theme: [
          'What moral line will your character refuse to cross?',
          'Describe a choice where every option comes with a cost.',
          'What theme or question is your story ultimately exploring?',
        ],
      };

      const modePrompts = prompts[selectedMode as keyof typeof prompts] || prompts.general;
      const randomPrompt = modePrompts[Math.floor(Math.random() * modePrompts.length)];

      const { data, error } = await supabase
        .from('prompts')
        .insert({
          user_id: user.id,
          book_id: selectedBook,
          prompt_text: randomPrompt,
          prompt_type: selectedMode as any,
          prompt_mode: selectedMode,
          element_references: selectedTags,
        })
        .select()
        .single();

      if (!error && data) {
        setCurrentPrompt(data);
        setResponseText('');
        await updateStreak();
      }
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
      await autoSaveResponse();
      setCurrentPrompt(null);
      setResponseText('');
      setSelectedTags([]);
      await loadPromptHistory();
      onRefresh();
    } finally {
      setSaving(false);
    }
  };

  const wordCount = responseText.trim().split(/\s+/).filter(Boolean).length;

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
            {promptHistory.map((prompt) => (
              <div key={prompt.id} className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <p className="text-slate-900 font-medium mb-2">{prompt.prompt_text}</p>
                    <div className="flex items-center gap-4 text-sm text-slate-500">
                      <div className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        {new Date(prompt.generated_at).toLocaleDateString()}
                      </div>
                      <div className="px-2 py-1 bg-slate-100 rounded text-xs font-medium capitalize">
                        {prompt.prompt_type.replace('_', ' ')}
                      </div>
                    </div>
                  </div>
                </div>
                {prompt.responses.length > 0 && (
                  <div className="border-t border-slate-200 pt-4 mt-4">
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
            ))}
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

            <div className="mb-6">
              <label className="block text-sm font-medium text-slate-700 mb-2">Prompt Mode</label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {PROMPT_MODES.map((mode) => (
                  <button
                    key={mode.id}
                    onClick={() => setSelectedMode(mode.id)}
                    className={`p-4 rounded-lg border-2 transition-all text-left ${
                      selectedMode === mode.id
                        ? 'border-slate-900 bg-slate-50'
                        : 'border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div className="font-semibold text-slate-900 mb-1">{mode.label}</div>
                    <div className="text-sm text-slate-600">{mode.description}</div>
                  </button>
                ))}
              </div>
            </div>

            {elements.length > 0 && (
              <div className="mb-6">
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Focus Elements (Optional)
                </label>
                <div className="flex flex-wrap gap-2">
                  {elements.map((element) => (
                    <button
                      key={element.id}
                      onClick={() =>
                        setSelectedTags((prev) =>
                          prev.includes(element.id)
                            ? prev.filter((id) => id !== element.id)
                            : [...prev, element.id]
                        )
                      }
                      className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                        selectedTags.includes(element.id)
                          ? 'bg-slate-900 text-white'
                          : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                      }`}
                    >
                      {element.name}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <button
              onClick={generatePrompt}
              disabled={loading || !selectedBook}
              className="w-full bg-slate-900 text-white py-4 px-6 rounded-lg font-semibold hover:bg-slate-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
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
