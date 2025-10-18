import { useEffect, useState, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { Database } from '../lib/database.types';
import { Flame, BookOpen, LogOut, Plus, Lightbulb, User, Check, X, Sprout } from 'lucide-react';
import PromptInterface from './PromptInterface';
import ProjectManager from './ProjectManager';
import PromptHistory from './PromptHistory';

type Profile = Database['public']['Tables']['profiles']['Row'];
type Book = Database['public']['Tables']['books']['Row'];
type Prompt = Database['public']['Tables']['prompts']['Row'];

export default function Dashboard() {
  const { user, signOut } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [books, setBooks] = useState<Book[]>([]);
  const [recentPrompts, setRecentPrompts] = useState<Prompt[]>([]);
  const [allPrompts, setAllPrompts] = useState<Prompt[]>([]);
  const [activeView, setActiveView] = useState<'dashboard' | 'prompt' | 'projects' | 'history'>('dashboard');
  const [selectedBookId, setSelectedBookId] = useState<string | null>(null);
  const [selectedElementId, setSelectedElementId] = useState<string | null>(null);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showAccountMenu, setShowAccountMenu] = useState(false);
  const [editingDisplayName, setEditingDisplayName] = useState(false);
  const [displayNameValue, setDisplayNameValue] = useState('');
  const [savingDisplayName, setSavingDisplayName] = useState(false);
  const accountMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (user) {
      loadDashboardData();
    }
  }, [user]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (accountMenuRef.current && !accountMenuRef.current.contains(event.target as Node)) {
        setShowAccountMenu(false);
        setEditingDisplayName(false);
      }
    };

    if (showAccountMenu) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showAccountMenu]);

  const loadDashboardData = async () => {
    if (!user) return;

    const [profileData, booksData, promptsData] = await Promise.all([
      supabase.from('profiles').select('*').eq('id', user.id).maybeSingle(),
      supabase.from('books').select('*').eq('user_id', user.id).order('created_at', { ascending: false }),
      supabase
        .from('prompts')
        .select('*')
        .eq('user_id', user.id)
        .order('generated_at', { ascending: false })
        .limit(5),
    ]);

    if (profileData.data) setProfile(profileData.data);
    if (booksData.data) setBooks(booksData.data);
    if (promptsData.data) setRecentPrompts(promptsData.data);
    setLoading(false);
  };

  const handleSignOut = async () => {
    await signOut();
  };

  const handleStartEditingDisplayName = () => {
    setDisplayNameValue(profile?.display_name || '');
    setEditingDisplayName(true);
  };

  const handleSaveDisplayName = async () => {
    if (!user || !displayNameValue.trim()) return;

    setSavingDisplayName(true);
    const { error } = await supabase
      .from('profiles')
      .update({ display_name: displayNameValue.trim() })
      .eq('id', user.id);

    if (!error) {
      setProfile(prev => prev ? { ...prev, display_name: displayNameValue.trim() } : null);
      setEditingDisplayName(false);
    }
    setSavingDisplayName(false);
  };

  const handleCancelEditingDisplayName = () => {
    setEditingDisplayName(false);
    setDisplayNameValue('');
  };

  const loadAllPrompts = async () => {
    if (!user) return;
    
    setLoadingHistory(true);
    const { data } = await supabase
      .from('prompts')
      .select('*')
      .eq('user_id', user.id)
      .order('generated_at', { ascending: false });
    
    if (data) setAllPrompts(data);
    setLoadingHistory(false);
  };

  const handleViewHistory = () => {
    setActiveView('history');
    loadAllPrompts(); // This will now always reload to get the latest prompts
  };

  const handleViewProjects = (bookId?: string) => {
    setSelectedBookId(bookId || null);
    setSelectedElementId(null); // Clear element selection when viewing projects normally
    setActiveView('projects');
  };

  const handleNavigateToElement = (bookId: string, elementId: string) => {
    setSelectedBookId(bookId);
    setSelectedElementId(elementId);
    setActiveView('projects');
  };

  const handleNavigateToStory = (bookId: string) => {
    setSelectedBookId(bookId);
    setSelectedElementId(null);
    setActiveView('projects');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-slate-600">Loading...</div>
      </div>
    );
  }

  if (activeView === 'prompt') {
    return <PromptInterface onBack={() => setActiveView('dashboard')} onRefresh={loadDashboardData} />;
  }

  if (activeView === 'projects') {
    return (
      <ProjectManager
        onBack={() => {
          setSelectedBookId(null);
          setSelectedElementId(null);
          setActiveView('dashboard');
        }}
        initialBookId={selectedBookId}
        initialElementId={selectedElementId}
      />
    );
  }

  if (activeView === 'history') {
    return (
      <PromptHistory
        onBack={() => setActiveView('dashboard')}
        prompts={allPrompts}
        onNavigateToElement={handleNavigateToElement}
        onNavigateToStory={handleNavigateToStory}
        isLoading={loadingHistory}
      />
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-slate-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between gap-6">
            {/* Logo */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-lime-500 to-green-600 rounded-xl flex items-center justify-center shadow-sm">
                <Sprout className="w-6 h-6 text-white" />
              </div>
              <h1 className="text-2xl font-bold text-slate-900">StorySeed</h1>
            </div>

            {/* Stats Badges & Sign Out */}
            <div className="flex items-center gap-6">
              <div className="hidden md:flex items-center gap-3">
                <div className="flex items-center gap-2 px-3 py-1.5 bg-orange-50 border border-orange-200 rounded-full hover:bg-orange-100 transition-colors">
                  <Flame className="w-4 h-4 text-orange-600" />
                  <span className="text-sm font-semibold text-orange-900">{profile?.current_streak || 0}</span>
                  <span className="text-sm text-orange-700">day streak</span>
                </div>

                <button
                  onClick={() => handleViewProjects()}
                  className="flex items-center gap-2 px-3 py-1.5 bg-blue-50 border border-blue-200 rounded-full hover:bg-blue-100 transition-colors group"
                >
                  <BookOpen className="w-4 h-4 text-blue-600" />
                  <span className="text-sm font-semibold text-blue-900">{books.length}</span>
                  <span className="text-sm text-blue-700">{books.length === 1 ? 'story' : 'stories'}</span>
                </button>

                <button
                  onClick={handleViewHistory}
                  className="flex items-center gap-2 px-3 py-1.5 bg-green-50 border border-green-200 rounded-full hover:bg-green-100 transition-colors group"
                >
                  <Lightbulb className="w-4 h-4 text-green-600" />
                  <span className="text-sm font-semibold text-green-900">{recentPrompts.length}</span>
                  <span className="text-sm text-green-700">prompts</span>
                </button>
              </div>

              {/* Account Menu */}
              <div className="relative" ref={accountMenuRef}>
                <button
                  onClick={() => setShowAccountMenu(!showAccountMenu)}
                  className="flex items-center gap-2 px-4 py-2 text-slate-700 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  <div className="w-8 h-8 bg-slate-900 rounded-full flex items-center justify-center">
                    <User className="w-4 h-4 text-white" />
                  </div>
                  <span className="hidden sm:inline font-medium">
                    {profile?.display_name || user?.email?.split('@')[0]}
                  </span>
                </button>

                {showAccountMenu && (
                  <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-xl border border-slate-200 py-2 z-50">
                    {/* User Info Section */}
                    <div className="px-4 py-3 border-b border-slate-100">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-12 h-12 bg-slate-900 rounded-full flex items-center justify-center">
                          <User className="w-6 h-6 text-white" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm text-slate-500">Signed in as</div>
                          <div className="text-sm font-medium text-slate-900 truncate">{user?.email}</div>
                        </div>
                      </div>

                      {/* Display Name Section */}
                      <div>
                        <label className="block text-xs font-medium text-slate-700 mb-2">
                          Display Name
                        </label>
                        {editingDisplayName ? (
                          <div className="space-y-2">
                            <input
                              type="text"
                              value={displayNameValue}
                              onChange={(e) => setDisplayNameValue(e.target.value)}
                              placeholder="Enter your name"
                              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent"
                              autoFocus
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') handleSaveDisplayName();
                                if (e.key === 'Escape') handleCancelEditingDisplayName();
                              }}
                            />
                            <div className="flex gap-2">
                              <button
                                onClick={handleSaveDisplayName}
                                disabled={savingDisplayName || !displayNameValue.trim()}
                                className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-slate-900 text-white rounded-lg text-sm font-medium hover:bg-slate-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                              >
                                <Check className="w-4 h-4" />
                                {savingDisplayName ? 'Saving...' : 'Save'}
                              </button>
                              <button
                                onClick={handleCancelEditingDisplayName}
                                disabled={savingDisplayName}
                                className="flex items-center justify-center gap-1.5 px-3 py-2 bg-slate-100 text-slate-700 rounded-lg text-sm font-medium hover:bg-slate-200 transition-colors disabled:opacity-50"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2">
                            <div className="flex-1 px-3 py-2 bg-slate-50 rounded-lg text-sm text-slate-900">
                              {profile?.display_name || 'Not set'}
                            </div>
                            <button
                              onClick={handleStartEditingDisplayName}
                              className="px-3 py-2 text-sm font-medium text-slate-700 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
                            >
                              Edit
                            </button>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Sign Out Button */}
                    <button
                      onClick={handleSignOut}
                      className="w-full flex items-center gap-2 px-4 py-3 text-red-600 hover:bg-red-50 transition-colors text-sm font-medium"
                    >
                      <LogOut className="w-4 h-4" />
                      Sign Out
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-slate-900 mb-2">
            Welcome back, {profile?.display_name || user?.email?.split('@')[0]}
          </h2>
          <p className="text-slate-600">Ready to expand your story world today?</p>
        </div>

        <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl p-8 text-white mb-8 shadow-lg">
          <h3 className="text-2xl font-bold mb-3">Ready for today's prompt?</h3>
          <p className="text-slate-300 mb-6">
            Generate a personalized writing prompt to deepen your story world
          </p>
          <button
            onClick={() => setActiveView('prompt')}
            className="bg-white text-slate-900 px-6 py-3 rounded-lg font-semibold hover:bg-slate-100 transition-colors inline-flex items-center gap-2"
          >
            <Plus className="w-5 h-5" />
            Generate New Prompt
          </button>
        </div>

        {books.length > 0 && (
          <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
            <h3 className="text-xl font-bold text-slate-900 mb-4">Your Stories</h3>
            <div className="space-y-3">
              {books.slice(0, 3).map((book) => (
                <div
                  key={book.id}
                  className="flex items-center gap-3 p-4 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
                  onClick={() => handleViewProjects(book.id)}
                >
                  <BookOpen className="w-5 h-5 text-slate-600" />
                  <div className="flex-1">
                    <div className="font-semibold text-slate-900">{book.title}</div>
                    {book.description && (
                      <div className="text-sm text-slate-600 line-clamp-1">{book.description}</div>
                    )}
                  </div>
                </div>
              ))}
            </div>
            {books.length > 3 && (
              <button
                onClick={() => handleViewProjects()}
                className="mt-4 text-sm text-slate-600 hover:text-slate-900 font-medium"
              >
                View all {books.length} stories →
              </button>
            )}
          </div>
        )}

        {books.length === 0 && (
          <div className="bg-white rounded-xl p-12 text-center shadow-sm border border-slate-200">
            <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <BookOpen className="w-8 h-8 text-slate-400" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-2">No stories yet</h3>
            <p className="text-slate-600 mb-6">Create your first story to start generating prompts</p>
            <button
              onClick={() => handleViewProjects()}
              className="bg-slate-900 text-white px-6 py-3 rounded-lg font-semibold hover:bg-slate-800 transition-colors inline-flex items-center gap-2"
            >
              <Plus className="w-5 h-5" />
              Create Story
            </button>
          </div>
        )}
      </main>
    </div>
  );
}
