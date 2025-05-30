import React, { useState, useEffect, useRef } from 'react';
import { FunctionDeclaration, Type } from "@google/genai";
import jsPDF from 'jspdf';
import { useSoapNote } from '../../contexts/SoapNoteContext';
import './soap-notes.scss';
import { FaFilePdf, FaFileAlt, FaDownload } from 'react-icons/fa';

// SOAP Note function declaration for the AI assistant
export const soapNoteDeclaration: FunctionDeclaration = {
  name: "update_soap_note",
  description: "Updates the Medical Note documentation continuously in real-time as the patient consultation progresses. Following NEJM documentation standards with a comprehensive format. Use this tool frequently after every significant piece of information is shared. Update the note immediately as you learn new information about the patient's condition.",
  parameters: {
    type: Type.OBJECT,
    properties: {
      patientName: {
        type: Type.STRING,
        description: "Patient's full name (can be anonymized if privacy is a concern)"
      },
      dateOfBirth: {
        type: Type.STRING,
        description: "Patient's date of birth (can be anonymized)"
      },
      visitDate: {
        type: Type.STRING,
        description: "Date of the consultation (defaults to current date if not provided)"
      },
      chiefComplaint: {
        type: Type.STRING,
        description: "The main reason for the patient's visit. Be concise but specific about what brought them in today."
      },
      historyOfPresentIllness: {
        type: Type.STRING,
        description: "Detailed chronological description of the development of the patient's illness. Include onset, duration, character, aggravating/relieving factors, timing, severity, and context."
      },
      pastMedicalHistory: {
        type: Type.STRING,
        description: "Previous illnesses, surgeries, hospitalizations, and current health conditions."
      },
      medications: {
        type: Type.STRING,
        description: "Current medications, dosages, frequencies, and compliance. Include over-the-counter drugs and supplements."
      },
      allergies: {
        type: Type.STRING,
        description: "Medication allergies, environmental allergies, and reactions."
      },
      reviewOfSystems: {
        type: Type.STRING,
        description: "Systematic review of each body system, focusing on relevant positive and negative findings."
      },
      physicalExam: {
        type: Type.STRING,
        description: "Objective findings from physical examination. For virtual visits, include patient-reported observations or suggested examinations that would be performed in person."
      },
      assessment: {
        type: Type.STRING,
        description: "Your diagnostic impressions or potential diagnoses being considered. Include differential diagnoses in order of likelihood."
      },
      plan: {
        type: Type.STRING,
        description: "Recommended treatments, medications (with dosage details), follow-ups, referrals, or lifestyle changes. Be specific and comprehensive."
      },
      icdCodes: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            code: {
              type: Type.STRING,
              description: "ICD-10-CM code for the condition"
            },
            description: {
              type: Type.STRING,
              description: "Description of the diagnosis"
            }
          }
        },
        description: "Relevant ICD-10-CM codes for the conditions discussed. Add these when diagnoses become clear."
      }
    }
  }
};

// Types for SOAP note data
export interface SoapNoteData {
  patientName?: string;
  dateOfBirth?: string;
  visitDate?: string;
  chiefComplaint: string;
  historyOfPresentIllness: string;
  pastMedicalHistory: string;
  medications: string;
  allergies: string;
  reviewOfSystems: string;
  physicalExam: string;
  assessment: string;
  plan: string;
  icdCodes?: Array<{code: string, description: string}>;
  version?: number;
  timestamp?: string;
  
  // For backward compatibility
  subjective?: string;
  objective?: string;
}

// Generate a SOAP note in Markdown format
export function generateSoapNoteMarkdown(data: SoapNoteData): string {
  const {
    patientName = "Anonymous Patient",
    dateOfBirth = "Not provided",
    visitDate = new Date().toISOString().split('T')[0],
    chiefComplaint = "",
    historyOfPresentIllness = "",
    pastMedicalHistory = "",
    medications = "",
    allergies = "",
    reviewOfSystems = "",
    physicalExam = data.objective || "Virtual consultation - no physical examination performed",
    assessment = "",
    plan = "",
    icdCodes = []
  } = data;
  
  // Handle backward compatibility with old format
  const hpi = historyOfPresentIllness || (data.subjective || "");
  
  // Format ICD codes if present
  const formattedICDCodes = icdCodes && icdCodes.length > 0 
    ? icdCodes.map(code => `- ${code.code}: ${code.description}`).join('\n')
    : 'None provided';
  
  return `# MEDICAL CONSULTATION NOTE
**DISCLAIMER: This note was generated by an AI assistant and is NOT an official medical record. It has not been reviewed by a licensed healthcare professional.**

## Patient Information
- **Name:** ${patientName}
- **Date of Birth:** ${dateOfBirth}
- **Visit Date:** ${visitDate}

## Chief Complaint (CC)
${chiefComplaint || "Not yet documented"}

## History of Present Illness (HPI)
${hpi || "Not yet documented"}

## Past Medical History (PMH)
${pastMedicalHistory || "Not yet documented"}

## Medications & Allergies
### Current Medications
${medications || "Not yet documented"}

### Allergies
${allergies || "Not yet documented"}

## Review of Systems (ROS)
${reviewOfSystems || "Not yet documented"}

## Physical Exam (PE)
${physicalExam}

## Assessment
${assessment || "Assessment pending..."}

## Plan
${plan || "Plan pending..."}

## ICD-10-CM Codes
${formattedICDCodes}

---

*This document was generated by an AI medical assistant following NEJM documentation standards for informational purposes only. It does not constitute medical advice, diagnosis, or treatment. Please consult with a licensed healthcare professional for proper medical care.*

*Last updated: ${new Date().toLocaleString()}*`;
}

// Function to handle the SOAP note generation call
export function handleSoapNoteGeneration(args: any) {
  return generateSoapNoteMarkdown(args as SoapNoteData);
}

// Helper function to convert markdown to HTML for preview
function markdownToHtml(markdown: string): string {
  let html = markdown
    .replace(/^# (.*$)/gim, '<h1>$1</h1>')
    .replace(/^## (.*$)/gim, '<h2>$1</h2>')
    .replace(/^### (.*$)/gim, '<h3>$1</h3>')
    .replace(/^#### (.*$)/gim, '<h4>$1</h4>')
    .replace(/^\> (.*$)/gim, '<blockquote>$1</blockquote>')
    .replace(/\*\*(.*)\*\*/gim, '<strong>$1</strong>')
    .replace(/\*(.*)\*/gim, '<em>$1</em>')
    .replace(/!\[(.*?)\]\((.*?)\)/gim, '<img alt="$1" src="$2" />')
    .replace(/\[(.*?)\]\((.*?)\)/gim, '<a href="$2">$1</a>')
    .replace(/\n/gim, '<br />')
    .replace(/^- (.*$)/gim, '<li>$1</li>')
    .replace(/<\/li><br \/><li>/g, '</li><li>');
  
  // Wrap list items in ul
  if (html.includes('<li>')) {
    html = html.replace(/(<li>.*<\/li>)/g, '<ul>$1</ul>');
    // Fix nested lists that might have been created
    html = html.replace(/<\/ul><br \/><ul>/g, '');
  }
  
  return html;
}

interface SoapNoteProps {
  isVisible: boolean;
}

const SoapNote: React.FC<SoapNoteProps> = ({ isVisible }) => {
  const { soapNoteData, hasChanges } = useSoapNote();
  const [markdown, setMarkdown] = useState<string>('');
  const contentRef = useRef<HTMLDivElement>(null);
  const [lastUpdateTime, setLastUpdateTime] = useState<Date>(new Date());
  const [isAnimating, setIsAnimating] = useState(false);
  
  // Generate markdown when SOAP note data changes
  useEffect(() => {
    if (hasChanges) {
      const generatedMarkdown = generateSoapNoteMarkdown(soapNoteData);
      setMarkdown(generatedMarkdown);
      setLastUpdateTime(new Date());
      
      // Animate the update indicator
      setIsAnimating(true);
      const timer = setTimeout(() => setIsAnimating(false), 1500);
      return () => clearTimeout(timer);
    }
  }, [soapNoteData, hasChanges]);
  
  // Function to handle downloading as PDF
  const handlePdfDownload = async () => {
    try {
      if (!contentRef.current) return;
      
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });
      
      // Title
      pdf.setFontSize(16);
      pdf.text('MEDICAL CONSULTATION NOTE', 105, 20, { align: 'center' });
      
      // Disclaimer
      pdf.setFontSize(10);
      pdf.setTextColor(255, 0, 0);
      pdf.text('DISCLAIMER: This note was generated by an AI assistant and is NOT an official medical record.', 105, 30, { align: 'center' });
      pdf.text('It has not been reviewed by a licensed healthcare professional.', 105, 35, { align: 'center' });
      
      pdf.setTextColor(0, 0, 0);
      
      // Parse markdown content
      const contentLines = markdown.split('\n');
      let y = 45;
      let section = '';
      
      contentLines.forEach(line => {
        // Skip the title and disclaimer which we've already added
        if (line.startsWith('# MEDICAL CONSULTATION') || 
            line.includes('DISCLAIMER') || 
            line.trim() === '') {
          return;
        }
        
        // Handle headers
        if (line.startsWith('## ')) {
          pdf.setFontSize(14);
          pdf.setFont('helvetica', 'bold');
          section = line.substring(3).trim();
          pdf.text(section, 20, y);
          y += 8;
          return;
        }
        
        if (line.startsWith('### ')) {
          pdf.setFontSize(12);
          pdf.setFont('helvetica', 'bold');
          section = line.substring(4).trim();
          pdf.text(section + ':', 20, y);
          y += 7;
          return;
        }
        
        // Handle bullet points
        if (line.startsWith('- ')) {
          pdf.setFontSize(10);
          pdf.setFont('helvetica', 'normal');
          const bulletText = line.substring(2).trim();
          pdf.text('• ' + bulletText, 25, y);
          y += 6;
          return;
        }
        
        // Handle bold text
        if (line.includes('**')) {
          pdf.setFontSize(10);
          const parts = line.split('**');
          let x = 20;
          
          for (let i = 0; i < parts.length; i++) {
            if (i % 2 === 0) {
              pdf.setFont('helvetica', 'normal');
            } else {
              pdf.setFont('helvetica', 'bold');
            }
            
            if (parts[i].trim() !== '') {
              pdf.text(parts[i], x, y);
              x += pdf.getTextWidth(parts[i]);
            }
          }
          
          y += 6;
          return;
        }
        
        // Handle regular text
        if (line.trim() !== '') {
          pdf.setFontSize(10);
          pdf.setFont('helvetica', 'normal');
          
          // Check if we need to wrap text
          const textWidth = pdf.getTextWidth(line);
          const maxWidth = 170; // mm, a4 width minus margins
          
          if (textWidth > maxWidth) {
            const words = line.split(' ');
            let currentLine = '';
            
            words.forEach(word => {
              const testLine = currentLine + (currentLine ? ' ' : '') + word;
              const testWidth = pdf.getTextWidth(testLine);
              
              if (testWidth > maxWidth) {
                pdf.text(currentLine, 20, y);
                y += 6;
                currentLine = word;
              } else {
                currentLine = testLine;
              }
            });
            
            if (currentLine) {
              pdf.text(currentLine, 20, y);
              y += 6;
            }
          } else {
            pdf.text(line, 20, y);
            y += 6;
          }
          
          return;
        }
        
        // Add some space after empty lines
        if (line.trim() === '') {
          y += 3;
        }
      });
      
      // Add footer
      pdf.setFontSize(8);
      pdf.setTextColor(100, 100, 100);
      const footerText = 'This document was generated by an AI medical assistant for informational purposes only. It does not constitute medical advice, diagnosis, or treatment.';
      pdf.text(footerText, 105, 280, { align: 'center' });
      pdf.text(`Generated on: ${new Date().toLocaleString()}`, 105, 285, { align: 'center' });
      
      // Save the PDF
      pdf.save('medical_note.pdf');
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Failed to generate PDF. Please try downloading as Markdown instead.');
    }
  };
  
  // Function to handle downloading as Markdown
  const handleMarkdownDownload = () => {
    const blob = new Blob([markdown], { type: 'text/markdown' });
    const href = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = href;
    link.download = 'medical_note.md';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(href);
  };
  
  if (!isVisible || !hasChanges) {
    return null;
  }
  
  return (
    <div className="soap-note-container">
      <div className="soap-note-header">
        <div className="soap-note-title">
          <h2>Medical Documentation</h2>
          <div className={`update-indicator ${isAnimating ? 'pulse' : ''}`} title={`Last updated: ${lastUpdateTime.toLocaleString()}`}>
            <span className="dot"></span>
            <span className="update-text">Live</span>
          </div>
        </div>
        <div className="soap-note-actions">
          <button 
            onClick={handlePdfDownload}
            className="soap-note-button download-button"
            title="Download as PDF"
          >
            <FaFilePdf className="button-icon" />
            <span className="button-text">PDF</span>
          </button>
          <button 
            onClick={handleMarkdownDownload}
            className="soap-note-button download-button"
            title="Download as Markdown"
          >
            <FaFileAlt className="button-icon" />
            <span className="button-text">Text</span>
          </button>
        </div>
      </div>
      
      <div className="soap-note-preview">
        <div 
          ref={contentRef}
          className="soap-note-content"
          dangerouslySetInnerHTML={{ __html: markdownToHtml(markdown) }}
        />
      </div>
      
      <div className="soap-note-disclaimer">
        <p>This document is being updated in real-time as your consultation progresses. It is not a substitute for professional medical documentation.</p>
        <button 
          onClick={handlePdfDownload}
          className="soap-note-button download-full-button"
          title="Download Complete Medical Note"
        >
          <FaDownload className="button-icon" />
          <span className="button-text">Download Medical Note</span>
        </button>
      </div>
    </div>
  );
};

export default SoapNote;