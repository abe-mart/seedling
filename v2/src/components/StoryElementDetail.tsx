import { useState, useEffect } from 'react';
import { X, Save, Calendar, MessageSquare, Lightbulb, Edit3, Sparkles } from 'lucide-react';
import { api } from '../lib/api';
import { Database } from '../lib/database.types';
import toast from 'react-hot-toast';
import { SkeletonText } from './SkeletonLoader';

type StoryElement = Database['public']['Tables']['story_elements']['Row'];
type Prompt = Database['public']['Tables']['prompts']['Row'];
type Response = Database['public']['Tables']['responses']['Row'];

interface PromptWithResponse extends Prompt {
  response?: Response | null;
}

interface StoryElementDetailProps {
  element: StoryElement;
  onClose: () => void;
  onUpdate: () => void;
  onNavigateToPrompt?: (promptId: string) => void;
}

export default function StoryElementDetail({ element, onClose, onUpdate, onNavigateToPrompt }: StoryElementDetailProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(element.name);
  const [description, setDescription] = useState(element.description || '');
  const [notes, setNotes] = useState(element.notes || '');
  const [relatedPrompts, setRelatedPrompts] = useState<PromptWithResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [enhancing, setEnhancing] = useState(false);
  const [showEnhancedPreview, setShowEnhancedPreview] = useState(false);
  const [enhancedDescription, setEnhancedDescription] = useState('');

  useEffect(() => {
    loadRelatedPrompts();
  }, [element.id]);

  const loadRelatedPrompts = async () => {
    setLoading(true);
    
    try {
      // Load all prompts and filter client-side for element references
      const allPrompts = await api.prompts.list({});
      const promptsData = allPrompts.filter((prompt: Prompt) => 
        prompt.element_references && prompt.element_references.includes(element.id)
      );

      if (promptsData && promptsData.length > 0) {
        // Load responses for these prompts
        const responsesData = await Promise.all(
          promptsData.map((prompt: Prompt) => api.responses.list(prompt.id))
        );

        // Combine prompts with their responses
        const promptsWithResponses = promptsData.map((prompt: Prompt) => ({
          ...prompt,
          response: responsesData.flat().find((r: Response) => r.prompt_id === prompt.id) || null,
        }));

        setRelatedPrompts(promptsWithResponses);
      }
    } catch (error) {
      console.error('Error loading related prompts:', error);
    }
    
    setLoading(false);
  };

  const handleSave = async () => {
    setSaving(true);
    
    try {
      await api.elements.update(element.id, {
        name,
        description,
        notes,
      });
      
      setIsEditing(false);
      onUpdate();
      toast.success('Element updated successfully!');
    } catch (error) {
      console.error('Error saving element:', error);
      toast.error('Failed to update element');
    }
    
    setSaving(false);
  };

  const handleEnhanceDescription = async () => {
    if (relatedPrompts.length === 0) {
      toast.error('No prompts/responses yet. Write some first to enhance the description.');
      return;
    }

    setEnhancing(true);
    const toastId = toast.loading('Consolidating your notes...');

    try {
      const result = await api.ai.enhanceElementDescription(element.id);
      setEnhancedDescription(result.enhancedDescription);
      setShowEnhancedPreview(true);
      toast.success('Notes consolidated!', { id: toastId });
    } catch (error) {
      console.error('Error enhancing description:', error);
      toast.error('Failed to enhance description. Please try again.', { id: toastId });
    } finally {
      setEnhancing(false);
    }
  };

  const handleAcceptEnhanced = () => {
    setDescription(enhancedDescription);
    setShowEnhancedPreview(false);
    setIsEditing(true);
    toast.success('Consolidated description applied! You can edit before saving.');
  };

  const handleRejectEnhanced = () => {
    setShowEnhancedPreview(false);
    setEnhancedDescription('');
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  return (
    <div className="fixed inset-0 bg-black/50 dark:bg-black/70 flex items-center justify-center p-4 z-50 overflow-y-auto">
      <div className="bg-white dark:bg-slate-800 rounded-xl max-w-3xl w-full my-8 shadow-2xl border border-slate-200 dark:border-slate-700">
        {/* Header */}
        <div className="sticky top-0 bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 px-6 py-4 rounded-t-xl flex items-center justify-between">
          <div className="flex-1 mr-4">
            {isEditing ? (
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="text-2xl font-bold text-slate-900 dark:text-white w-full px-2 py-1 border-2 border-slate-300 dark:border-slate-600 rounded focus:border-slate-900 dark:focus:border-slate-500 outline-none bg-white dark:bg-slate-700 transition-colors"
                autoFocus
              />
            ) : (
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white">{element.name}</h2>
            )}
            <p className="text-sm text-slate-600 dark:text-slate-400 capitalize mt-1">
              {element.element_type.replace('_', ' ')}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {isEditing ? (
              <>
                <button
                  onClick={() => {
                    setIsEditing(false);
                    setName(element.name);
                    setDescription(element.description || '');
                    setNotes(element.notes || '');
                  }}
                  className="px-4 py-2 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving || !name.trim()}
                  className="px-4 py-2 bg-slate-900 dark:bg-slate-600 text-white rounded-lg hover:bg-slate-800 dark:hover:bg-slate-500 transition-colors disabled:opacity-50 inline-flex items-center gap-2"
                >
                  <Save className="w-4 h-4" />
                  {saving ? 'Saving...' : 'Save'}
                </button>
              </>
            ) : (
              <button
                onClick={() => setIsEditing(true)}
                className="px-4 py-2 bg-slate-100 dark:bg-slate-700 text-slate-900 dark:text-white rounded-lg hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors inline-flex items-center gap-2"
              >
                <Edit3 className="w-4 h-4" />
                Edit
              </button>
            )}
            <button
              onClick={onClose}
              className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="px-6 py-6 max-h-[calc(100vh-12rem)] overflow-y-auto">
          {/* Description Section */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300">Description</label>
              {!isEditing && relatedPrompts.length > 0 && (
                <button
                  onClick={handleEnhanceDescription}
                  disabled={enhancing}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-slate-600 dark:text-slate-400 hover:text-purple-700 dark:hover:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-950 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed border border-slate-200 dark:border-slate-600 hover:border-purple-300 dark:hover:border-purple-700"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  {enhancing ? 'Consolidating...' : 'Consolidate Notes'}
                </button>
              )}
            </div>
            {isEditing ? (
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-slate-900 dark:focus:ring-slate-500 focus:border-transparent outline-none resize-none bg-white dark:bg-slate-700 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500"
                placeholder="Add a description..."
              />
            ) : (
              <p className="text-slate-700 dark:text-slate-300 whitespace-pre-wrap">
                {element.description || <span className="text-slate-400 dark:text-slate-500 italic">No description</span>}
              </p>
            )}
          </div>

          {/* Notes Section */}
          <div className="mb-6">
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Notes</label>
            {isEditing ? (
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={4}
                className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-slate-900 dark:focus:ring-slate-500 focus:border-transparent outline-none resize-none bg-white dark:bg-slate-700 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500"
                placeholder="Add notes, ideas, backstory..."
              />
            ) : (
              <p className="text-slate-700 dark:text-slate-300 whitespace-pre-wrap">
                {element.notes || <span className="text-slate-400 dark:text-slate-500 italic">No notes yet</span>}
              </p>
            )}
          </div>

          {/* Related Prompts Section */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <Lightbulb className="w-5 h-5 text-slate-700 dark:text-slate-400" />
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                Related Prompts & Responses
              </h3>
              <span className="text-sm text-slate-500 dark:text-slate-400">({relatedPrompts.length})</span>
            </div>

            {loading ? (
              <div className="space-y-4">
                <SkeletonText lines={4} />
                <SkeletonText lines={3} />
              </div>
            ) : relatedPrompts.length === 0 ? (
              <div className="bg-slate-50 dark:bg-slate-700/50 rounded-lg p-6 text-center">
                <p className="text-slate-600 dark:text-slate-400">No prompts reference this element yet</p>
                <p className="text-sm text-slate-500 dark:text-slate-500 mt-1">
                  Generate prompts that include this element to see them here
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {relatedPrompts.map((prompt) => (
                  <div
                    key={prompt.id}
                    className="border border-slate-200 dark:border-slate-700 rounded-lg p-4 hover:shadow-md transition-all cursor-pointer bg-white dark:bg-slate-700/30"
                    onClick={() => onNavigateToPrompt && onNavigateToPrompt(prompt.id)}
                  >
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
                        <Calendar className="w-4 h-4" />
                        {formatDate(prompt.generated_at)}
                      </div>
                      <span className="text-xs px-2 py-1 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded capitalize">
                        {prompt.prompt_type.replace('_', ' ')}
                      </span>
                    </div>
                    
                    <p className="text-slate-900 dark:text-white text-sm mb-3 line-clamp-3">
                      {prompt.prompt_text}
                    </p>

                    {prompt.response && (
                      <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-600">
                        <div className="flex items-center gap-2 mb-2">
                          <MessageSquare className="w-4 h-4 text-green-600 dark:text-green-400" />
                          <span className="text-sm font-medium text-green-700 dark:text-green-400">Response</span>
                          <span className="text-xs text-slate-500 dark:text-slate-400">
                            ({prompt.response.word_count} words)
                          </span>
                        </div>
                        <p className="text-sm text-slate-700 dark:text-slate-300 line-clamp-2">
                          {prompt.response.response_text}
                        </p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Enhanced Description Preview Modal */}
      {showEnhancedPreview && (
        <div className="fixed inset-0 bg-black/60 dark:bg-black/80 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-slate-800 rounded-xl max-w-2xl w-full shadow-2xl max-h-[90vh] overflow-y-auto border border-slate-200 dark:border-slate-700">
            <div className="sticky top-0 bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 px-6 py-4 rounded-t-xl">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-gradient-to-br from-purple-500 to-blue-500 rounded-lg">
                  <Sparkles className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white">Consolidated Description</h3>
                  <p className="text-sm text-slate-600 dark:text-slate-400">Review your notes merged into one description</p>
                </div>
              </div>
            </div>

            <div className="px-6 py-6">
              {/* Info Banner */}
              <div className="mb-4 p-4 bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg">
                <p className="text-sm text-blue-800 dark:text-blue-300">
                  <strong>Note:</strong> This consolidates your scattered notes, description, and Q&A responses 
                  into one organized description. Only information you wrote is included. Review and edit as needed.
                </p>
              </div>

              {/* Original Description (if exists) */}
              {element.description && (
                <div className="mb-6">
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                    Current Description
                  </label>
                  <div className="p-4 bg-slate-50 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600 rounded-lg">
                    <p className="text-sm text-slate-700 dark:text-slate-300 whitespace-pre-wrap">{element.description}</p>
                  </div>
                </div>
              )}

              {/* Consolidated Description */}
              <div className="mb-6">
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                  Consolidated Description
                </label>
                <div className="p-4 bg-gradient-to-br from-purple-50 to-blue-50 dark:from-purple-950 dark:to-blue-950 border-2 border-purple-200 dark:border-purple-700 rounded-lg">
                  <p className="text-slate-800 dark:text-slate-200 whitespace-pre-wrap leading-relaxed">{enhancedDescription}</p>
                </div>
              </div>

              {/* Info Note */}
              <div className="mb-6 p-3 bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800 rounded-lg">
                <p className="text-sm text-amber-800 dark:text-amber-300">
                  <strong>Tip:</strong> This is just a consolidation tool. After applying, you'll enter edit 
                  mode where you can refine and personalize the description before saving.
                </p>
              </div>
            </div>

            {/* Footer Actions */}
            <div className="sticky bottom-0 bg-slate-50 dark:bg-slate-800 border-t border-slate-200 dark:border-slate-700 px-6 py-4 rounded-b-xl flex justify-end gap-3">
              <button
                onClick={handleRejectEnhanced}
                className="px-6 py-2 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleAcceptEnhanced}
                className="px-6 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:from-purple-700 hover:to-blue-700 transition-all font-medium flex items-center gap-2"
              >
                <Sparkles className="w-4 h-4" />
                Apply & Edit
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
