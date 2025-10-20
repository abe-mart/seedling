import { useState, useEffect } from 'react';
import { Settings, Mail, Clock, BookOpen, Save, Loader2, Bell, ChevronLeft, Send } from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';

interface Book {
  id: string;
  title: string;
}

interface Preferences {
  enabled: boolean;
  delivery_time: string;
  timezone: string;
  focus_story_id: string | null;
  email_format: string;
  include_character: boolean;
  include_plot: boolean;
  include_worldbuilding: boolean;
  include_dialogue: boolean;
  include_conflict: boolean;
  include_general: boolean;
  focus_underdeveloped: boolean;
  avoid_repetition_days: number;
  include_context: boolean;
  include_previous_answers: boolean;
  send_streak_warning: boolean;
  pause_after_skips: number;
}

export default function DailyPromptSettings() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const unsubscribe = searchParams.get('unsubscribe') === 'true';
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [sendingTest, setSendingTest] = useState(false);
  const [books, setBooks] = useState<Book[]>([]);
  const [preferences, setPreferences] = useState<Preferences>({
    enabled: false,
    delivery_time: '09:00',
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    focus_story_id: null,
    email_format: 'minimal',
    include_character: true,
    include_plot: true,
    include_worldbuilding: true,
    include_dialogue: true,
    include_conflict: true,
    include_general: true,
    focus_underdeveloped: true,
    avoid_repetition_days: 7,
    include_context: true,
    include_previous_answers: true,
    send_streak_warning: true,
    pause_after_skips: 3
  });

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    // Show unsubscribe message if coming from email unsubscribe link
    if (unsubscribe && !loading) {
      toast(
        (t) => (
          <div>
            <div className="font-semibold mb-1">Want to unsubscribe?</div>
            <div className="text-sm mb-3">Simply toggle "Enable Daily Prompts" below to stop receiving emails.</div>
            <button
              onClick={() => toast.dismiss(t.id)}
              className="text-xs text-emerald-600 hover:text-emerald-700 font-medium"
            >
              Got it
            </button>
          </div>
        ),
        { duration: 8000, icon: '📧' }
      );
    }
  }, [unsubscribe, loading]);

  async function loadData() {
    try {
      // Load user's books
      const booksRes = await fetch('/api/books', { credentials: 'include' });
      if (booksRes.ok) {
        const booksData = await booksRes.json();
        setBooks(booksData);
      }

      // Load preferences
      const prefsRes = await fetch('/api/daily-prompts/preferences', { credentials: 'include' });
      if (prefsRes.ok) {
        const prefsData = await prefsRes.json();
        setPreferences(prev => ({ ...prev, ...prefsData }));
      }
    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('Failed to load preferences');
    } finally {
      setLoading(false);
    }
  }

  async function handleSave() {
    setSaving(true);

    try {
      const response = await fetch('/api/daily-prompts/preferences', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(preferences)
      });

      if (!response.ok) {
        throw new Error('Failed to save preferences');
      }

      toast.success('Preferences saved successfully!');
    } catch (error) {
      console.error('Error saving preferences:', error);
      toast.error('Failed to save preferences');
    } finally {
      setSaving(false);
    }
  }

  async function handleSendTestEmail() {
    setSendingTest(true);

    try {
      const response = await fetch('/api/daily-prompts/send-test-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include'
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to send test email');
      }

      toast.success(
        (t) => (
          <div>
            <div className="font-semibold mb-1">Test email sent! 📧</div>
            <div className="text-sm">Check your inbox and spam folder. It may take a minute to arrive.</div>
          </div>
        ),
        { duration: 6000 }
      );
    } catch (error: any) {
      console.error('Error sending test email:', error);
      toast.error(error.message || 'Failed to send test email');
    } finally {
      setSendingTest(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-lime-50 dark:from-emerald-950 dark:via-slate-900 dark:to-lime-950 flex items-center justify-center transition-colors">
        <Loader2 className="w-8 h-8 text-emerald-600 dark:text-emerald-400 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-lime-50 dark:from-emerald-950 dark:via-slate-900 dark:to-lime-950 transition-colors">
      <div className="max-w-4xl mx-auto p-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => navigate('/')}
            className="inline-flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white mb-4 transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
            Back to Dashboard
          </button>
          
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-gradient-to-br from-emerald-500 to-lime-500 rounded-2xl flex items-center justify-center shadow-lg">
              <Settings className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Daily Writing Prompts</h1>
              <p className="text-gray-600 dark:text-gray-400">Configure your daily email prompts and preferences</p>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          {/* Enable/Disable */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg p-6 border border-gray-200 dark:border-slate-700 transition-colors">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Bell className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
                <div>
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Enable Daily Prompts</h2>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Receive a writing prompt via email every day</p>
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={preferences.enabled}
                  onChange={(e) => setPreferences({ ...preferences, enabled: e.target.checked })}
                  className="sr-only peer"
                />
                <div className="w-14 h-8 bg-gray-200 dark:bg-gray-700 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-emerald-300 dark:peer-focus:ring-emerald-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[4px] after:left-[4px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-emerald-600"></div>
              </label>
            </div>
          </div>

          {/* Delivery Settings */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg p-6 border border-gray-200 dark:border-slate-700 transition-colors">
            <div className="flex items-center gap-3 mb-6">
              <Clock className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Delivery Settings</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Delivery Time
                </label>
                <input
                  type="time"
                  value={preferences.delivery_time}
                  onChange={(e) => setPreferences({ ...preferences, delivery_time: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-emerald-500 dark:focus:ring-emerald-600 focus:border-transparent transition-colors"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Timezone
                </label>
                <select
                  value={preferences.timezone}
                  onChange={(e) => setPreferences({ ...preferences, timezone: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-emerald-500 dark:focus:ring-emerald-600 focus:border-transparent transition-colors"
                >
                  <option value="America/New_York">Eastern Time</option>
                  <option value="America/Chicago">Central Time</option>
                  <option value="America/Denver">Mountain Time</option>
                  <option value="America/Los_Angeles">Pacific Time</option>
                  <option value="America/Phoenix">Arizona Time</option>
                  <option value="America/Anchorage">Alaska Time</option>
                  <option value="Pacific/Honolulu">Hawaii Time</option>
                  <option value="Europe/London">London</option>
                  <option value="Europe/Paris">Paris/Berlin</option>
                  <option value="Asia/Tokyo">Tokyo</option>
                  <option value="Australia/Sydney">Sydney</option>
                </select>
              </div>
            </div>
          </div>

          {/* Email Format */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg p-6 border border-gray-200 dark:border-slate-700 transition-colors">
            <div className="flex items-center gap-3 mb-6">
              <Mail className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Email Format</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[
                { value: 'minimal', label: 'Minimal', desc: 'Just the prompt, clean and simple' },
                { value: 'detailed', label: 'Detailed', desc: 'Includes story context and element details' },
                { value: 'inspirational', label: 'Inspirational', desc: 'Motivational quotes and beautiful design' }
              ].map((format) => (
                <label
                  key={format.value}
                  className={`relative flex flex-col p-4 border-2 rounded-xl cursor-pointer transition-all ${
                    preferences.email_format === format.value
                      ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950'
                      : 'border-gray-200 dark:border-slate-600 hover:border-emerald-200 dark:hover:border-emerald-700'
                  }`}
                >
                  <input
                    type="radio"
                    name="email_format"
                    value={format.value}
                    checked={preferences.email_format === format.value}
                    onChange={(e) => setPreferences({ ...preferences, email_format: e.target.value })}
                    className="sr-only"
                  />
                  <span className="font-medium text-gray-900 dark:text-white mb-1">{format.label}</span>
                  <span className="text-sm text-gray-600 dark:text-gray-400">{format.desc}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Story Focus */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg p-6 border border-gray-200 dark:border-slate-700 transition-colors">
            <div className="flex items-center gap-3 mb-6">
              <BookOpen className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Story Focus</h2>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Focus on Specific Story (Optional)
              </label>
              <select
                value={preferences.focus_story_id || ''}
                onChange={(e) => setPreferences({ ...preferences, focus_story_id: e.target.value || null })}
                className="w-full px-4 py-2 border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-emerald-500 dark:focus:ring-emerald-600 focus:border-transparent transition-colors"
              >
                <option value="">All Stories</option>
                {books.map((book) => (
                  <option key={book.id} value={book.id}>
                    {book.title}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Prompt Types */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg p-6 border border-gray-200 dark:border-slate-700 transition-colors">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Prompt Types</h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">Choose which types of prompts you'd like to receive</p>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {[
                { key: 'include_character' as keyof Preferences, label: 'Character Development' },
                { key: 'include_plot' as keyof Preferences, label: 'Plot Development' },
                { key: 'include_worldbuilding' as keyof Preferences, label: 'Worldbuilding' },
                { key: 'include_dialogue' as keyof Preferences, label: 'Dialogue' },
                { key: 'include_conflict' as keyof Preferences, label: 'Conflict & Theme' },
                { key: 'include_general' as keyof Preferences, label: 'General Writing' }
              ].map((type) => (
                <label key={type.key} className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={preferences[type.key] as boolean}
                    onChange={(e) => setPreferences({ ...preferences, [type.key]: e.target.checked })}
                    className="w-5 h-5 text-emerald-600 dark:text-emerald-500 rounded focus:ring-2 focus:ring-emerald-500 dark:focus:ring-emerald-600"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">{type.label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Smart Features */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg p-6 border border-gray-200 dark:border-slate-700 transition-colors">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Smart Features</h2>

            <div className="space-y-4">
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={preferences.focus_underdeveloped}
                  onChange={(e) => setPreferences({ ...preferences, focus_underdeveloped: e.target.checked })}
                  className="w-5 h-5 text-emerald-600 dark:text-emerald-500 rounded focus:ring-2 focus:ring-emerald-500 dark:focus:ring-emerald-600 mt-0.5"
                />
                <div>
                  <span className="text-sm font-medium text-gray-900 dark:text-white">Focus on Underdeveloped Elements</span>
                  <p className="text-xs text-gray-600 dark:text-gray-400">Prioritize story elements with fewer responses</p>
                </div>
              </label>

              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={preferences.include_context}
                  onChange={(e) => setPreferences({ ...preferences, include_context: e.target.checked })}
                  className="w-5 h-5 text-emerald-600 dark:text-emerald-500 rounded focus:ring-2 focus:ring-emerald-500 dark:focus:ring-emerald-600 mt-0.5"
                />
                <div>
                  <span className="text-sm font-medium text-gray-900 dark:text-white">Include Element Context</span>
                  <p className="text-xs text-gray-600 dark:text-gray-400">Show descriptions and details in emails</p>
                </div>
              </label>

              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={preferences.include_previous_answers}
                  onChange={(e) => setPreferences({ ...preferences, include_previous_answers: e.target.checked })}
                  className="w-5 h-5 text-emerald-600 dark:text-emerald-500 rounded focus:ring-2 focus:ring-emerald-500 dark:focus:ring-emerald-600 mt-0.5"
                />
                <div>
                  <span className="text-sm font-medium text-gray-900 dark:text-white">Include Previous Answers</span>
                  <p className="text-xs text-gray-600 dark:text-gray-400">Show your recent responses for continuity</p>
                </div>
              </label>

              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={preferences.send_streak_warning}
                  onChange={(e) => setPreferences({ ...preferences, send_streak_warning: e.target.checked })}
                  className="w-5 h-5 text-emerald-600 dark:text-emerald-500 rounded focus:ring-2 focus:ring-emerald-500 dark:focus:ring-emerald-600 mt-0.5"
                />
                <div>
                  <span className="text-sm font-medium text-gray-900 dark:text-white">Send Streak Warnings</span>
                  <p className="text-xs text-gray-600 dark:text-gray-400">Get notified when you're about to lose your streak</p>
                </div>
              </label>
            </div>
          </div>

          {/* Test Email Button - At bottom for better UX flow */}
          {preferences.enabled && (
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950 dark:to-indigo-950 rounded-2xl shadow-lg p-6 border-2 border-blue-200 dark:border-blue-800 transition-colors">
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg">
                    <Send className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">Ready to test?</h2>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                      Send yourself a test email to preview what you'll receive and make sure everything works.
                    </p>
                    <div className="flex items-start gap-2 text-xs text-blue-700 dark:text-blue-300 bg-blue-100 dark:bg-blue-900/30 rounded-lg px-3 py-2 mt-2">
                      <span className="text-base">💡</span>
                      <div>
                        <strong>Tip:</strong> The email may take up to a minute to arrive. If you don't see it in your inbox, 
                        <strong> check your spam folder</strong> and mark it as "Not Spam" to ensure future emails arrive correctly.
                      </div>
                    </div>
                  </div>
                </div>
                <button
                  onClick={handleSendTestEmail}
                  disabled={sendingTest}
                  className="inline-flex items-center gap-2 px-8 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:from-blue-700 hover:to-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg hover:shadow-xl font-medium text-lg whitespace-nowrap flex-shrink-0"
                >
                  {sendingTest ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    <>
                      <Send className="w-5 h-5" />
                      Send Test Email
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* Save Button */}
          <div className="flex justify-end gap-4">
            <button
              onClick={handleSave}
              disabled={saving}
              className="inline-flex items-center gap-2 px-8 py-3 bg-gradient-to-r from-emerald-600 to-lime-600 text-white rounded-xl hover:from-emerald-700 hover:to-lime-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg hover:shadow-xl font-medium text-lg"
            >
              {saving ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-5 h-5" />
                  Save Preferences
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
