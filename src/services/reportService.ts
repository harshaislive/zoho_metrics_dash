import axios from 'axios';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
// @ts-expect-error html2pdf.js missing type definitions
import html2pdf from 'html2pdf.js';
import { ProjectMetrics } from '../context/ProjectContext';
import { colors, fontStyles } from './reportStyles';

interface ProjectReportData {
  name: string;
  id: string;
  status?: string;
  metrics?: ProjectMetrics;
}

// Function to generate AI report using OpenRouter API
export const generateAIReport = async (projectData: ProjectReportData) => {
  try {
    // Replace with your actual OpenRouter API key
    const apiKey = import.meta.env.VITE_OPENROUTER_API_KEY || '';
    
    // Format the project data for the AI prompt
    const prompt = `As an expert data analyst, generate a concise, insightful project status report for "${projectData.name}" analyzing these metrics:
      - Unplanned Work Percentage: ${projectData.metrics?.unplanned?.unplanned_percentage || 0}%
      - Task Timeliness: ${projectData.metrics?.timeliness?.timeliness_rate || 0}%
      - Open Tasks Aging: ${projectData.metrics?.aging?.average_aging || 0} days
      - Backlog Rate: ${projectData.metrics?.backlog?.rotten_percentage || 0}%

      Format your analysis as a professional report with exactly these numbered sections:
      1. Project Overview (brief summary of project status)
      2. Key Performance Metrics (concise analysis of each metric)
      3. Key Takeaways & Insights (data-driven insights)
      4. Action Plan for Growth (3-5 specific recommendations)

      Please follow these formatting guidelines strictly:
      - Each numbered section header (like "1. Project Overview") MUST be on its own line
      - Start the content of each section on a new line after the section title
      - Use numbered subsections (2.1, 2.2, etc.) for subsections, each on their own line
      - Content of subsections must start on a new line after the subsection title
      - Use "- " at the beginning of lines for bullet points (no other bullet style)
      - For emphasis, use ALL CAPS instead of any special characters
      - Be concise, direct, and focused on actionable insights
      - Prioritize insights over lengthy descriptions
      - Use precise, analytical language
      - DO NOT use any emojis or special characters in the report
      - DO NOT include any special formatting characters at all (no **, no #, etc.)
      - DO NOT include any code blocks, markdown formatting, or HTML tags
      - DO NOT include any CSS styling or HTML-like formatting
      - DO NOT use words like "margin", "padding", "font", or any styling terminology in your text`;

    const response = await axios.post(
      'https://openrouter.ai/api/v1/chat/completions',
      {
        model: 'deepseek/deepseek-r1-zero:free',
        messages: [
          { role: 'system', content: 'You are an expert project management data analyst who provides concise, data-driven insights and recommendations.' },
          { role: 'user', content: prompt }
        ]
      },
      {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        }
      }
    );

    return response.data.choices[0].message.content;
  } catch (error) {
    console.error('Error generating AI report:', error);
    return null;
  }
};

// Function to convert HTML to PDF and download
export const generatePDF = async (elementId: string, filename: string) => {
  // For iframe content, we need to target the iframe document
  const iframe = document.querySelector('iframe');
  const doc = iframe?.contentDocument;
  const element = doc?.getElementById(elementId);
  
  if (!doc || !element) {
    console.error(`Element with ID ${elementId} not found or iframe content is inaccessible.`);
    return;
  }

  try {
    // First, fix any duplicate text that might be in the content
    const duplicateTextElements = doc?.querySelectorAll('*:not(script):not(style)');
    duplicateTextElements?.forEach(el => {
      const text = el.textContent?.trim();
      if (text && text.startsWith('*') && text.includes('Utilization Rate')) {
        // Remove duplicate metadata text
        el.remove();
      }
    });
    
    // Fix spacing issues in section headers
    const headers = doc?.querySelectorAll('h2, h3');
    headers?.forEach(header => {
      // Remove double spaces in headers
      if (header.textContent) {
        header.textContent = header.textContent.replace(/\s{2,}/g, ' ');
      }
      
      // Add page-break controls for better PDF generation
      (header as HTMLElement).style.pageBreakBefore = 'auto';
      (header as HTMLElement).style.pageBreakAfter = 'avoid';
      (header as HTMLElement).style.pageBreakInside = 'avoid';
    });
    
    // Apply proper table formatting for better PDF rendering
    const tables = doc?.querySelectorAll('table');
    tables?.forEach(table => {
      (table as HTMLTableElement).style.width = '100%';
      (table as HTMLTableElement).style.borderCollapse = 'collapse';
      (table as HTMLTableElement).style.marginBottom = '20px';
      
      // Add table properties that help with page breaks
      (table as HTMLTableElement).style.pageBreakInside = 'avoid';
      
      // Ensure all cells have proper borders and padding
      const cells = table.querySelectorAll('th, td');
      cells.forEach(cell => {
        (cell as HTMLTableCellElement).style.padding = '12px';
        (cell as HTMLTableCellElement).style.border = '1px solid #e7e4df';
        (cell as HTMLTableCellElement).style.textAlign = 'left';
        (cell as HTMLTableCellElement).style.verticalAlign = 'top';
      });
    });
    
    // Add page-break controls to paragraphs
    const paragraphs = doc?.querySelectorAll('p');
    paragraphs?.forEach(p => {
      (p as HTMLElement).style.pageBreakInside = 'avoid';
    });
    
    // Add page-break controls to lists
    const lists = doc?.querySelectorAll('ul, ol');
    lists?.forEach(list => {
      (list as HTMLElement).style.pageBreakInside = 'avoid';
    });
    
    // Add a hidden page-break element after each major section
    const sections = doc?.querySelectorAll('h2');
    sections?.forEach(section => {
      // Find the next h2 element
      let nextSection = section.nextElementSibling;
      while (nextSection && nextSection.tagName !== 'H2') {
        nextSection = nextSection.nextElementSibling;
      }
      
      // If we're not at the last h2, add a page break element before the next h2
      if (nextSection) {
        const pageBreak = doc.createElement('div');
        pageBreak.style.pageBreakAfter = 'always';
        pageBreak.style.height = '0';
        pageBreak.style.overflow = 'hidden';
        nextSection.parentNode?.insertBefore(pageBreak, nextSection);
      }
    });
    
    // Create a container to hold the element clone
    const container = document.createElement('div');
    container.style.width = '793px'; // A4 width in pixels at 96 DPI
    container.appendChild(element.cloneNode(true));
    
    // Configure html2pdf options
    const opt = {
      margin: [10, 10, 10, 10], // top, right, bottom, left margins in mm
      filename: `${filename}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { 
        scale: 2, 
        useCORS: true,
        letterRendering: true,
        logging: false,
        allowTaint: false,
        scrollX: 0,
        scrollY: 0
      },
      jsPDF: { 
        unit: 'mm', 
        format: 'a4', 
        orientation: 'portrait',
        compress: true
      },
      pagebreak: { 
        mode: ['avoid-all', 'css', 'legacy'],
        before: '.page-break-before',
        after: ['.page-break-after', 'section'],
      }
    };
    
    // Generate PDF with html2pdf.js
    html2pdf().set(opt).from(element).save();
    
  } catch (error) {
    console.error('Error generating PDF with html2pdf, falling back to canvas method:', error);
    
    try {
      // Fallback to canvas method
      const canvas = await html2canvas(element);
      const imgProps = canvas.toDataURL('image/jpeg', 1.0);
      
      // Initialize doc variable with proper type assertion
      const doc = new jsPDF('p', 'mm', 'a4') as jsPDF;
      
      const imgWidth = 210; // A4 width in mm
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      
      // Since we're using the type assertion above, we know doc is defined
      doc.addImage(imgProps, 'JPEG', 0, 0, imgWidth, imgHeight);
      doc.save(`${filename}.pdf`);
    } catch (fallbackError) {
      console.error('Fallback PDF generation failed:', fallbackError);
    }
  }
};

// Function to format report data as HTML
export const formatReportAsHTML = (reportText: string, projectData: ProjectReportData) => {
  // Format the current date according to the requirements
  const formattedDate = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  // Clean the report text from any HTML tags the AI might have generated
  // We'll take the plain text and format it ourselves
  const cleanText = reportText
    .replace(/<\/?[^>]+(>|$)/g, "") // Remove any HTML tags
    .replace(/&lt;/g, "<") // Fix any escaped HTML
    .replace(/&gt;/g, ">")
    .replace(/```(\w*)?/g, "") // Remove code block markers
    .replace(/\\boxed{/g, "") // Remove LaTeX-style boxes
    .replace(/}/g, "") // Remove closing braces from LaTeX
    .replace(/:{1,3}/g, "") // Remove colons used for formatting
    .replace(/####/g, "") // Remove markdown header markers
    .replace(/\*\*/g, "") // Remove stray asterisks for bold
    .replace(/\*/g, "") // Remove single asterisks
    .replace(/#/g, "") // Remove hash symbols
    .replace(/\n\s*[[\]{}]\s*\n/g, "\n\n") // Remove single brackets on their own lines
    .replace(/\n\s*---+\s*\n/g, "\n\n") // Remove horizontal rules
    .replace(/\n[ \t]*```[ \t]*\n/g, "\n\n") // Remove code block markers on their own lines
    .replace(/\n+(\d+)\./g, "\n$1.") // Fix numbered lists that have extra newlines
    .replace(/\n{3,}/g, "\n\n") // Normalize excessive newlines
    // Additional aggressive cleaning for CSS-like content
    .replace(/[^"']*font-[^"']*/g, "") // Remove any font-related CSS
    .replace(/[^"']*margin-[^"']*/g, "") // Remove margin CSS
    .replace(/[^"']*padding-[^"']*/g, "") // Remove padding CSS
    .replace(/color:[^;]*(;|$)/g, "") // Remove color settings
    .replace(/style="[^"]*"/g, "") // Remove any inline style attributes
    .replace(/font-family:[^;]*(;|$)/g, "") // Remove font-family declarations
    .replace(/;/g, "") // Remove semicolons that might be from CSS
    // Remove any words like margin, padding, etc. that might trigger a browser to interpret as CSS
    .replace(/\b(margin|padding|font|color|style|width|height|border|background)\b/gi, "spacing")
    // Remove emojis - simpler pattern for compatibility
    .replace(/[\u2700-\u27BF]|(?:\uD83C[\uDC00-\uDFFF])|(?:\uD83D[\uDC00-\uDFFF])|(?:\uD83E[\uDD00-\uDDFF])/g, "")
    .trim();
  
  // Process text into clean paragraphs with better detection of paragraph breaks
  const processText = (text: string): string[] => {
    // Split into lines
    const lines = text.split('\n');
    const paragraphs: string[] = [];
    let currentParagraph = '';

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      
      // Skip empty lines
      if (line === '') {
        if (currentParagraph !== '') {
          paragraphs.push(currentParagraph);
          currentParagraph = '';
        }
        continue;
      }
      
      // Handle main section headers (1. Title)
      if (/^\d+\.\s+\w+/.test(line)) {
        if (currentParagraph !== '') {
          paragraphs.push(currentParagraph);
          currentParagraph = '';
        }
        paragraphs.push(line);
        continue;
      }

      // Handle subsection headers (2.1 Title)
      if (/^\d+\.\d+\s+\w+/.test(line)) {
        if (currentParagraph !== '') {
          paragraphs.push(currentParagraph);
          currentParagraph = '';
        }
        paragraphs.push(line);
        continue;
      }
      
      // Handle list items - now excluding emoji markers
      if (line.startsWith('- ') || line.startsWith('• ') || line.match(/^[0-9]+\)/)) {
        // If we have text in the current paragraph, add it before starting list
        if (currentParagraph !== '') {
          paragraphs.push(currentParagraph);
          currentParagraph = '';
        }
        
        // Add list item directly
        paragraphs.push(line);
      } 
      // Regular paragraph text - accumulate
      else {
        if (currentParagraph === '') {
          currentParagraph = line;
        } else {
          currentParagraph += ' ' + line;
        }
      }
    }
    
    // Add any remaining paragraph
    if (currentParagraph !== '') {
      paragraphs.push(currentParagraph);
    }
    
    return paragraphs;
  };

  // Process the report text to properly format sections with brand styling
  let formattedReportText = "";

  // First split the text into sections based on numbered headers (1., 2., etc.)
  const sections = cleanText.split(/(?=^\d+\.\s+)/m);

  for (let i = 0; i < sections.length; i++) {
    const section = sections[i].trim();
    if (!section) continue;
    
    // Process this section text into clean paragraphs
    const paragraphs = processText(section);
    
    // Process the first line as a section header if it matches the pattern
    const headerMatch = paragraphs[0].match(/^(\d+)\.\s+(.+)$/);
    
    if (headerMatch) {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const [_, number, title] = headerMatch;
      
      // Add the main section header with increased bottom margin
      formattedReportText += `<h2 style="color: ${colors.darkEarth}; font-family: 'ABC Arizona Flare'; font-size: 26px; margin-top: 30px; margin-bottom: 20px; display: block; clear: both;">${number}. ${title}</h2>`;
      
      let inList = false;
      
      // Process the rest of the paragraphs
      for (let j = 1; j < paragraphs.length; j++) {
        const paragraph = paragraphs[j];
        
        // Check for subsection headers (2.1 Title)
        const subheaderMatch = paragraph.match(/^(\d+\.\d+)\s+(.+)$/);
        
        if (subheaderMatch) {
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          const [_, number, title] = subheaderMatch;
          formattedReportText += `<h3 style="color: ${colors.richRed}; font-family: 'ABC Arizona Flare'; font-size: 20px; margin-top: 24px; margin-bottom: 16px; display: block; clear: both;">${number} ${title}</h3>`;
        }
        // Check for list items - simplified without emoji detection
        else if (paragraph.startsWith('- ') || paragraph.startsWith('• ') || paragraph.match(/^[0-9]+\)/)) {
          // Extract content after the marker
          let itemContent = paragraph;
          if (paragraph.startsWith('- ') || paragraph.startsWith('• ')) {
            itemContent = paragraph.substring(2);
          } else if (paragraph.match(/^[0-9]+\)/)) {
            // For numbered list items with parenthesis
            itemContent = paragraph.replace(/^[0-9]+\)\s*/, '');
          }
          
          if (!inList) {
            inList = true;
            formattedReportText += '<ul style="margin-left: 20px; padding-left: 15px; margin-bottom: 16px;">';
          }
          
          formattedReportText += `<li style="font-family: 'ABC Arizona Flare Sans'; font-size: 15px; margin-bottom: 8px; color: ${colors.charcoalGray};">${itemContent}</li>`;
        }
        // Regular paragraph
        else {
          // If we were in a list, close it
          if (inList) {
            inList = false;
            formattedReportText += '</ul>';
          }
          
          // Format ALL CAPS words for emphasis (but avoid processing acronyms)
          const formattedParagraph = paragraph.replace(
            /\b([A-Z]{3,})\b/g,
            (match: string) => {
              const commonAcronyms = ['PDF', 'KPI', 'ROI', 'API', 'CEO', 'CTO', 'CFO', 'COO'];
              if (commonAcronyms.includes(match)) {
                return match;
              }
              return `<span style="font-weight: bold; color: inherit;">${match}</span>`;
            }
          );
          
          formattedReportText += `<p style="font-family: 'ABC Arizona Flare Sans'; font-size: 15px; line-height: 1.5; margin-bottom: 14px; color: ${colors.charcoalGray}; display: block;">${formattedParagraph}</p>`;
        }
      }
      
      // Close any open list at the end of a section
      if (inList) {
        formattedReportText += '</ul>';
      }
    } else {
      // If the section doesn't start with a proper header, just add it as a paragraph
      formattedReportText += `<p style="font-family: 'ABC Arizona Flare Sans'; font-size: 15px; line-height: 1.5; margin-bottom: 14px; color: ${colors.charcoalGray};">${section}</p>`;
    }
  }

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        ${fontStyles}
        
        body {
          font-family: 'ABC Arizona Flare Sans', sans-serif;
          background-color: ${colors.offWhite};
          color: ${colors.darkEarth};
          margin: 0;
          padding: 0;
        }
        
        .report-container {
          max-width: 800px;
          margin: 0 auto;
          padding: 40px;
          background-color: white;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
        }
        
        .report-header {
          text-align: center;
          margin-bottom: 40px;
          padding-bottom: 20px;
          border-bottom: 2px solid ${colors.softGray};
        }
        
        .report-title {
          font-family: 'ABC Arizona Flare', serif;
          font-size: 32px;
          color: ${colors.darkEarth};
          margin-bottom: 10px;
        }
        
        .report-date {
          font-family: 'ABC Arizona Flare Sans', sans-serif;
          font-size: 14px;
          color: ${colors.charcoalGray};
        }
        
        .report-content {
          line-height: 1.5;
        }
        
        /* Add styles to ensure proper spacing between sections */
        h2 {
          display: block;
          clear: both;
          margin-top: 30px;
          margin-bottom: 20px;
          font-size: 26px;
          color: ${colors.darkEarth};
          font-weight: 500;
        }
        
        h3 {
          display: block;
          clear: both;
          margin-top: 24px;
          margin-bottom: 16px;
          font-size: 20px;
          color: ${colors.richRed};
          font-weight: 500;
        }
        
        p {
          display: block;
          margin-bottom: 14px;
          font-size: 15px;
          line-height: 1.5;
        }
        
        ul {
          margin-bottom: 16px;
          padding-left: 20px;
        }
        
        li {
          margin-bottom: 10px;
          font-size: 15px;
        }
        
        .report-footer {
          margin-top: 60px;
          padding-top: 20px;
          border-top: 2px solid ${colors.softGray};
          text-align: center;
          font-size: 12px;
          color: ${colors.charcoalGray};
        }
        
        .status-badge {
          display: inline-block;
          padding: 4px 10px;
          border-radius: 4px;
          font-weight: 500;
          margin-bottom: 16px;
          font-size: 14px;
        }
        
        .status-success {
          background-color: ${colors.softGreen};
          color: ${colors.forestGreen};
        }
        
        .status-warning {
          background-color: ${colors.warmYellow};
          color: ${colors.darkBrown};
        }
        
        .status-danger {
          background-color: ${colors.coralOrange};
          color: ${colors.burntRed};
        }
      </style>
    </head>
    <body>
      <div id="report-iframe-content" class="report-container">
        <div class="report-header">
          <h1 class="report-title">Project Metrics Report – ${projectData.name}</h1>
          <p class="report-date">🗓 Reporting Period: ${formattedDate}</p>
        </div>
        
        <div class="report-content">
          ${formattedReportText}
        </div>
        
        <div class="report-footer">
          <p>Generated by Beforest Project Metrics Dashboard</p>
        </div>
      </div>
    </body>
    </html>
  `;
}; 