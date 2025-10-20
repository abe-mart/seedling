import { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { Loader2, Send, ChevronLeft, Sparkles, BookOpen } from 'lucide-react';
import toast from 'react-hot-toast';

export default function DailyPromptWrite() {
  const { logId } = useParams();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [promptData, setPromptData] = useState(null);
  const [responseText, setResponseText] = useState('');
  const [wordCount, setWordCount] = useState(0);

  useEffect(() => {
    loadPrompt();
  }, [logId, token]);

  useEffect(() => {
    // Update word count
    const words = responseText.trim().split(/\s+/).filter(w => w).length;
    setWordCount(words);
  }, [responseText]);

  async function loadPrompt() {
    if (!token) {
      toast.error('Invalid or missing access token');
      return;
    }

    try {
      const response = await fetch(`/api/daily-prompts/${logId}?token=${token}`);
      
      if (!response.ok) {
        if (response.status === 401) {
          toast.error('This link has expired or is invalid');
        } else {
          toast.error('Failed to load prompt');
        }
        return;
      }

      const data = await response.json();
      setPromptData(data);
    } catch (error) {
      console.error('Error loading prompt:', error);
      toast.error('Failed to load prompt');
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    
    if (!responseText.trim()) {
      toast.error('Please write something before submitting');
      return;
    }

    setSubmitting(true);

    try {
      const response = await fetch(`/api/daily-prompts/${logId}/respond`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, responseText })
      });

      if (!response.ok) {
        throw new Error('Failed to submit response');
      }

      toast.success(
        (t) => (
          <div>
            <div className="font-semibold mb-1">Response saved! 🎉</div>
            <div className="text-sm">Great work keeping your streak alive! Redirecting to your dashboard...</div>
          </div>
        ),
        { duration: 3000 }
      );
      
      // Redirect to dashboard after brief delay
      setTimeout(() => {
        navigate('/');
      }, 2000);

    } catch (error) {
      console.error('Error submitting response:', error);
      toast.error('Failed to save response');
      setSubmitting(false);
    }
  }

  async function handleSkip() {
    if (!confirm('Are you sure you want to skip today\'s prompt? This will count toward your skip streak.')) {
      return;
    }

    try {
      const response = await fetch(`/api/daily-prompts/skip/${logId}?token=${token}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: 'User skipped from email' })
      });

      const data = await response.json();

      if (data.paused) {
        toast.error(
          (t) => (
            <div>
              <div className="font-semibold mb-1">Daily prompts paused</div>
              <div className="text-sm">You've skipped too many prompts. Re-enable in settings when you're ready!</div>
            </div>
          ),
          { duration: 5000 }
        );
        setTimeout(() => {
          navigate('/settings/daily-prompts');
        }, 3000);
      } else {
        toast.success(
          (t) => (
            <div>
              <div className="font-semibold mb-1">Prompt skipped</div>
              <div className="text-sm">No worries! Tomorrow's prompt will be waiting for you. 📧</div>
            </div>
          ),
          { duration: 3000 }
        );
        setTimeout(() => {
          navigate('/');
        }, 2000);
      }

    } catch (error) {
      console.error('Error skipping prompt:', error);
      toast.error('Failed to skip prompt');
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-lime-50 dark:from-emerald-950 dark:via-slate-900 dark:to-lime-950 flex items-center justify-center transition-colors">
        <div className="text-center">
          <Loader2 className="w-8 h-8 text-emerald-600 dark:text-emerald-400 animate-spin mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">Loading your prompt...</p>
        </div>
      </div>
    );
  }

  if (!promptData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-lime-50 dark:from-emerald-950 dark:via-slate-900 dark:to-lime-950 flex items-center justify-center p-4 transition-colors">
        <div className="max-w-md w-full bg-white dark:bg-slate-800 rounded-2xl shadow-lg p-8 text-center border border-gray-200 dark:border-slate-700">
          <div className="w-16 h-16 bg-red-100 dark:bg-red-950 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-3xl">❌</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Link Invalid or Expired</h1>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            This daily prompt link is no longer valid. Links expire after 24 hours.
          </p>
          <a
            href="/"
            className="inline-flex items-center gap-2 px-6 py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
            Go to StorySeed
          </a>
        </div>
      </div>
    );
  }

  const hasResponded = !!promptData.responded_at;

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-lime-50 dark:from-emerald-950 dark:via-slate-900 dark:to-lime-950 transition-colors">
      <div className="max-w-3xl mx-auto p-4 py-8">
        {/* Header */}
        <div className="mb-8 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-emerald-500 to-lime-500 rounded-2xl mb-4 shadow-lg">
            <Sparkles className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Your Daily Writing Prompt</h1>
          <p className="text-gray-600 dark:text-gray-400">Take a few minutes to develop your story</p>
        </div>

        {/* Context Card */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg p-6 mb-6 border border-gray-200 dark:border-slate-700 transition-colors">
          <div className="flex items-start gap-4 mb-6">
            <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-br from-emerald-100 to-lime-100 dark:from-emerald-900 dark:to-lime-900 rounded-xl flex items-center justify-center">
              <BookOpen className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Story</p>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">{promptData.book_title}</h2>
              {promptData.element_name && (
                <>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-1 capitalize">{promptData.element_type?.replace('_', ' ')}</p>
                  <p className="text-lg font-medium text-gray-700 dark:text-gray-300">{promptData.element_name}</p>
                </>
              )}
            </div>
          </div>

          {/* Prompt */}
          <div className="bg-gradient-to-br from-emerald-50 to-lime-50 dark:from-emerald-950 dark:to-lime-950 rounded-xl p-6 border-2 border-emerald-100 dark:border-emerald-800">
            <p className="text-lg leading-relaxed text-gray-900 dark:text-white">{promptData.prompt_text}</p>
          </div>
        </div>

        {hasResponded ? (
          /* Already Responded */
          <div className="bg-green-50 dark:bg-green-950 border-2 border-green-200 dark:border-green-800 rounded-2xl p-8 text-center transition-colors">
            <div className="w-16 h-16 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-3xl">✓</span>
            </div>
            <h2 className="text-2xl font-bold text-green-900 dark:text-green-200 mb-2">Already Completed! 🎉</h2>
            <p className="text-green-700 dark:text-green-300">
              You've already responded to this prompt. Great work keeping your streak alive!
            </p>
          </div>
        ) : (
          /* Response Form */
          <form onSubmit={handleSubmit} className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg p-6 border border-gray-200 dark:border-slate-700 transition-colors">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Your Response
            </label>
            <textarea
              value={responseText}
              onChange={(e) => setResponseText(e.target.value)}
              placeholder="Start writing... Let your creativity flow!"
              className="w-full h-64 px-4 py-3 border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-white rounded-xl resize-none focus:ring-2 focus:ring-emerald-500 dark:focus:ring-emerald-600 focus:border-transparent transition-all placeholder-gray-400 dark:placeholder-gray-500"
              disabled={submitting}
            />

            <div className="flex items-center justify-between mt-4">
              <div className="text-sm text-gray-500 dark:text-gray-400">
                {wordCount} {wordCount === 1 ? 'word' : 'words'}
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={handleSkip}
                  disabled={submitting}
                  className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 font-medium transition-colors disabled:opacity-50"
                >
                  Skip Today
                </button>
                <button
                  type="submit"
                  disabled={submitting || !responseText.trim()}
                  className="inline-flex items-center gap-2 px-6 py-2 bg-gradient-to-r from-emerald-600 to-lime-600 text-white rounded-lg hover:from-emerald-700 hover:to-lime-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md hover:shadow-lg font-medium"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      Submit Response
                    </>
                  )}
                </button>
              </div>
            </div>
          </form>
        )}

        {/* Footer */}
        <div className="mt-8 text-center text-sm text-gray-500 dark:text-gray-400">
          <p>Powered by StorySeed 🌱</p>
          <p className="mt-1">
            <a href="/" className="text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 transition-colors">
              Visit StorySeed
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
