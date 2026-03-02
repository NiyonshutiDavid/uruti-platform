import jsPDF from 'jspdf';
import { toast } from 'sonner';

export interface Material {
  id?: number;
  name: string;
  type: string;
  url?: string;
  description?: string;
  content?: string;
  order_index?: number;
}

export const generatePDF = (material: Material, trackTitle: string) => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 20;
  const contentWidth = pageWidth - 2 * margin;
  
  // Colors
  const darkText = '#000000';
  const grayText = '#666666';
  const redFlagColor = '#DC2626'; // Red for warnings

  // Header with Uruti Branding
  doc.setFillColor(0, 0, 0);
  doc.rect(0, 0, pageWidth, 35, 'F');
  
  // Uruti Logo Text with styling
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(28);
  doc.setFont('helvetica', 'bold');
  doc.text('URUTI', margin, 22);
  
  // Green bar accent
  doc.setFillColor(118, 185, 71);
  doc.rect(margin, 25, 35, 3, 'F');
  
  // Subtitle
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text('DIGITAL ECOSYSTEM', margin + 45, 18);
  doc.text('Building Investment-Ready Startups', margin + 45, 24);
  
  // Green accent line
  doc.setDrawColor(118, 185, 71);
  doc.setLineWidth(2);
  doc.line(margin, 37, pageWidth - margin, 37);

  // Content Start Position
  let yPosition = 50;

  // Track Title
  doc.setTextColor(118, 185, 71);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text(trackTitle.toUpperCase(), margin, yPosition);
  yPosition += 10;

  // Material Title
  doc.setTextColor(darkText);
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  const splitTitle = doc.splitTextToSize(material.name, contentWidth);
  doc.text(splitTitle, margin, yPosition);
  yPosition += splitTitle.length * 9 + 8;

  // Description
  if (material.description) {
    doc.setTextColor(grayText);
    doc.setFontSize(11);
    doc.setFont('helvetica', 'italic');
    const splitDesc = doc.splitTextToSize(material.description, contentWidth);
    doc.text(splitDesc, margin, yPosition);
    yPosition += splitDesc.length * 6 + 10;
  }

  // Divider
  doc.setDrawColor(200, 200, 200);
  doc.setLineWidth(0.5);
  doc.line(margin, yPosition, pageWidth - margin, yPosition);
  yPosition += 10;

  // Content
  if (material.content) {
    doc.setTextColor(darkText);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    
    // Parse markdown-style content
    const lines = material.content.split('\n');
    let inRedFlagSection = false;
    
    for (const line of lines) {
      // Check if we need a new page
      if (yPosition > pageHeight - 45) {
        doc.addPage();
        yPosition = margin;
      }

      // Detect Red Flags section
      if (line.includes('Red Flags') || line.includes('Red Flag')) {
        inRedFlagSection = true;
      } else if (line.startsWith('## ') && !line.includes('Red Flag')) {
        inRedFlagSection = false;
      }

      if (line.startsWith('# ')) {
        // Main heading
        doc.setFontSize(18);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(darkText);
        const text = line.replace('# ', '');
        const splitText = doc.splitTextToSize(text, contentWidth);
        doc.text(splitText, margin, yPosition);
        yPosition += splitText.length * 9 + 6;
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
      } else if (line.startsWith('## ')) {
        // Sub heading
        const text = line.replace('## ', '');
        
        // Special styling for Red Flags
        if (text.includes('Red Flags') || text.includes('Red Flag')) {
          // Red background box for Red Flags heading
          doc.setFillColor(220, 38, 38, 0.1);
          doc.roundedRect(margin - 3, yPosition - 6, contentWidth + 6, 12, 2, 2, 'F');
          
          doc.setFontSize(14);
          doc.setFont('helvetica', 'bold');
          doc.setTextColor(220, 38, 38);
          doc.text('⚠️  ' + text.toUpperCase(), margin, yPosition);
          yPosition += 10;
        } else {
          doc.setFontSize(14);
          doc.setFont('helvetica', 'bold');
          doc.setTextColor(118, 185, 71);
          const splitText = doc.splitTextToSize(text, contentWidth);
          doc.text(splitText, margin, yPosition);
          yPosition += splitText.length * 7 + 5;
        }
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(darkText);
      } else if (line.startsWith('### ')) {
        // Tertiary heading
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(darkText);
        const text = line.replace('### ', '');
        const splitText = doc.splitTextToSize(text, contentWidth);
        doc.text(splitText, margin, yPosition);
        yPosition += splitText.length * 6 + 4;
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
      } else if (line.startsWith('⚠️ ') || (inRedFlagSection && (line.startsWith('- ') || line.startsWith('* ')))) {
        // Red flag warning item - special formatting
        const text = line.replace(/^[⚠️*-] /, '');
        const splitText = doc.splitTextToSize(text, contentWidth - 12);
        
        // Light red background
        doc.setFillColor(220, 38, 38, 0.05);
        const boxHeight = splitText.length * 5 + 4;
        doc.roundedRect(margin - 2, yPosition - 4, contentWidth + 4, boxHeight, 1, 1, 'F');
        
        // Warning triangle
        doc.setTextColor(220, 38, 38);
        doc.setFont('helvetica', 'bold');
        doc.text('⚠', margin + 1, yPosition);
        
        // Text
        doc.setTextColor(darkText);
        doc.setFont('helvetica', 'normal');
        doc.text(splitText, margin + 8, yPosition);
        yPosition += boxHeight + 1;
      } else if (line.startsWith('- ') || line.startsWith('* ')) {
        // Regular bullet point
        const text = line.replace(/^[*-] /, '');
        const splitText = doc.splitTextToSize(text, contentWidth - 10);
        doc.setFillColor(118, 185, 71);
        doc.circle(margin + 2, yPosition - 2, 1, 'F');
        doc.setTextColor(darkText);
        doc.text(splitText, margin + 7, yPosition);
        yPosition += splitText.length * 5 + 2;
      } else if (line.startsWith('✅ ')) {
        // Checkmark item - green highlight
        doc.setFillColor(118, 185, 71, 0.05);
        const text = line.replace('✅ ', '');
        const splitText = doc.splitTextToSize(text, contentWidth - 12);
        const boxHeight = splitText.length * 5 + 4;
        doc.roundedRect(margin - 2, yPosition - 4, contentWidth + 4, boxHeight, 1, 1, 'F');
        
        doc.setTextColor(118, 185, 71);
        doc.setFont('helvetica', 'bold');
        doc.text('✓', margin + 1, yPosition);
        doc.setTextColor(darkText);
        doc.setFont('helvetica', 'normal');
        doc.text(splitText, margin + 8, yPosition);
        yPosition += boxHeight + 1;
      } else if (line.startsWith('🚫 ')) {
        // Stop sign warning
        const text = line.replace('🚫 ', '');
        const splitText = doc.splitTextToSize(text, contentWidth - 12);
        doc.setFillColor(220, 38, 38, 0.05);
        const boxHeight = splitText.length * 5 + 4;
        doc.roundedRect(margin - 2, yPosition - 4, contentWidth + 4, boxHeight, 1, 1, 'F');
        
        doc.setTextColor(220, 38, 38);
        doc.setFont('helvetica', 'bold');
        doc.text('✖', margin + 1, yPosition);
        doc.setTextColor(darkText);
        doc.setFont('helvetica', 'normal');
        doc.text(splitText, margin + 8, yPosition);
        yPosition += boxHeight + 1;
      } else if (line.trim() === '') {
        // Empty line
        yPosition += 4;
      } else {
        // Regular text
        doc.setTextColor(darkText);
        const splitText = doc.splitTextToSize(line, contentWidth);
        doc.text(splitText, margin, yPosition);
        yPosition += splitText.length * 5 + 2;
      }
    }
  }

  // Footer on every page
  const addFooter = (pageNum: number, totalPages: number) => {
    doc.setFontSize(8);
    doc.setTextColor(grayText);
    doc.setFont('helvetica', 'normal');
    
    // Footer line with gradient effect (thick to thin)
    doc.setDrawColor(118, 185, 71);
    doc.setLineWidth(1.5);
    doc.line(margin, pageHeight - 22, pageWidth - margin, pageHeight - 22);
    
    // Uruti branding
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(0, 0, 0);
    doc.text('URUTI', margin, pageHeight - 14);
    
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(grayText);
    doc.text('Digital Ecosystem', margin + 18, pageHeight - 14);
    doc.text('Building Investment-Ready Startups in Rwanda', margin, pageHeight - 9);
    
    // Page number
    doc.setFont('helvetica', 'bold');
    doc.text(`Page ${pageNum} of ${totalPages}`, pageWidth - margin - 28, pageHeight - 14);
    
    // Website
    doc.setTextColor(118, 185, 71);
    doc.setFont('helvetica', 'bold');
    doc.text('www.uruti.rw', pageWidth - margin - 28, pageHeight - 9);
  };

  // Add footer to all pages
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    addFooter(i, totalPages);
  }

  // Download the PDF
  const fileName = `${material.name.replace(/[^a-z0-9]/gi, '_')}_Uruti.pdf`;
  doc.save(fileName);
  
  toast.success(`Downloaded: ${material.name}`);
};
