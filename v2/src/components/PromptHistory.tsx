import { useState, useEffect, useMemo } from 'react';
import { ArrowLeft, Calendar, BookOpen, Lightbulb, Tag, Edit2, Save, X, Search, Filter, ChevronDown } from 'lucide-react';
import { Database } from '../lib/database.types';
import { api } from '../lib/api';
import { SkeletonPromptCard } from './SkeletonLoader';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';

type Prompt = Database['public']['Tables']['prompts']['Row'];
type Response = Database['public']['Tables']['responses']['Row'];
type StoryElement = Database['public']['Tables']['story_elements']['Row'];
type Book = Database['public']['Tables']['books']['Row'];

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

export default function PromptHistory() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [prompts, setPrompts] = useState<Prompt[]>([]);
  const [loading, setLoading] = useState(true);
  const [elementMap, setElementMap] = useState<Map<string, StoryElement>>(new Map());
  const [bookMap, setBookMap] = useState<Map<string, Book>>(new Map());
  const [responseMap, setResponseMap] = useState<Map<string, Response[]>>(new Map());
  const [editingResponseId, setEditingResponseId] = useState<string | null>(null);
  const [editedText, setEditedText] = useState('');
  const [saving, setSaving] = useState(false);
  
  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedBookFilter, setSelectedBookFilter] = useState<string>('all');
  const [selectedTypeFilter, setSelectedTypeFilter] = useState<string>('all');
  const [answerStatusFilter, setAnswerStatusFilter] = useState<string>('all'); // 'all', 'answered', 'unanswered'
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    loadPrompts();
  }, [user]);

  useEffect(() => {
    loadElements();
    loadBooks();
    loadResponses();
  }, [prompts]);

  const loadPrompts = async () => {
    if (!user) return;

    setLoading(true);
    try {
      const data = await api.prompts.list();
      setPrompts(data);
    } catch (error) {
      console.error('Error loading prompts:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadElements = async () => {
    // Collect all unique element IDs and book IDs from all prompts
    const elementIds = new Set<string>();
    const bookIds = new Set<string>();
    prompts.forEach(prompt => {
      prompt.element_references?.forEach(id => elementIds.add(id));
      if (prompt.book_id) bookIds.add(prompt.book_id);
    });

    if (elementIds.size === 0) return;

    try {
      // Load elements from all referenced books
      const elementPromises = Array.from(bookIds).map(bookId => 
        api.elements.list(bookId)
      );
      const elementArrays = await Promise.all(elementPromises);
      const allElements = elementArrays.flat();
      
      // Filter for only referenced elements
      const data = allElements.filter((element: StoryElement) => 
        elementIds.has(element.id)
      );

      if (data) {
        const map = new Map<string, StoryElement>();
        data.forEach((element: StoryElement) => map.set(element.id, element));
        setElementMap(map);
      }
    } catch (error) {
      console.error('Error loading elements:', error);
    }
  };

  const loadBooks = async () => {
    // Collect all unique book IDs from all prompts
    const bookIds = new Set<string>();
    prompts.forEach(prompt => {
      if (prompt.book_id) bookIds.add(prompt.book_id);
    });

    if (bookIds.size === 0) return;

    try {
      // Load all books
      const allBooks = await api.books.list();
      const data = allBooks.filter((book: Book) => bookIds.has(book.id));

      if (data) {
        const map = new Map<string, Book>();
        data.forEach((book: Book) => map.set(book.id, book));
        setBookMap(map);
      }
    } catch (error) {
      console.error('Error loading books:', error);
    }
  };

  const loadResponses = async () => {
    if (prompts.length === 0) return;

    try {
      // Load all responses for all prompts
      const promptIds = prompts.map(p => p.id);
      const responseArrays = await Promise.all(
        promptIds.map(id => api.responses.list(id))
      );
      const data = responseArrays.flat();

      if (data) {
        const map = new Map<string, Response[]>();
        data.forEach((response: Response) => {
          const existing = map.get(response.prompt_id) || [];
          map.set(response.prompt_id, [...existing, response]);
        });
        setResponseMap(map);
      }
    } catch (error) {
      console.error('Error loading responses:', error);
    }
  };

  const handleStartEdit = (response: Response) => {
    setEditingResponseId(response.id);
    setEditedText(response.response_text);
  };

  const handleCancelEdit = () => {
    setEditingResponseId(null);
    setEditedText('');
  };

  const handleSaveEdit = async (responseId: string) => {
    if (!editedText.trim()) {
      toast.error('Response cannot be empty');
      return;
    }

    setSaving(true);
    const toastId = toast.loading('Saving changes...');

    try {
      const wordCount = editedText.trim().split(/\s+/).length;
      
      await api.responses.update(responseId, {
        response_text: editedText,
        word_count: wordCount,
      });

      // Update local state
      const updatedMap = new Map(responseMap);
      for (const [promptId, responses] of updatedMap.entries()) {
        const updatedResponses = responses.map(r => 
          r.id === responseId 
            ? { ...r, response_text: editedText, word_count: wordCount, updated_at: new Date().toISOString() }
            : r
        );
        updatedMap.set(promptId, updatedResponses);
      }
      setResponseMap(updatedMap);

      setEditingResponseId(null);
      setEditedText('');
      toast.success('Response updated successfully!', { id: toastId });
    } catch (error) {
      console.error('Error updating response:', error);
      toast.error('Failed to update response. Please try again.', { id: toastId });
    } finally {
      setSaving(false);
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

  // Filter and search prompts
  const filteredPrompts = useMemo(() => {
    return prompts.filter(prompt => {
      // Search filter - check prompt text and response text
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const promptMatches = prompt.prompt_text?.toLowerCase().includes(query);
        const responses = responseMap.get(prompt.id) || [];
        const responseMatches = responses.some(r => 
          r.response_text?.toLowerCase().includes(query)
        );
        
        if (!promptMatches && !responseMatches) {
          return false;
        }
      }

      // Book filter
      if (selectedBookFilter !== 'all' && prompt.book_id !== selectedBookFilter) {
        return false;
      }

      // Type filter
      if (selectedTypeFilter !== 'all' && prompt.prompt_type !== selectedTypeFilter) {
        return false;
      }

      // Answer status filter
      if (answerStatusFilter !== 'all') {
        const responses = responseMap.get(prompt.id) || [];
        const hasResponse = responses.length > 0;
        
        if (answerStatusFilter === 'answered' && !hasResponse) {
          return false;
        }
        if (answerStatusFilter === 'unanswered' && hasResponse) {
          return false;
        }
      }

      return true;
    });
  }, [prompts, searchQuery, selectedBookFilter, selectedTypeFilter, answerStatusFilter, responseMap]);

  const uniqueBooks = useMemo(() => {
    const books = Array.from(bookMap.values());
    return books.sort((a, b) => a.title.localeCompare(b.title));
  }, [bookMap]);

  const uniqueTypes = useMemo(() => {
    const types = new Set(prompts.map(p => p.prompt_type).filter(Boolean));
    return Array.from(types).sort();
  }, [prompts]);

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-slate-200 shadow-sm sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/')}
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
        {/* Search and Filter Section */}
        <div className="mb-6 space-y-4">
          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              type="text"
              placeholder="Search prompts and responses..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900 focus:border-transparent bg-white"
            />
          </div>

          {/* Filter Toggle Button */}
          <div className="flex items-center justify-between">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2 px-4 py-2 text-slate-700 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
            >
              <Filter className="w-4 h-4" />
              <span className="font-medium">Filters</span>
              <ChevronDown className={`w-4 h-4 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
            </button>
            
            {(searchQuery || selectedBookFilter !== 'all' || selectedTypeFilter !== 'all' || answerStatusFilter !== 'all') && (
              <div className="text-sm text-slate-600">
                Showing {filteredPrompts.length} of {prompts.length} prompts
              </div>
            )}
          </div>

          {/* Filter Options */}
          {showFilters && (
            <div className="bg-white border border-slate-200 rounded-lg p-4 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Book Filter */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Story</label>
                  <select
                    value={selectedBookFilter}
                    onChange={(e) => setSelectedBookFilter(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900 focus:border-transparent bg-white"
                  >
                    <option value="all">All Stories</option>
                    {uniqueBooks.map(book => (
                      <option key={book.id} value={book.id}>{book.title}</option>
                    ))}
                  </select>
                </div>

                {/* Type Filter */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Prompt Type</label>
                  <select
                    value={selectedTypeFilter}
                    onChange={(e) => setSelectedTypeFilter(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900 focus:border-transparent bg-white"
                  >
                    <option value="all">All Types</option>
                    {uniqueTypes.map(type => (
                      <option key={type} value={type}>
                        {PROMPT_TYPE_LABELS[type] || type}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Answer Status Filter */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Status</label>
                  <select
                    value={answerStatusFilter}
                    onChange={(e) => setAnswerStatusFilter(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900 focus:border-transparent bg-white"
                  >
                    <option value="all">All</option>
                    <option value="answered">Answered</option>
                    <option value="unanswered">Unanswered</option>
                  </select>
                </div>
              </div>

              {/* Clear Filters */}
              {(selectedBookFilter !== 'all' || selectedTypeFilter !== 'all' || answerStatusFilter !== 'all') && (
                <button
                  onClick={() => {
                    setSelectedBookFilter('all');
                    setSelectedTypeFilter('all');
                    setAnswerStatusFilter('all');
                  }}
                  className="text-sm text-slate-600 hover:text-slate-900 font-medium"
                >
                  Clear all filters
                </button>
              )}
            </div>
          )}
        </div>

        {loading ? (
          <div className="space-y-4">
            <SkeletonPromptCard />
            <SkeletonPromptCard />
            <SkeletonPromptCard />
            <SkeletonPromptCard />
          </div>
        ) : prompts.length === 0 ? (
          <div className="bg-white rounded-xl p-12 text-center shadow-sm border border-slate-200">
            <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Lightbulb className="w-8 h-8 text-slate-400" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-2">No prompts yet</h3>
            <p className="text-slate-600 mb-6">Generate your first prompt to start building your story world</p>
            <button
              onClick={() => navigate('/')}
              className="bg-slate-900 text-white px-6 py-3 rounded-lg font-semibold hover:bg-slate-800 transition-colors"
            >
              Go to Dashboard
            </button>
          </div>
        ) : filteredPrompts.length === 0 ? (
          <div className="bg-white rounded-xl p-12 text-center shadow-sm border border-slate-200">
            <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Search className="w-8 h-8 text-slate-400" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-2">No prompts found</h3>
            <p className="text-slate-600 mb-6">Try adjusting your search or filters</p>
            <button
              onClick={() => {
                setSearchQuery('');
                setSelectedBookFilter('all');
                setSelectedTypeFilter('all');
                setAnswerStatusFilter('all');
              }}
              className="text-slate-900 hover:text-slate-700 font-medium"
            >
              Clear all filters
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredPrompts.map((prompt) => {
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
                        onClick={() => navigate(`/projects/${book.id}`)}
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
                                onClick={() => navigate(`/projects/${element.book_id}/${elementId}`)}
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
                      {responses.map((response) => {
                        const isEditing = editingResponseId === response.id;
                        
                        return (
                          <div key={response.id} className="text-slate-700 text-sm">
                            <div className="flex items-center justify-between mb-2">
                              <div className="text-slate-500 text-xs">
                                {response.word_count} words
                                {response.updated_at && response.updated_at !== response.created_at && (
                                  <span className="ml-2">(edited)</span>
                                )}
                              </div>
                              {!isEditing && (
                                <button
                                  onClick={() => handleStartEdit(response)}
                                  className="flex items-center gap-1 px-2 py-1 text-xs text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded transition-colors"
                                >
                                  <Edit2 className="w-3 h-3" />
                                  Edit
                                </button>
                              )}
                            </div>
                            
                            {isEditing ? (
                              <div className="space-y-2">
                                <textarea
                                  value={editedText}
                                  onChange={(e) => setEditedText(e.target.value)}
                                  className="w-full min-h-[150px] px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900 focus:border-transparent resize-y"
                                  disabled={saving}
                                />
                                <div className="flex items-center gap-2">
                                  <button
                                    onClick={() => handleSaveEdit(response.id)}
                                    disabled={saving}
                                    className="flex items-center gap-1 px-3 py-1.5 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-colors disabled:opacity-50 text-xs font-medium"
                                  >
                                    <Save className="w-3 h-3" />
                                    {saving ? 'Saving...' : 'Save'}
                                  </button>
                                  <button
                                    onClick={handleCancelEdit}
                                    disabled={saving}
                                    className="flex items-center gap-1 px-3 py-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors disabled:opacity-50 text-xs font-medium"
                                  >
                                    <X className="w-3 h-3" />
                                    Cancel
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <p className="whitespace-pre-wrap">{response.response_text}</p>
                            )}
                          </div>
                        );
                      })}
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
