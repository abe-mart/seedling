import { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { api } from '../lib/api';
import { Database } from '../lib/database.types';
import { ArrowLeft, Flame, Trophy, Target, TrendingUp, Calendar, BookOpen } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

type Profile = Database['public']['Tables']['profiles']['Row'];
type Response = Database['public']['Tables']['responses']['Row'];

interface DailyStats {
  date: string;
  wordCount: number;
  promptCount: number;
  dayLabel: string;
}

interface MonthlyStats {
  month: string;
  wordCount: number;
  promptCount: number;
}

export default function Stats() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [responses, setResponses] = useState<Response[]>([]);
  const [loading, setLoading] = useState(true);
  const [dailyStats, setDailyStats] = useState<DailyStats[]>([]);
  const [monthlyStats, setMonthlyStats] = useState<MonthlyStats[]>([]);
  const [totalWords, setTotalWords] = useState(0);
  const [totalPrompts, setTotalPrompts] = useState(0);
  const [averageWordsPerDay, setAverageWordsPerDay] = useState(0);

  useEffect(() => {
    if (user) {
      loadStatsData();
    }
  }, [user]);

  const loadStatsData = async () => {
    if (!user) return;
    setLoading(true);

    try {
      const [profileData, allPrompts] = await Promise.all([
        api.profile.get(),
        api.prompts.list({})
      ]);

      setProfile(profileData);

      // Fetch all responses
      const promptIds = allPrompts.map((p: any) => p.id);
      const responsesArrays = await Promise.all(
        promptIds.map((id: string) => api.responses.list(id))
      );
      const allResponses = responsesArrays.flat();
      setResponses(allResponses);

      // Calculate stats
      calculateStats(allResponses, allPrompts);
    } catch (error) {
      console.error('Error loading stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (responses: Response[], prompts: any[]) => {
    // Total words and prompts
    const total = responses.reduce((sum, r) => sum + (r.word_count || 0), 0);
    setTotalWords(total);
    setTotalPrompts(prompts.length);

    // Group by date for daily stats
    const dailyMap = new Map<string, { words: number; prompts: number }>();
    
    responses.forEach(response => {
      const date = new Date(response.created_at).toISOString().split('T')[0];
      const existing = dailyMap.get(date) || { words: 0, prompts: 0 };
      dailyMap.set(date, {
        words: existing.words + (response.word_count || 0),
        prompts: existing.prompts + 1
      });
    });

    // Last 30 days
    const last30Days: DailyStats[] = [];
    const today = new Date();
    for (let i = 29; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      const stats = dailyMap.get(dateStr) || { words: 0, prompts: 0 };
      
      last30Days.push({
        date: dateStr,
        wordCount: stats.words,
        promptCount: stats.prompts,
        dayLabel: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
      });
    }
    setDailyStats(last30Days);

    // Calculate average words per day
    const daysWithActivity = last30Days.filter(d => d.wordCount > 0).length;
    if (daysWithActivity > 0) {
      const totalWordsLast30 = last30Days.reduce((sum, d) => sum + d.wordCount, 0);
      setAverageWordsPerDay(Math.round(totalWordsLast30 / daysWithActivity));
    }

    // Group by month for monthly stats
    const monthlyMap = new Map<string, { words: number; prompts: number }>();
    
    responses.forEach(response => {
      const date = new Date(response.created_at);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      const existing = monthlyMap.get(monthKey) || { words: 0, prompts: 0 };
      monthlyMap.set(monthKey, {
        words: existing.words + (response.word_count || 0),
        prompts: existing.prompts + 1
      });
    });

    // Last 6 months
    const last6Months: MonthlyStats[] = [];
    for (let i = 5; i >= 0; i--) {
      const date = new Date(today);
      date.setMonth(date.getMonth() - i);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      const stats = monthlyMap.get(monthKey) || { words: 0, prompts: 0 };
      
      last6Months.push({
        month: date.toLocaleDateString('en-US', { month: 'short' }),
        wordCount: stats.words,
        promptCount: stats.prompts
      });
    }
    setMonthlyStats(last6Months);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-600">Loading your stats...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/')}
              className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-slate-900">Your Writing Stats</h1>
              <p className="text-sm text-slate-600">Track your creative journey</p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Current Streak */}
          <div className="bg-gradient-to-br from-orange-500 to-red-600 rounded-xl p-6 text-white shadow-lg">
            <div className="flex items-center justify-between mb-2">
              <Flame className="w-8 h-8" />
              <span className="text-3xl font-bold">{profile?.current_streak || 0}</span>
            </div>
            <div className="text-sm opacity-90">Current Streak</div>
            <div className="text-xs opacity-75 mt-1">Days in a row</div>
          </div>

          {/* Longest Streak */}
          <div className="bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl p-6 text-white shadow-lg">
            <div className="flex items-center justify-between mb-2">
              <Trophy className="w-8 h-8" />
              <span className="text-3xl font-bold">{profile?.longest_streak || 0}</span>
            </div>
            <div className="text-sm opacity-90">Longest Streak</div>
            <div className="text-xs opacity-75 mt-1">Personal best</div>
          </div>

          {/* Total Words */}
          <div className="bg-gradient-to-br from-emerald-500 to-lime-600 rounded-xl p-6 text-white shadow-lg">
            <div className="flex items-center justify-between mb-2">
              <Target className="w-8 h-8" />
              <span className="text-3xl font-bold">{totalWords.toLocaleString()}</span>
            </div>
            <div className="text-sm opacity-90">Total Words</div>
            <div className="text-xs opacity-75 mt-1">All time</div>
          </div>

          {/* Total Prompts */}
          <div className="bg-gradient-to-br from-blue-500 to-cyan-600 rounded-xl p-6 text-white shadow-lg">
            <div className="flex items-center justify-between mb-2">
              <BookOpen className="w-8 h-8" />
              <span className="text-3xl font-bold">{totalPrompts}</span>
            </div>
            <div className="text-sm opacity-90">Total Prompts</div>
            <div className="text-xs opacity-75 mt-1">Completed</div>
          </div>
        </div>

        {/* Charts Row 1 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Daily Activity - Last 30 Days */}
          <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-emerald-100 rounded-lg">
                <TrendingUp className="w-5 h-5 text-emerald-600" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900">Daily Word Count</h3>
                <p className="text-sm text-slate-600">Last 30 days</p>
              </div>
            </div>
            {dailyStats.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <AreaChart data={dailyStats}>
                  <defs>
                    <linearGradient id="wordGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0.1}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis 
                    dataKey="dayLabel" 
                    tick={{ fontSize: 12 }}
                    stroke="#94a3b8"
                  />
                  <YAxis 
                    tick={{ fontSize: 12 }}
                    stroke="#94a3b8"
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#1e293b',
                      border: 'none',
                      borderRadius: '8px',
                      color: '#fff'
                    }}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="wordCount" 
                    stroke="#10b981" 
                    strokeWidth={2}
                    fill="url(#wordGradient)" 
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-64 flex items-center justify-center text-slate-400">
                No data yet - start writing!
              </div>
            )}
          </div>

          {/* Monthly Trends */}
          <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Calendar className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900">Monthly Progress</h3>
                <p className="text-sm text-slate-600">Last 6 months</p>
              </div>
            </div>
            {monthlyStats.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={monthlyStats}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis 
                    dataKey="month" 
                    tick={{ fontSize: 12 }}
                    stroke="#94a3b8"
                  />
                  <YAxis 
                    tick={{ fontSize: 12 }}
                    stroke="#94a3b8"
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#1e293b',
                      border: 'none',
                      borderRadius: '8px',
                      color: '#fff'
                    }}
                  />
                  <Bar 
                    dataKey="wordCount" 
                    fill="#3b82f6" 
                    radius={[8, 8, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-64 flex items-center justify-center text-slate-400">
                No monthly data yet
              </div>
            )}
          </div>
        </div>

        {/* Additional Stats */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
          <h3 className="text-lg font-bold text-slate-900 mb-4">Quick Stats</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center p-4 bg-gradient-to-br from-emerald-50 to-lime-50 rounded-lg border border-emerald-200">
              <div className="text-3xl font-bold text-emerald-700 mb-1">
                {averageWordsPerDay}
              </div>
              <div className="text-sm text-slate-600">Avg Words/Day</div>
              <div className="text-xs text-slate-500 mt-1">(Active days)</div>
            </div>
            <div className="text-center p-4 bg-gradient-to-br from-blue-50 to-cyan-50 rounded-lg border border-blue-200">
              <div className="text-3xl font-bold text-blue-700 mb-1">
                {totalPrompts > 0 ? Math.round(totalWords / totalPrompts) : 0}
              </div>
              <div className="text-sm text-slate-600">Avg Words/Prompt</div>
              <div className="text-xs text-slate-500 mt-1">Response length</div>
            </div>
            <div className="text-center p-4 bg-gradient-to-br from-purple-50 to-pink-50 rounded-lg border border-purple-200">
              <div className="text-3xl font-bold text-purple-700 mb-1">
                {dailyStats.filter(d => d.wordCount > 0).length}
              </div>
              <div className="text-sm text-slate-600">Active Days</div>
              <div className="text-xs text-slate-500 mt-1">Last 30 days</div>
            </div>
          </div>
        </div>

        {/* Motivational Message */}
        {profile?.current_streak && profile.current_streak >= 3 && (
          <div className="mt-6 bg-gradient-to-r from-orange-500 to-red-600 rounded-xl p-6 text-white text-center shadow-lg">
            <Flame className="w-12 h-12 mx-auto mb-3" />
            <h3 className="text-xl font-bold mb-2">You're on fire! 🔥</h3>
            <p className="text-sm opacity-90">
              {profile.current_streak} days strong! Keep up the amazing work!
            </p>
          </div>
        )}
      </main>
    </div>
  );
}
