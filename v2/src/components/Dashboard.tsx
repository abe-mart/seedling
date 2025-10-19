import { useEffect, useState, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { api } from '../lib/api';
import { Database } from '../lib/database.types';
import { Flame, BookOpen, LogOut, Plus, Lightbulb, User, Check, X, Sprout } from 'lucide-react';
import toast from 'react-hot-toast';
import { SkeletonDashboardStats, SkeletonBookCard } from './SkeletonLoader';
import { useNavigate } from 'react-router-dom';

type Profile = Database['public']['Tables']['profiles']['Row'];
type Book = Database['public']['Tables']['books']['Row'];

export default function Dashboard() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [books, setBooks] = useState<Book[]>([]);
  const [totalPromptCount, setTotalPromptCount] = useState(0);
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

    try {
      const [profileData, booksData, , allPromptsData] = await Promise.all([
        api.profile.get(),
        api.books.list(),
        api.prompts.list({ limit: 5 }),
        api.prompts.list(), // Get all prompts for count
      ]);

      setProfile(profileData);
      setBooks(booksData);
      setTotalPromptCount(allPromptsData.length);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
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
    try {
      await api.profile.update({ display_name: displayNameValue.trim() });
      setProfile(prev => prev ? { ...prev, display_name: displayNameValue.trim() } : null);
      setEditingDisplayName(false);
      toast.success('Display name updated!');
    } catch (error) {
      console.error('Error saving display name:', error);
      toast.error('Failed to update display name');
    } finally {
      setSavingDisplayName(false);
    }
  };

  const handleCancelEditingDisplayName = () => {
    setEditingDisplayName(false);
    setDisplayNameValue('');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50">
        <header className="bg-white border-b border-slate-200 shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex items-center justify-between gap-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-lime-500 to-green-600 rounded-xl flex items-center justify-center shadow-sm">
                  <Sprout className="w-6 h-6 text-white" />
                </div>
                <h1 className="text-2xl font-bold text-slate-900">StorySeed</h1>
              </div>
              <div className="hidden md:flex items-center gap-6">
                <SkeletonDashboardStats />
              </div>
            </div>
          </div>
        </header>
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="mb-8 animate-pulse">
            <div className="h-8 bg-slate-200 rounded w-1/3 mb-2"></div>
            <div className="h-5 bg-slate-200 rounded w-1/4"></div>
          </div>
          <div className="bg-slate-200 rounded-2xl h-48 mb-8 animate-pulse"></div>
          <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
            <div className="h-6 bg-slate-200 rounded w-1/4 mb-4 animate-pulse"></div>
            <div className="space-y-3">
              <SkeletonBookCard />
              <SkeletonBookCard />
              <SkeletonBookCard />
            </div>
          </div>
        </main>
      </div>
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
                  onClick={() => navigate('/projects')}
                  className="flex items-center gap-2 px-3 py-1.5 bg-blue-50 border border-blue-200 rounded-full hover:bg-blue-100 transition-colors group"
                >
                  <BookOpen className="w-4 h-4 text-blue-600" />
                  <span className="text-sm font-semibold text-blue-900">{books.length}</span>
                  <span className="text-sm text-blue-700">{books.length === 1 ? 'story' : 'stories'}</span>
                </button>

                <button
                  onClick={() => navigate('/history')}
                  className="flex items-center gap-2 px-3 py-1.5 bg-green-50 border border-green-200 rounded-full hover:bg-green-100 transition-colors group"
                >
                  <Lightbulb className="w-4 h-4 text-green-600" />
                  <span className="text-sm font-semibold text-green-900">{totalPromptCount}</span>
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
            onClick={() => navigate('/prompt')}
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
                  onClick={() => navigate(`/projects/${book.id}`)}
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
                onClick={() => navigate('/projects')}
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
              onClick={() => navigate('/projects')}
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
