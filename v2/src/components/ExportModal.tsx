import { useState } from 'react';
import { X, FileText, FileJson, FileDown, Download } from 'lucide-react';
import { Database } from '../lib/database.types';
import { exportAsJSON, exportAsMarkdown, exportAsPDF } from '../lib/export';
import { api } from '../lib/api';
import toast from 'react-hot-toast';

type Book = Database['public']['Tables']['books']['Row'];

interface ExportModalProps {
  book: Book;
  onClose: () => void;
}

type ExportFormat = 'pdf' | 'markdown' | 'json';

export default function ExportModal({ book, onClose }: ExportModalProps) {
  const [selectedFormat, setSelectedFormat] = useState<ExportFormat>('pdf');
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = async () => {
    setIsExporting(true);
    const toastId = toast.loading('Preparing export...');

    try {
      // Fetch all data for the book
      const [elements, prompts] = await Promise.all([
        api.elements.list(book.id),
        api.prompts.list({ book_id: book.id })
      ]);

      // Fetch responses for all prompts
      const promptIds = prompts.map(p => p.id);
      const responsesArrays = await Promise.all(
        promptIds.map(id => api.responses.list(id))
      );
      const bookResponses = responsesArrays.flat();

      const exportData = {
        book,
        elements,
        prompts,
        responses: bookResponses
      };

      // Generate export based on format
      switch (selectedFormat) {
        case 'pdf':
          exportAsPDF(exportData);
          toast.success('PDF exported successfully!', { id: toastId });
          break;
        case 'markdown':
          exportAsMarkdown(exportData);
          toast.success('Markdown exported successfully!', { id: toastId });
          break;
        case 'json':
          exportAsJSON(exportData);
          toast.success('JSON exported successfully!', { id: toastId });
          break;
      }

      // Close modal after short delay
      setTimeout(() => {
        onClose();
      }, 500);
    } catch (error) {
      console.error('Export error:', error);
      toast.error('Failed to export. Please try again.', { id: toastId });
    } finally {
      setIsExporting(false);
    }
  };

  const formats = [
    {
      id: 'pdf' as ExportFormat,
      name: 'PDF',
      description: 'Professional formatted document',
      icon: FileText,
      recommended: true
    },
    {
      id: 'markdown' as ExportFormat,
      name: 'Markdown',
      description: 'Plain text format for other tools',
      icon: FileDown,
      recommended: false
    },
    {
      id: 'json' as ExportFormat,
      name: 'JSON',
      description: 'Full data export for backup',
      icon: FileJson,
      recommended: false
    }
  ];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 dark:bg-opacity-70 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-slate-200 dark:border-slate-700">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-slate-700">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Export Story</h2>
            <p className="text-sm text-gray-600 dark:text-slate-400 mt-1">{book.title}</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 dark:text-slate-500 hover:text-gray-600 dark:hover:text-slate-300 transition-colors"
            disabled={isExporting}
          >
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          <p className="text-gray-700 dark:text-slate-300 mb-6">
            Choose a format to export your story, including all elements, prompts, and responses.
          </p>

          {/* Format Selection */}
          <div className="space-y-3">
            {formats.map((format) => {
              const Icon = format.icon;
              return (
                <button
                  key={format.id}
                  onClick={() => setSelectedFormat(format.id)}
                  disabled={isExporting}
                  className={`w-full text-left p-4 rounded-lg border-2 transition-all ${
                    selectedFormat === format.id
                      ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950'
                      : 'border-gray-200 dark:border-slate-600 hover:border-gray-300 dark:hover:border-slate-500 bg-white dark:bg-slate-700/30'
                  } ${isExporting ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                >
                  <div className="flex items-start">
                    <div
                      className={`flex-shrink-0 p-2 rounded-lg ${
                        selectedFormat === format.id
                          ? 'bg-emerald-100 dark:bg-emerald-900 text-emerald-600 dark:text-emerald-400'
                          : 'bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-slate-400'
                      }`}
                    >
                      <Icon size={24} />
                    </div>
                    <div className="ml-4 flex-1">
                      <div className="flex items-center">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                          {format.name}
                        </h3>
                        {format.recommended && (
                          <span className="ml-2 px-2 py-1 text-xs font-medium bg-emerald-100 dark:bg-emerald-900 text-emerald-700 dark:text-emerald-400 rounded">
                            Recommended
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-600 dark:text-slate-400 mt-1">
                        {format.description}
                      </p>
                    </div>
                    <div
                      className={`flex-shrink-0 ml-4 w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                        selectedFormat === format.id
                          ? 'border-emerald-500 bg-emerald-500'
                          : 'border-gray-300 dark:border-slate-600'
                      }`}
                    >
                      {selectedFormat === format.id && (
                        <div className="w-2 h-2 bg-white rounded-full" />
                      )}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Export Info */}
          <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg">
            <p className="text-sm text-blue-800 dark:text-blue-300">
              <strong>What's included:</strong> Story overview, all story elements (characters, 
              locations, plot points, etc.), all prompts and responses, and writing statistics.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 px-6 py-4 border-t border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-800">
          <button
            onClick={onClose}
            disabled={isExporting}
            className="px-4 py-2 text-gray-700 dark:text-slate-300 hover:text-gray-900 dark:hover:text-white font-medium disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleExport}
            disabled={isExporting}
            className="px-6 py-2 bg-emerald-600 dark:bg-emerald-700 text-white rounded-lg hover:bg-emerald-700 dark:hover:bg-emerald-600 font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {isExporting ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Exporting...
              </>
            ) : (
              <>
                <Download size={18} />
                Export {formats.find(f => f.id === selectedFormat)?.name}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
