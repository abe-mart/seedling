import { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { api } from '../lib/api';
import { Database } from '../lib/database.types';
import {
  ArrowLeft,
  Plus,
  BookOpen,
  Users,
  MapPin,
  Lightbulb,
  Package,
  Flag,
  Trash2,
  X,
} from 'lucide-react';
import StoryElementDetail from './StoryElementDetail';
import toast from 'react-hot-toast';
import { SkeletonBookCard, SkeletonElementCard } from './SkeletonLoader';
import { useNavigate, useParams } from 'react-router-dom';

type Series = Database['public']['Tables']['series']['Row'];
type Book = Database['public']['Tables']['books']['Row'];
type StoryElement = Database['public']['Tables']['story_elements']['Row'];

export default function ProjectManager() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { bookId, elementId } = useParams();
  const [, setSeries] = useState<Series[]>([]);
  const [books, setBooks] = useState<Book[]>([]);
  const [elements, setElements] = useState<StoryElement[]>([]);
  const [selectedBook, setSelectedBook] = useState<Book | null>(null);
  const [selectedElement, setSelectedElement] = useState<StoryElement | null>(null);
  const [showModal, setShowModal] = useState<'series' | 'book' | 'element' | null>(null);
  const [bookToDelete, setBookToDelete] = useState<Book | null>(null);
  const [formData, setFormData] = useState({ title: '', description: '', elementType: 'character' as const });
  const [loadingBooks, setLoadingBooks] = useState(true);
  const [loadingElements, setLoadingElements] = useState(false);

  useEffect(() => {
    loadProjects();
  }, [user]);

  useEffect(() => {
    if (selectedBook) {
      loadElements(selectedBook.id);
    }
  }, [selectedBook]);

  useEffect(() => {
    if (bookId && books.length > 0) {
      const book = books.find(b => b.id === bookId);
      if (book) {
        setSelectedBook(book);
      }
    }
  }, [bookId, books]);

  useEffect(() => {
    if (elementId && elements.length > 0) {
      const element = elements.find(e => e.id === elementId);
      if (element) {
        setSelectedElement(element);
      }
    }
  }, [elementId, elements]);

  const loadProjects = async () => {
    if (!user) return;

    setLoadingBooks(true);
    try {
      const [seriesData, booksData] = await Promise.all([
        api.series.list(),
        api.books.list(),
      ]);

      setSeries(seriesData);
      setBooks(booksData);
      // Only auto-select first book if there's no bookId from URL and no book selected yet
      if (booksData && booksData.length > 0 && !selectedBook && !bookId) {
        setSelectedBook(booksData[0]);
      }
    } catch (error) {
      console.error('Error loading projects:', error);
    } finally {
      setLoadingBooks(false);
    }
  };

  const loadElements = async (bookId: string) => {
    setLoadingElements(true);
    try {
      const data = await api.elements.list(bookId);
      setElements(data);
    } catch (error) {
      console.error('Error loading elements:', error);
    } finally {
      setLoadingElements(false);
    }
  };

  const handleCreateBook = async () => {
    if (!user || !formData.title) return;

    try {
      await api.books.create({
        title: formData.title,
        description: formData.description,
      });
      setShowModal(null);
      setFormData({ title: '', description: '', elementType: 'character' });
      loadProjects();
      toast.success('Story created successfully!');
    } catch (error) {
      console.error('Error creating book:', error);
      toast.error('Failed to create story');
    }
  };

  const handleCreateElement = async () => {
    if (!user || !selectedBook || !formData.title) return;

    try {
      await api.elements.create({
        book_id: selectedBook.id,
        element_type: formData.elementType,
        name: formData.title,
        description: formData.description,
      });
      setShowModal(null);
      setFormData({ title: '', description: '', elementType: 'character' });
      loadElements(selectedBook.id);
      toast.success('Element created successfully!');
    } catch (error) {
      console.error('Error creating element:', error);
      toast.error('Failed to create element');
    }
  };

  const handleDeleteElement = async (elementId: string) => {
    if (!confirm('Are you sure you want to delete this element?')) return;

    try {
      await api.elements.delete(elementId);
      if (selectedBook) {
        loadElements(selectedBook.id);
      }
      toast.success('Element deleted successfully');
    } catch (error) {
      console.error('Error deleting element:', error);
      toast.error('Failed to delete element');
    }
  };

  const handleDeleteBook = async () => {
    if (!bookToDelete) return;

    try {
      await api.books.delete(bookToDelete.id);
      setBookToDelete(null);
      // If the deleted book was selected, clear selection
      if (selectedBook?.id === bookToDelete.id) {
        setSelectedBook(null);
        setSelectedElement(null);
      }
      loadProjects();
      toast.success('Story deleted successfully');
    } catch (error) {
      console.error('Error deleting book:', error);
      toast.error('Failed to delete story');
    }
  };

  const getElementIcon = (type: string) => {
    switch (type) {
      case 'character':
        return Users;
      case 'location':
        return MapPin;
      case 'plot_point':
        return Flag;
      case 'item':
        return Package;
      case 'theme':
        return Lightbulb;
      default:
        return Lightbulb;
    }
  };

  const getElementColor = (type: string) => {
    switch (type) {
      case 'character':
        return 'bg-blue-100 text-blue-700';
      case 'location':
        return 'bg-green-100 text-green-700';
      case 'plot_point':
        return 'bg-orange-100 text-orange-700';
      case 'item':
        return 'bg-purple-100 text-purple-700';
      case 'theme':
        return 'bg-pink-100 text-pink-700';
      default:
        return 'bg-slate-100 text-slate-700';
    }
  };

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
            <h1 className="text-2xl font-bold text-slate-900">Story Manager</h1>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-slate-900">Stories</h2>
                <button
                  onClick={() => setShowModal('book')}
                  className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  <Plus className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-2">
                {loadingBooks ? (
                  <>
                    <SkeletonBookCard />
                    <SkeletonBookCard />
                    <SkeletonBookCard />
                  </>
                ) : books.length > 0 ? (
                  books.map((book) => (
                    <div
                      key={book.id}
                      className={`relative group rounded-lg transition-colors ${
                        selectedBook?.id === book.id
                          ? 'bg-slate-900 text-white'
                          : 'bg-slate-50 hover:bg-slate-100 text-slate-900'
                      }`}
                    >
                      <button
                        onClick={() => {
                          setSelectedBook(book);
                          setSelectedElement(null); // Clear selected element when switching stories
                        }}
                        className="w-full text-left p-4"
                      >
                        <div className="flex items-center gap-3">
                          <BookOpen className="w-5 h-5 flex-shrink-0" />
                          <div className="flex-1 min-w-0">
                            <div className="font-semibold truncate">{book.title}</div>
                            {book.description && (
                              <div
                                className={`text-sm truncate ${
                                  selectedBook?.id === book.id ? 'text-slate-300' : 'text-slate-600'
                                }`}
                              >
                                {book.description}
                              </div>
                            )}
                          </div>
                        </div>
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setBookToDelete(book);
                        }}
                        className={`absolute top-2 right-2 p-1.5 hover:bg-red-50 text-red-600 rounded transition-colors opacity-0 group-hover:opacity-100 ${
                          selectedBook?.id === book.id ? 'hover:bg-red-900/20' : ''
                        }`}
                        title="Delete story"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-slate-500">
                    <BookOpen className="w-12 h-12 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No stories yet</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="lg:col-span-2">
            {selectedBook ? (
              <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h2 className="text-2xl font-bold text-slate-900">{selectedBook.title}</h2>
                    {selectedBook.description && (
                      <p className="text-slate-600 mt-1">{selectedBook.description}</p>
                    )}
                  </div>
                  <button
                    onClick={() => setShowModal('element')}
                    className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                    Add Element
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {loadingElements ? (
                    <>
                      <SkeletonElementCard />
                      <SkeletonElementCard />
                      <SkeletonElementCard />
                      <SkeletonElementCard />
                    </>
                  ) : elements.length > 0 ? (
                    elements.map((element) => {
                      const Icon = getElementIcon(element.element_type);
                      return (
                        <div
                          key={element.id}
                          className="border border-slate-200 rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer group"
                          onClick={() => setSelectedElement(element)}
                        >
                          <div className="flex items-start justify-between mb-3">
                            <div
                              className={`w-10 h-10 rounded-lg flex items-center justify-center ${getElementColor(
                                element.element_type
                              )}`}
                            >
                              <Icon className="w-5 h-5" />
                            </div>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteElement(element.id);
                              }}
                              className="p-1 hover:bg-red-50 text-red-600 rounded transition-colors opacity-0 group-hover:opacity-100"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                          <h3 className="font-semibold text-slate-900 mb-1">{element.name}</h3>
                          <p className="text-sm text-slate-600 capitalize mb-2">
                            {element.element_type.replace('_', ' ')}
                          </p>
                          {element.description && (
                            <p className="text-sm text-slate-700 line-clamp-2">{element.description}</p>
                          )}
                        </div>
                      );
                    })
                  ) : (
                    <div className="col-span-full text-center py-12">
                      <Lightbulb className="w-16 h-16 mx-auto mb-4 text-slate-300" />
                      <h3 className="text-lg font-semibold text-slate-900 mb-2">No story elements yet</h3>
                      <p className="text-slate-600 mb-4">
                        Add characters, locations, and other elements to your story
                      </p>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-12 text-center">
                <BookOpen className="w-16 h-16 mx-auto mb-4 text-slate-300" />
                <h3 className="text-xl font-bold text-slate-900 mb-2">Select a story</h3>
                <p className="text-slate-600">Choose a story to view and manage its elements</p>
              </div>
            )}
          </div>
        </div>
      </main>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-slate-900">
                {showModal === 'book' ? 'Create Story' : 'Add Story Element'}
              </h3>
              <button
                onClick={() => {
                  setShowModal(null);
                  setFormData({ title: '', description: '', elementType: 'character' });
                }}
                className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              {showModal === 'element' && (
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Type</label>
                  <select
                    value={formData.elementType}
                    onChange={(e) =>
                      setFormData({ ...formData, elementType: e.target.value as any })
                    }
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900 focus:border-transparent outline-none"
                  >
                    <option value="character">Character</option>
                    <option value="location">Location</option>
                    <option value="plot_point">Plot Point</option>
                    <option value="item">Item</option>
                    <option value="theme">Theme</option>
                  </select>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  {showModal === 'book' ? 'Title' : 'Name'}
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900 focus:border-transparent outline-none"
                  placeholder={showModal === 'book' ? 'My Story' : 'Element name'}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900 focus:border-transparent outline-none resize-none"
                  placeholder="Add a description..."
                />
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowModal(null);
                    setFormData({ title: '', description: '', elementType: 'character' });
                  }}
                  className="flex-1 px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={showModal === 'book' ? handleCreateBook : handleCreateElement}
                  disabled={!formData.title}
                  className="flex-1 px-4 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Create
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {bookToDelete && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-md w-full p-6">
            <div className="flex items-start gap-4 mb-4">
              <div className="p-3 bg-red-100 rounded-full">
                <Trash2 className="w-6 h-6 text-red-600" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-slate-900 mb-2">Delete Story?</h3>
                <p className="text-slate-600">
                  Are you sure you want to delete <span className="font-semibold">"{bookToDelete.title}"</span>? 
                  This will permanently delete the story and all of its elements. This action cannot be undone.
                </p>
              </div>
            </div>
            
            <div className="flex gap-3">
              <button
                onClick={() => setBookToDelete(null)}
                className="flex-1 px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteBook}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                Delete Story
              </button>
            </div>
          </div>
        </div>
      )}
      
      {selectedElement && (
        <StoryElementDetail
          element={selectedElement}
          onClose={() => setSelectedElement(null)}
          onUpdate={() => {
            loadElements(selectedBook!.id);
          }}
        />
      )}
    </div>
  );
}
