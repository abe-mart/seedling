import jsPDF from 'jspdf';
import { Database } from './database.types';

type Book = Database['public']['Tables']['books']['Row'];
type StoryElement = Database['public']['Tables']['story_elements']['Row'];
type Prompt = Database['public']['Tables']['prompts']['Row'];
type Response = Database['public']['Tables']['responses']['Row'];

interface ExportData {
  book: Book;
  elements: StoryElement[];
  prompts: Prompt[];
  responses: Response[];
}

// Group elements by type
const groupElementsByType = (elements: StoryElement[]) => {
  const grouped: Record<string, StoryElement[]> = {
    character: [],
    location: [],
    plot_point: [],
    item: [],
    theme: [],
    other: []
  };

  elements.forEach(element => {
    const type = element.element_type || 'other';
    if (grouped[type]) {
      grouped[type].push(element);
    } else {
      grouped['other'].push(element);
    }
  });

  return grouped;
};

// Get type label
const getTypeLabel = (type: string): string => {
  const labels: Record<string, string> = {
    character: 'Characters',
    location: 'Locations',
    plot_point: 'Plot Points',
    item: 'Items',
    theme: 'Themes',
    other: 'Other'
  };
  return labels[type] || 'Other';
};

// Export as JSON
export const exportAsJSON = (data: ExportData) => {
  const jsonString = JSON.stringify(data, null, 2);
  const blob = new Blob([jsonString], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${sanitizeFilename(data.book.title)}_export.json`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

// Export as Markdown
export const exportAsMarkdown = (data: ExportData) => {
  let markdown = `# ${data.book.title}\n\n`;
  
  if (data.book.description) {
    markdown += `${data.book.description}\n\n`;
  }

  markdown += `---\n\n`;

  // Statistics
  markdown += `## Statistics\n\n`;
  markdown += `- **Total Elements**: ${data.elements.length}\n`;
  markdown += `- **Total Prompts**: ${data.prompts.length}\n`;
  markdown += `- **Total Responses**: ${data.responses.length}\n`;
  
  const totalWords = data.responses.reduce((sum, r) => sum + (r.word_count || 0), 0);
  markdown += `- **Total Words Written**: ${totalWords.toLocaleString()}\n\n`;

  markdown += `---\n\n`;

  // Story Elements
  markdown += `## Story Elements\n\n`;
  const groupedElements = groupElementsByType(data.elements);

  Object.entries(groupedElements).forEach(([type, elements]) => {
    if (elements.length === 0) return;

    markdown += `### ${getTypeLabel(type)}\n\n`;
    
    elements.forEach(element => {
      markdown += `#### ${element.name}\n\n`;
      
      if (element.description) {
        markdown += `**Description**: ${element.description}\n\n`;
      }
      
      if (element.notes) {
        markdown += `**Notes**: ${element.notes}\n\n`;
      }

      // Find prompts and responses for this element
      const elementPrompts = data.prompts.filter(p => 
        p.element_references && p.element_references.includes(element.id)
      );
      if (elementPrompts.length > 0) {
        markdown += `**Prompts & Responses** (${elementPrompts.length}):\n\n`;
        
        elementPrompts.forEach((prompt, idx) => {
          const response = data.responses.find(r => r.prompt_id === prompt.id);
          markdown += `${idx + 1}. **${prompt.prompt_type || 'General'}**\n`;
          markdown += `   - *Prompt*: ${prompt.prompt_text}\n`;
          if (response) {
            markdown += `   - *Response* (${response.word_count || 0} words): ${response.response_text}\n`;
          } else {
            markdown += `   - *Response*: Not yet answered\n`;
          }
          markdown += `\n`;
        });
      }

      markdown += `---\n\n`;
    });
  });

  // All Prompts section
  markdown += `## All Prompts & Responses\n\n`;
  markdown += `Total: ${data.prompts.length} prompts\n\n`;

  data.prompts.forEach((prompt, idx) => {
    const element = data.elements.find(e => 
      prompt.element_references && prompt.element_references.includes(e.id)
    );
    const response = data.responses.find(r => r.prompt_id === prompt.id);
    
    markdown += `### ${idx + 1}. ${prompt.prompt_type || 'General'} - ${element?.name || 'Unknown'}\n\n`;
    markdown += `**Prompt**: ${prompt.prompt_text}\n\n`;
    
    if (response) {
      markdown += `**Response** (${response.word_count || 0} words):\n\n`;
      markdown += `${response.response_text}\n\n`;
      markdown += `*Written on ${new Date(response.created_at).toLocaleDateString()}*\n\n`;
    } else {
      markdown += `*No response yet*\n\n`;
    }
    
    markdown += `---\n\n`;
  });

  // Create and download file
  const blob = new Blob([markdown], { type: 'text/markdown' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${sanitizeFilename(data.book.title)}_export.md`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

// Export as PDF
export const exportAsPDF = (data: ExportData) => {
  const doc = new jsPDF();
  let yPosition = 20;
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 20;
  const maxWidth = pageWidth - (margin * 2);

  // Helper to add new page if needed
  const checkPageBreak = (requiredSpace: number) => {
    if (yPosition + requiredSpace > doc.internal.pageSize.getHeight() - 20) {
      doc.addPage();
      yPosition = 20;
      return true;
    }
    return false;
  };

  // Title
  doc.setFontSize(24);
  doc.setFont('helvetica', 'bold');
  doc.text(data.book.title, margin, yPosition);
  yPosition += 15;

  // Description
  if (data.book.description) {
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    const descLines = doc.splitTextToSize(data.book.description, maxWidth);
    doc.text(descLines, margin, yPosition);
    yPosition += (descLines.length * 7) + 10;
  }

  // Divider line
  doc.setDrawColor(200, 200, 200);
  doc.line(margin, yPosition, pageWidth - margin, yPosition);
  yPosition += 15;

  // Statistics
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text('Statistics', margin, yPosition);
  yPosition += 10;

  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');
  
  const totalWords = data.responses.reduce((sum, r) => sum + (r.word_count || 0), 0);
  const stats = [
    `Total Elements: ${data.elements.length}`,
    `Total Prompts: ${data.prompts.length}`,
    `Total Responses: ${data.responses.length}`,
    `Total Words Written: ${totalWords.toLocaleString()}`
  ];

  stats.forEach(stat => {
    doc.text(`• ${stat}`, margin + 5, yPosition);
    yPosition += 7;
  });
  yPosition += 10;

  checkPageBreak(20);

  // Story Elements
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text('Story Elements', margin, yPosition);
  yPosition += 10;

  const groupedElements = groupElementsByType(data.elements);

  Object.entries(groupedElements).forEach(([type, elements]) => {
    if (elements.length === 0) return;

    checkPageBreak(30);

    // Type heading
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text(getTypeLabel(type), margin, yPosition);
    yPosition += 8;

    elements.forEach(element => {
      checkPageBreak(40);

      // Element name
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text(element.name, margin + 5, yPosition);
      yPosition += 7;

      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');

      // Description
      if (element.description) {
        const descLines = doc.splitTextToSize(`Description: ${element.description}`, maxWidth - 5);
        descLines.forEach((line: string) => {
          checkPageBreak(7);
          doc.text(line, margin + 5, yPosition);
          yPosition += 6;
        });
        yPosition += 3;
      }

      // Notes
      if (element.notes) {
        const noteLines = doc.splitTextToSize(`Notes: ${element.notes}`, maxWidth - 5);
        noteLines.forEach((line: string) => {
          checkPageBreak(7);
          doc.text(line, margin + 5, yPosition);
          yPosition += 6;
        });
        yPosition += 3;
      }

      // Prompts count
      const elementPrompts = data.prompts.filter(p => 
        p.element_references && p.element_references.includes(element.id)
      );
      if (elementPrompts.length > 0) {
        doc.setFont('helvetica', 'italic');
        doc.text(`${elementPrompts.length} prompt(s) created`, margin + 5, yPosition);
        yPosition += 7;
      }

      yPosition += 5;
    });

    yPosition += 5;
  });

  // Prompts & Responses section
  if (data.prompts.length > 0) {
    checkPageBreak(30);
    doc.addPage();
    yPosition = 20;

    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text('Prompts & Responses', margin, yPosition);
    yPosition += 10;

    data.prompts.forEach((prompt, idx) => {
      const element = data.elements.find(e => 
        prompt.element_references && prompt.element_references.includes(e.id)
      );
      const response = data.responses.find(r => r.prompt_id === prompt.id);

      checkPageBreak(50);

      // Prompt header
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text(`${idx + 1}. ${prompt.prompt_type || 'General'} - ${element?.name || 'Unknown'}`, margin, yPosition);
      yPosition += 8;

      // Prompt text
      doc.setFontSize(10);
      doc.setFont('helvetica', 'italic');
      const promptLines = doc.splitTextToSize(`Prompt: ${prompt.prompt_text}`, maxWidth);
      promptLines.forEach((line: string) => {
        checkPageBreak(7);
        doc.text(line, margin + 5, yPosition);
        yPosition += 6;
      });
      yPosition += 3;

      // Response
      if (response) {
        doc.setFont('helvetica', 'normal');
        doc.text(`Response (${response.word_count || 0} words):`, margin + 5, yPosition);
        yPosition += 6;

        const responseLines = doc.splitTextToSize(response.response_text, maxWidth - 5);
        responseLines.forEach((line: string) => {
          checkPageBreak(7);
          doc.text(line, margin + 10, yPosition);
          yPosition += 6;
        });
        yPosition += 3;

        doc.setFontSize(9);
        doc.setFont('helvetica', 'italic');
        doc.text(`Written on ${new Date(response.created_at).toLocaleDateString()}`, margin + 5, yPosition);
        yPosition += 7;
      } else {
        doc.setFont('helvetica', 'italic');
        doc.text('No response yet', margin + 5, yPosition);
        yPosition += 7;
      }

      yPosition += 8;
    });
  }

  // Save the PDF
  doc.save(`${sanitizeFilename(data.book.title)}_export.pdf`);
};

// Helper to sanitize filename
const sanitizeFilename = (filename: string): string => {
  return filename
    .replace(/[^a-z0-9]/gi, '_')
    .replace(/_+/g, '_')
    .toLowerCase();
};
