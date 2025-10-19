import { useState, useEffect } from 'react';
import { X, Save, Calendar, MessageSquare, Lightbulb, Edit3 } from 'lucide-react';
import { api } from '../lib/api';
import { Database } from '../lib/database.types';
import toast from 'react-hot-toast';

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

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 overflow-y-auto">
      <div className="bg-white rounded-xl max-w-3xl w-full my-8 shadow-2xl">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-slate-200 px-6 py-4 rounded-t-xl flex items-center justify-between">
          <div className="flex-1 mr-4">
            {isEditing ? (
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="text-2xl font-bold text-slate-900 w-full px-2 py-1 border-2 border-slate-300 rounded focus:border-slate-900 outline-none"
                autoFocus
              />
            ) : (
              <h2 className="text-2xl font-bold text-slate-900">{element.name}</h2>
            )}
            <p className="text-sm text-slate-600 capitalize mt-1">
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
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving || !name.trim()}
                  className="px-4 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-colors disabled:opacity-50 inline-flex items-center gap-2"
                >
                  <Save className="w-4 h-4" />
                  {saving ? 'Saving...' : 'Save'}
                </button>
              </>
            ) : (
              <button
                onClick={() => setIsEditing(true)}
                className="px-4 py-2 bg-slate-100 text-slate-900 rounded-lg hover:bg-slate-200 transition-colors inline-flex items-center gap-2"
              >
                <Edit3 className="w-4 h-4" />
                Edit
              </button>
            )}
            <button
              onClick={onClose}
              className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="px-6 py-6 max-h-[calc(100vh-12rem)] overflow-y-auto">
          {/* Description Section */}
          <div className="mb-6">
            <label className="block text-sm font-semibold text-slate-700 mb-2">Description</label>
            {isEditing ? (
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900 focus:border-transparent outline-none resize-none"
                placeholder="Add a description..."
              />
            ) : (
              <p className="text-slate-700 whitespace-pre-wrap">
                {element.description || <span className="text-slate-400 italic">No description</span>}
              </p>
            )}
          </div>

          {/* Notes Section */}
          <div className="mb-6">
            <label className="block text-sm font-semibold text-slate-700 mb-2">Notes</label>
            {isEditing ? (
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={4}
                className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900 focus:border-transparent outline-none resize-none"
                placeholder="Add notes, ideas, backstory..."
              />
            ) : (
              <p className="text-slate-700 whitespace-pre-wrap">
                {element.notes || <span className="text-slate-400 italic">No notes yet</span>}
              </p>
            )}
          </div>

          {/* Related Prompts Section */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <Lightbulb className="w-5 h-5 text-slate-700" />
              <h3 className="text-lg font-semibold text-slate-900">
                Related Prompts & Responses
              </h3>
              <span className="text-sm text-slate-500">({relatedPrompts.length})</span>
            </div>

            {loading ? (
              <div className="text-center py-8 text-slate-500">Loading...</div>
            ) : relatedPrompts.length === 0 ? (
              <div className="bg-slate-50 rounded-lg p-6 text-center">
                <p className="text-slate-600">No prompts reference this element yet</p>
                <p className="text-sm text-slate-500 mt-1">
                  Generate prompts that include this element to see them here
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {relatedPrompts.map((prompt) => (
                  <div
                    key={prompt.id}
                    className="border border-slate-200 rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
                    onClick={() => onNavigateToPrompt && onNavigateToPrompt(prompt.id)}
                  >
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div className="flex items-center gap-2 text-sm text-slate-500">
                        <Calendar className="w-4 h-4" />
                        {formatDate(prompt.generated_at)}
                      </div>
                      <span className="text-xs px-2 py-1 bg-slate-100 text-slate-700 rounded capitalize">
                        {prompt.prompt_type.replace('_', ' ')}
                      </span>
                    </div>
                    
                    <p className="text-slate-900 text-sm mb-3 line-clamp-3">
                      {prompt.prompt_text}
                    </p>

                    {prompt.response && (
                      <div className="mt-3 pt-3 border-t border-slate-100">
                        <div className="flex items-center gap-2 mb-2">
                          <MessageSquare className="w-4 h-4 text-green-600" />
                          <span className="text-sm font-medium text-green-700">Response</span>
                          <span className="text-xs text-slate-500">
                            ({prompt.response.word_count} words)
                          </span>
                        </div>
                        <p className="text-sm text-slate-700 line-clamp-2">
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
    </div>
  );
}
