import { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { Database } from '../lib/database.types';
import { Flame, BookOpen, PenTool, LogOut, Plus, Users, MapPin, Lightbulb } from 'lucide-react';
import PromptInterface from './PromptInterface';
import ProjectManager from './ProjectManager';

type Profile = Database['public']['Tables']['profiles']['Row'];
type Book = Database['public']['Tables']['books']['Row'];
type Prompt = Database['public']['Tables']['prompts']['Row'];

export default function Dashboard() {
  const { user, signOut } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [books, setBooks] = useState<Book[]>([]);
  const [recentPrompts, setRecentPrompts] = useState<Prompt[]>([]);
  const [activeView, setActiveView] = useState<'dashboard' | 'prompt' | 'projects'>('dashboard');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadDashboardData();
    }
  }, [user]);

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
    return <ProjectManager onBack={() => setActiveView('dashboard')} />;
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-slate-900 rounded-xl flex items-center justify-center">
                <PenTool className="w-5 h-5 text-white" />
              </div>
              <h1 className="text-2xl font-bold text-slate-900">Story Forge</h1>
            </div>
            <button
              onClick={handleSignOut}
              className="flex items-center gap-2 px-4 py-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
            >
              <LogOut className="w-4 h-4" />
              Sign Out
            </button>
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

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center">
                <Flame className="w-6 h-6 text-orange-600" />
              </div>
              <div className="text-right">
                <div className="text-3xl font-bold text-slate-900">{profile?.current_streak || 0}</div>
                <div className="text-sm text-slate-600">day streak</div>
              </div>
            </div>
            <div className="text-sm text-slate-500">
              Longest: {profile?.longest_streak || 0} days
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                <BookOpen className="w-6 h-6 text-blue-600" />
              </div>
              <div className="text-right">
                <div className="text-3xl font-bold text-slate-900">{books.length}</div>
                <div className="text-sm text-slate-600">active {books.length === 1 ? 'project' : 'projects'}</div>
              </div>
            </div>
            <button
              onClick={() => setActiveView('projects')}
              className="text-sm text-blue-600 hover:text-blue-700 font-medium"
            >
              Manage projects →
            </button>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                <Lightbulb className="w-6 h-6 text-green-600" />
              </div>
              <div className="text-right">
                <div className="text-3xl font-bold text-slate-900">{recentPrompts.length}</div>
                <div className="text-sm text-slate-600">recent prompts</div>
              </div>
            </div>
          </div>
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
            <h3 className="text-xl font-bold text-slate-900 mb-4">Your Projects</h3>
            <div className="space-y-3">
              {books.slice(0, 3).map((book) => (
                <div
                  key={book.id}
                  className="flex items-center gap-3 p-4 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
                  onClick={() => setActiveView('projects')}
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
                onClick={() => setActiveView('projects')}
                className="mt-4 text-sm text-slate-600 hover:text-slate-900 font-medium"
              >
                View all {books.length} projects →
              </button>
            )}
          </div>
        )}

        {books.length === 0 && (
          <div className="bg-white rounded-xl p-12 text-center shadow-sm border border-slate-200">
            <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <BookOpen className="w-8 h-8 text-slate-400" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-2">No projects yet</h3>
            <p className="text-slate-600 mb-6">Create your first project to start generating prompts</p>
            <button
              onClick={() => setActiveView('projects')}
              className="bg-slate-900 text-white px-6 py-3 rounded-lg font-semibold hover:bg-slate-800 transition-colors inline-flex items-center gap-2"
            >
              <Plus className="w-5 h-5" />
              Create Project
            </button>
          </div>
        )}
      </main>
    </div>
  );
}
