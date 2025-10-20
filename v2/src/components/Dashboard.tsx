import { useEffect, useState, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { api } from '../lib/api';
import { Database } from '../lib/database.types';
import { Flame, BookOpen, LogOut, Plus, Lightbulb, User, Check, X, Sprout, Moon, Sun } from 'lucide-react';
import toast from 'react-hot-toast';
import { SkeletonDashboardStats, SkeletonBookCard } from './SkeletonLoader';
import OnboardingCard from './OnboardingCard';
import { useNavigate } from 'react-router-dom';

type Profile = Database['public']['Tables']['profiles']['Row'];
type Book = Database['public']['Tables']['books']['Row'];

export default function Dashboard() {
  const { user, signOut } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [books, setBooks] = useState<Book[]>([]);
  const [totalPromptCount, setTotalPromptCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [showAccountMenu, setShowAccountMenu] = useState(false);
  const [editingDisplayName, setEditingDisplayName] = useState(false);
  const [displayNameValue, setDisplayNameValue] = useState('');
  const [savingDisplayName, setSavingDisplayName] = useState(false);
  const [dailyPromptsEnabled, setDailyPromptsEnabled] = useState(false);
  const accountMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (user) {
      loadDashboardData();
      loadDailyPromptsStatus();
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

  const loadDailyPromptsStatus = async () => {
    try {
      const preferences = await api.dailyPrompts.getPreferences();
      setDailyPromptsEnabled(preferences.enabled);
    } catch (error) {
      // Silently fail - daily prompts feature might not be configured yet
      console.log('Daily prompts not configured yet');
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
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900 transition-colors">
        <header className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex items-center justify-between gap-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-lime-500 to-green-600 rounded-xl flex items-center justify-center shadow-sm">
                  <Sprout className="w-6 h-6 text-white" />
                </div>
                <h1 className="text-2xl font-bold text-slate-900 dark:text-white">StorySeed</h1>
              </div>
              <div className="hidden md:flex items-center gap-6">
                <SkeletonDashboardStats />
              </div>
            </div>
          </div>
        </header>
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="mb-8 animate-pulse">
            <div className="h-8 bg-slate-200 dark:bg-slate-700 rounded w-1/3 mb-2"></div>
            <div className="h-5 bg-slate-200 dark:bg-slate-700 rounded w-1/4"></div>
          </div>
          <div className="bg-slate-200 dark:bg-slate-700 rounded-2xl h-48 mb-8 animate-pulse"></div>
          <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-sm border border-slate-200 dark:border-slate-700">
            <div className="h-6 bg-slate-200 dark:bg-slate-700 rounded w-1/4 mb-4 animate-pulse"></div>
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
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 transition-colors">
      <header className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between gap-6">
            {/* Logo */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-lime-500 to-green-600 rounded-xl flex items-center justify-center shadow-sm">
                <Sprout className="w-6 h-6 text-white" />
              </div>
              <h1 className="text-2xl font-bold text-slate-900 dark:text-white">StorySeed</h1>
            </div>

            {/* Stats Badges & Sign Out */}
            <div className="flex items-center gap-6">
              <div className="hidden md:flex items-center gap-3">
                <button
                  onClick={() => navigate('/stats')}
                  className="flex items-center gap-2 px-3 py-1.5 bg-orange-50 dark:bg-orange-950 border border-orange-200 dark:border-orange-800 rounded-full hover:bg-orange-100 dark:hover:bg-orange-900 transition-colors cursor-pointer"
                >
                  <Flame className="w-4 h-4 text-orange-600 dark:text-orange-400" />
                  <span className="text-sm font-semibold text-orange-900 dark:text-orange-200">{profile?.current_streak || 0}</span>
                  <span className="text-sm text-orange-700 dark:text-orange-300">day streak</span>
                </button>

                <button
                  onClick={() => navigate('/projects')}
                  className="flex items-center gap-2 px-3 py-1.5 bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-full hover:bg-blue-100 dark:hover:bg-blue-900 transition-colors group"
                >
                  <BookOpen className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  <span className="text-sm font-semibold text-blue-900 dark:text-blue-200">{books.length}</span>
                  <span className="text-sm text-blue-700 dark:text-blue-300">{books.length === 1 ? 'story' : 'stories'}</span>
                </button>

                <button
                  onClick={() => navigate('/history')}
                  className="flex items-center gap-2 px-3 py-1.5 bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-full hover:bg-green-100 dark:hover:bg-green-900 transition-colors group"
                >
                  <Lightbulb className="w-4 h-4 text-green-600 dark:text-green-400" />
                  <span className="text-sm font-semibold text-green-900 dark:text-green-200">{totalPromptCount}</span>
                  <span className="text-sm text-green-700 dark:text-green-300">prompts</span>
                </button>
              </div>

              {/* Account Menu */}
              <div className="relative" ref={accountMenuRef}>
                <button
                  onClick={() => setShowAccountMenu(!showAccountMenu)}
                  className="flex items-center gap-2 px-4 py-2 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
                >
                  <div className="w-8 h-8 bg-slate-900 dark:bg-slate-600 rounded-full flex items-center justify-center">
                    <User className="w-4 h-4 text-white" />
                  </div>
                  <span className="hidden sm:inline font-medium">
                    {profile?.display_name || user?.email?.split('@')[0]}
                  </span>
                </button>

                {showAccountMenu && (
                  <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-slate-200 dark:border-slate-700 py-2 z-50">
                    {/* User Info Section */}
                    <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-700">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-12 h-12 bg-slate-900 dark:bg-slate-600 rounded-full flex items-center justify-center">
                          <User className="w-6 h-6 text-white" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm text-slate-500 dark:text-slate-400">Signed in as</div>
                          <div className="text-sm font-medium text-slate-900 dark:text-white truncate">{user?.email}</div>
                        </div>
                      </div>

                      {/* Display Name Section */}
                      <div>
                        <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-2">
                          Display Name
                        </label>
                        {editingDisplayName ? (
                          <div className="space-y-2">
                            <input
                              type="text"
                              value={displayNameValue}
                              onChange={(e) => setDisplayNameValue(e.target.value)}
                              placeholder="Enter your name"
                              className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-900 dark:focus:ring-slate-500 focus:border-transparent placeholder:text-slate-400 dark:placeholder:text-slate-500"
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
                                className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-slate-900 dark:bg-slate-600 text-white rounded-lg text-sm font-medium hover:bg-slate-800 dark:hover:bg-slate-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                              >
                                <Check className="w-4 h-4" />
                                {savingDisplayName ? 'Saving...' : 'Save'}
                              </button>
                              <button
                                onClick={handleCancelEditingDisplayName}
                                disabled={savingDisplayName}
                                className="flex items-center justify-center gap-1.5 px-3 py-2 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg text-sm font-medium hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors disabled:opacity-50"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2">
                            <div className="flex-1 px-3 py-2 bg-slate-50 dark:bg-slate-700 rounded-lg text-sm text-slate-900 dark:text-white">
                              {profile?.display_name || 'Not set'}
                            </div>
                            <button
                              onClick={handleStartEditingDisplayName}
                              className="px-3 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
                            >
                              Edit
                            </button>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Settings Link */}
                    <button
                      onClick={() => {
                        navigate('/settings');
                        setShowAccountMenu(false);
                      }}
                      className="w-full flex items-center justify-between px-4 py-3 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors text-sm font-medium"
                    >
                      <div className="flex items-center gap-2">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                        </svg>
                        Daily Prompt Settings
                      </div>
                      {dailyPromptsEnabled && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200">
                          Active
                        </span>
                      )}
                    </button>

                    {/* Theme Toggle */}
                    <button
                      onClick={toggleTheme}
                      className="w-full flex items-center justify-between px-4 py-3 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors text-sm font-medium"
                    >
                      <div className="flex items-center gap-2">
                        {theme === 'dark' ? (
                          <>
                            <Sun className="w-4 h-4" />
                            Light Mode
                          </>
                        ) : (
                          <>
                            <Moon className="w-4 h-4" />
                            Dark Mode
                          </>
                        )}
                      </div>
                    </button>

                    {/* Sign Out Button */}
                    <button
                      onClick={handleSignOut}
                      className="w-full flex items-center gap-2 px-4 py-3 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950 transition-colors text-sm font-medium border-t border-slate-100 dark:border-slate-700"
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
          <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">
            Welcome back, {profile?.display_name || user?.email?.split('@')[0]}
          </h2>
          <p className="text-slate-600 dark:text-slate-400">Ready to expand your story world today?</p>
        </div>

        {books.length > 0 && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            {/* Generate Prompt Card */}
            <div className="bg-gradient-to-br from-slate-900 to-slate-800 dark:from-slate-800 dark:to-slate-950 rounded-2xl p-8 text-white shadow-lg">
              <h3 className="text-2xl font-bold mb-3">Ready for today's prompt?</h3>
              <p className="text-slate-300 dark:text-slate-400 mb-6">
                Generate a personalized writing prompt to deepen your story world
              </p>
              <button
                onClick={() => navigate('/prompt')}
                className="bg-white dark:bg-slate-200 text-slate-900 dark:text-slate-800 px-6 py-3 rounded-lg font-semibold hover:bg-slate-100 dark:hover:bg-slate-300 transition-colors inline-flex items-center gap-2"
              >
                <Plus className="w-5 h-5" />
                Generate New Prompt
              </button>
            </div>

            {/* Daily Prompts Card */}
            <div className="bg-gradient-to-br from-emerald-500 to-lime-500 rounded-2xl p-8 text-white shadow-lg relative overflow-hidden">
              {dailyPromptsEnabled && (
                <div className="absolute top-4 right-4">
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold bg-white/20 backdrop-blur-sm border border-white/30">
                    ✓ Enabled
                  </span>
                </div>
              )}
              <div className="flex items-start justify-between mb-3 pr-20">
                <h3 className="text-2xl font-bold">Daily Writing Prompts</h3>
                <svg className="w-8 h-8 opacity-90" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
              </div>
              <p className="text-emerald-50 mb-6">
                {dailyPromptsEnabled 
                  ? "You're all set! Daily prompts will arrive at your inbox. Check your settings to adjust." 
                  : "Get a writing prompt delivered to your inbox every day. Build your streak! 🔥"}
              </p>
              <button
                onClick={() => navigate('/settings')}
                className="bg-white text-emerald-600 px-6 py-3 rounded-lg font-semibold hover:bg-emerald-50 transition-colors inline-flex items-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                {dailyPromptsEnabled ? 'Manage Settings' : 'Set Up Daily Prompts'}
              </button>
            </div>
          </div>
        )}

        {books.length > 0 && (
          <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-sm border border-slate-200 dark:border-slate-700 transition-colors">
            <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-4">Your Stories</h3>
            <div className="space-y-3">
              {books.slice(0, 3).map((book) => (
                <div
                  key={book.id}
                  className="flex items-center gap-3 p-4 bg-slate-50 dark:bg-slate-700 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-600 transition-colors cursor-pointer"
                  onClick={() => navigate(`/projects/${book.id}`)}
                >
                  <BookOpen className="w-5 h-5 text-slate-600 dark:text-slate-400" />
                  <div className="flex-1">
                    <div className="font-semibold text-slate-900 dark:text-white">{book.title}</div>
                    {book.description && (
                      <div className="text-sm text-slate-600 dark:text-slate-400 line-clamp-1">{book.description}</div>
                    )}
                  </div>
                </div>
              ))}
            </div>
            {books.length > 3 && (
              <button
                onClick={() => navigate('/projects')}
                className="mt-4 text-sm text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white font-medium transition-colors"
              >
                View all {books.length} stories →
              </button>
            )}
          </div>
        )}

        {books.length === 0 && (
          <OnboardingCard
            icon={BookOpen}
            title="Welcome to StorySeed!"
            description="Start your creative journey by creating your first story project. Then add story elements like characters, locations, and plot points to begin generating prompts."
            actionLabel="Create Your First Story"
            actionIcon={Plus}
            onAction={() => navigate('/projects')}
          />
        )}
      </main>
    </div>
  );
}
