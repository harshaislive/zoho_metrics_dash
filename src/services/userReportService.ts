import axios from 'axios';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { colors, fontStyles } from './reportStyles';

// User metrics interface
export interface UserMetrics {
  utilization?: {
    rate: number;
    active_tasks: number;
    open_tasks: number;
  };
  timeliness?: {
    timeliness_rate: number;
    on_time_tasks: number;
    total_tasks: number;
  };
  completion?: {
    avg_days: number;
    completed_tasks: number;
  };
  aging?: {
    avg_days: number;
    overdue_tasks: number;
  };
}

export interface UserReportData {
  name: string;
  id: string;
  email: string;
  role?: string;
  status?: string;
  metrics?: UserMetrics;
}

// Function to generate AI report for users using OpenRouter API
export const generateUserAIReport = async (userData: UserReportData) => {
  try {
    // Replace with your actual OpenRouter API key
    const apiKey = import.meta.env.VITE_OPENROUTER_API_KEY || '';
    
    // Format the user data for the AI prompt
    const prompt = `As an expert performance analyst, generate a concise, insightful report for team member "${userData.name}" analyzing these metrics:
      - Utilization Rate: ${userData.metrics?.utilization?.rate || 0}% (${userData.metrics?.utilization?.active_tasks || 0} active tasks out of ${userData.metrics?.utilization?.open_tasks || 0} open tasks)
      - Task Timeliness: ${userData.metrics?.timeliness?.timeliness_rate || 0}% (${userData.metrics?.timeliness?.on_time_tasks || 0} on-time out of ${userData.metrics?.timeliness?.total_tasks || 0})
      - Avg. Completion Time: ${userData.metrics?.completion?.avg_days || 0} days (${userData.metrics?.completion?.completed_tasks || 0} completed tasks)
      - Task Aging: ${userData.metrics?.aging?.avg_days || 0} days (${userData.metrics?.aging?.overdue_tasks || 0} overdue tasks)

      Format your analysis as a professional report with exactly these numbered sections:
      1. Overview (brief summary of user performance)
      2. Key Performance Metrics (concise analysis of each metric)
      3. Strengths & Wins (positive areas and achievements)
      4. Focus Areas & Action Plan (specific recommendations)

      Please follow these formatting guidelines strictly:
      - Each numbered section header (like "1. Overview") MUST be on its own line
      - Start the content of each section on a new line after the section title
      - Use clear subsection headers for the Action Plan (like "Quick Wins" or "Long-Term Focus"), each on their own line
      - Content of subsections must start on a new line after the subsection title
      - Use "- " at the beginning of lines for bullet points
      - For emphasis, use ALL CAPS instead of any special characters
      - Be concise, direct, and focused on actionable insights
      - Prioritize constructive feedback and achievable goals
      - Use supportive, encouraging language
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
          { role: 'system', content: 'You are an expert performance coach who provides encouraging, constructive, and action-oriented feedback.' },
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
    console.error('Error generating AI user report:', error);
    return null;
  }
};

// Function to generate PDF for user reports
export const generateUserPDF = async (elementId: string, filename: string) => {
  // For iframe content, we need to target the iframe document
  const iframe = document.querySelector('iframe');
  const doc = iframe?.contentDocument;
  const element = doc?.getElementById(elementId);
  
  if (!element) {
    console.error('Element not found for PDF generation');
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
    
    // Set fixed widths to ensure consistent rendering
    const originalWidth = element.style.width;
    element.style.width = '800px';
    
    // Fix spacing issues in section headers
    const headers = doc?.querySelectorAll('h2, h3');
    headers?.forEach(header => {
      // Remove double spaces in headers
      if (header.textContent) {
        header.textContent = header.textContent.replace(/\s{2,}/g, ' ');
      }
      
      // Ensure proper margins
      (header as HTMLElement).style.clear = 'both';
      (header as HTMLElement).style.pageBreakAfter = 'avoid';
      (header as HTMLElement).style.pageBreakBefore = 'auto';
    });
    
    // Apply fixed width and proper alignment to tables
    const tables = doc?.querySelectorAll('table');
    tables?.forEach(table => {
      (table as HTMLTableElement).style.tableLayout = 'fixed';
      (table as HTMLTableElement).style.width = '100%';
      (table as HTMLTableElement).style.borderCollapse = 'collapse';
      
      // Ensure table doesn't break across pages if possible
      (table as HTMLTableElement).style.pageBreakInside = 'avoid';
    });
    
    // Adjust status badges to be more visible in PDF
    const statusBadges = doc?.querySelectorAll('.status-badge');
    statusBadges?.forEach(badge => {
      badge.classList.forEach(className => {
        if (className === 'status-success') {
          (badge as HTMLElement).style.backgroundColor = colors.softGreen;
          (badge as HTMLElement).style.color = colors.forestGreen;
        } else if (className === 'status-warning') {
          (badge as HTMLElement).style.backgroundColor = colors.warmYellow;
          (badge as HTMLElement).style.color = colors.darkBrown;
        } else if (className === 'status-danger') {
          (badge as HTMLElement).style.backgroundColor = colors.coralOrange;
          (badge as HTMLElement).style.color = colors.burntRed;
        }
      });
      
      (badge as HTMLElement).style.fontWeight = '600';
      (badge as HTMLElement).style.padding = '4px 8px';
      (badge as HTMLElement).style.borderRadius = '4px';
      (badge as HTMLElement).style.display = 'inline-block';
    });
    
    // Create canvas with higher quality settings
    const canvas = await html2canvas(element, { 
      scale: 2, // Higher scale for better quality
      useCORS: true,
      logging: false,
      backgroundColor: '#ffffff',
      windowWidth: 1200,
      allowTaint: false,
      onclone: (clonedDoc) => {
        // Make sure all styles are applied to the cloned document
        const clonedElement = clonedDoc.getElementById(elementId);
        if (clonedElement) {
          (clonedElement as HTMLElement).style.padding = '20px';
          
          // Apply the same fixes to the cloned document
          const clonedHeaders = clonedDoc.querySelectorAll('h2, h3');
          clonedHeaders.forEach(header => {
            if (header.textContent) {
              header.textContent = header.textContent.replace(/\s{2,}/g, ' ');
            }
            (header as HTMLElement).style.clear = 'both';
          });
          
          // Fix table layout in cloned document
          const clonedTables = clonedDoc.querySelectorAll('table');
          clonedTables.forEach(table => {
            (table as HTMLTableElement).style.tableLayout = 'fixed';
            (table as HTMLTableElement).style.width = '100%';
            (table as HTMLTableElement).style.borderCollapse = 'collapse';
          });
        }
      }
    });
    
    // Restore original width
    element.style.width = originalWidth;
    
    // Generate high-quality PDF
    const imgData = canvas.toDataURL('image/png', 1.0); // Use highest quality
    const pdf = new jsPDF('p', 'mm', 'a4');
    
    // Calculate dimensions to fit the image on the PDF page
    const imgProps = pdf.getImageProperties(imgData);
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
    
    // Check if content needs multiple pages
    if (pdfHeight > pdf.internal.pageSize.getHeight()) {
      // Content is longer than one page, we need to split it
      const pageHeight = pdf.internal.pageSize.getHeight();
      let remainingHeight = pdfHeight;
      let position = 0;
      
      // First page
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight, undefined, 'FAST');
      remainingHeight -= pageHeight;
      position -= pageHeight;
      
      // Add subsequent pages
      while (remainingHeight > 0) {
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, pdfHeight, undefined, 'FAST');
        remainingHeight -= pageHeight;
        position -= pageHeight;
      }
    } else {
      // Single page content
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
    }
    
    pdf.save(`${filename}.pdf`);
  } catch (error) {
    console.error('Error generating PDF:', error);
  }
};

// Function to create a metrics table for the user report
const createMetricsTable = (userData: UserReportData) => {
  const getStatusClass = (metric: string, value: number): string => {
    // Status thresholds can be adjusted based on requirements
    if (metric === 'utilization') {
      if (value >= 70) return 'status-success';
      if (value >= 30) return 'status-warning';
      return 'status-danger';
    }
    if (metric === 'timeliness') {
      if (value >= 75) return 'status-success';
      if (value >= 40) return 'status-warning';
      return 'status-danger';
    }
    if (metric === 'completion') {
      if (value <= 7) return 'status-success';
      if (value <= 14) return 'status-warning';
      return 'status-danger';
    }
    if (metric === 'aging') {
      if (value <= 5) return 'status-success';
      if (value <= 15) return 'status-warning';
      return 'status-danger';
    }
    return '';
  };

  const getStatusText = (metric: string, value: number): string => {
    // Status descriptions based on metrics
    if (metric === 'utilization') {
      if (value >= 70) return 'Excellent';
      if (value >= 30) return 'Needs Attention';
      return 'Critical Area';
    }
    if (metric === 'timeliness') {
      if (value >= 75) return 'Great Performance';
      if (value >= 40) return 'Opportunity for Growth';
      return 'Needs Improvement';
    }
    if (metric === 'completion') {
      if (value <= 7) return 'Highly Efficient';
      if (value <= 14) return 'Manageable';
      return 'Review Workflow';
    }
    if (metric === 'aging') {
      if (value <= 5) return 'Well Managed';
      if (value <= 15) return 'Address Soon';
      return 'Critical Area';
    }
    return '';
  };

  const getRemark = (metric: string, value: number): string => {
    // Custom remarks based on metrics
    if (metric === 'utilization') {
      if (value >= 70) return 'Great task engagement levels!';
      if (value >= 30) return 'More task engagement will help boost this number.';
      return 'Consider taking on more active tasks.';
    }
    if (metric === 'timeliness') {
      if (value >= 75) return 'Excellent at meeting deadlines!';
      if (value >= 40) return 'Prioritization and time management can improve results.';
      return 'Important to focus on meeting deadlines.';
    }
    if (metric === 'completion') {
      if (value <= 7) return 'Very quick task completion!';
      if (value <= 14) return 'Streamlining task execution can enhance efficiency.';
      return 'Look for ways to decrease task completion time.';
    }
    if (metric === 'aging') {
      if (value <= 5) return 'Very few overdue tasks, great job!';
      if (value <= 15) return 'Work on reducing overdue tasks soon.';
      return 'Addressing overdue tasks can significantly improve workflow.';
    }
    return '';
  };

  return `
    <div class="metrics-table">
      <table style="width: 100%; border-collapse: collapse; table-layout: fixed; margin-bottom: 30px;">
        <thead>
          <tr>
            <th style="width: 20%; text-align: left; padding: 12px; background-color: ${colors.softGray}; border: 1px solid ${colors.softGray}; font-weight: 600;">Metric</th>
            <th style="width: 30%; text-align: left; padding: 12px; background-color: ${colors.softGray}; border: 1px solid ${colors.softGray}; font-weight: 600;">Value</th>
            <th style="width: 20%; text-align: left; padding: 12px; background-color: ${colors.softGray}; border: 1px solid ${colors.softGray}; font-weight: 600;">Status</th>
            <th style="width: 30%; text-align: left; padding: 12px; background-color: ${colors.softGray}; border: 1px solid ${colors.softGray}; font-weight: 600;">Remarks</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td style="padding: 12px; border: 1px solid ${colors.softGray}; vertical-align: top;">Utilization Rate</td>
            <td style="padding: 12px; border: 1px solid ${colors.softGray}; vertical-align: top;">${userData.metrics?.utilization?.rate || 0}% (${userData.metrics?.utilization?.active_tasks || 0} active tasks out of ${userData.metrics?.utilization?.open_tasks || 0} open tasks)</td>
            <td style="padding: 12px; border: 1px solid ${colors.softGray}; vertical-align: top;">
              <div class="status-badge ${getStatusClass('utilization', userData.metrics?.utilization?.rate || 0)}" 
                   style="display: inline-block; padding: 4px 8px; border-radius: 4px; text-align: center; font-weight: 500; margin: 0;">
                ${getStatusText('utilization', userData.metrics?.utilization?.rate || 0)}
              </div>
            </td>
            <td style="padding: 12px; border: 1px solid ${colors.softGray}; vertical-align: top;">${getRemark('utilization', userData.metrics?.utilization?.rate || 0)}</td>
          </tr>
          <tr>
            <td style="padding: 12px; border: 1px solid ${colors.softGray}; vertical-align: top;">Task Timeliness</td>
            <td style="padding: 12px; border: 1px solid ${colors.softGray}; vertical-align: top;">${userData.metrics?.timeliness?.timeliness_rate || 0}% (${userData.metrics?.timeliness?.on_time_tasks || 0} on-time out of ${userData.metrics?.timeliness?.total_tasks || 0})</td>
            <td style="padding: 12px; border: 1px solid ${colors.softGray}; vertical-align: top;">
              <div class="status-badge ${getStatusClass('timeliness', userData.metrics?.timeliness?.timeliness_rate || 0)}"
                   style="display: inline-block; padding: 4px 8px; border-radius: 4px; text-align: center; font-weight: 500; margin: 0;">
                ${getStatusText('timeliness', userData.metrics?.timeliness?.timeliness_rate || 0)}
              </div>
            </td>
            <td style="padding: 12px; border: 1px solid ${colors.softGray}; vertical-align: top;">${getRemark('timeliness', userData.metrics?.timeliness?.timeliness_rate || 0)}</td>
          </tr>
          <tr>
            <td style="padding: 12px; border: 1px solid ${colors.softGray}; vertical-align: top;">Avg. Completion Time</td>
            <td style="padding: 12px; border: 1px solid ${colors.softGray}; vertical-align: top;">${userData.metrics?.completion?.avg_days || 0} days (${userData.metrics?.completion?.completed_tasks || 0} completed tasks)</td>
            <td style="padding: 12px; border: 1px solid ${colors.softGray}; vertical-align: top;">
              <div class="status-badge ${getStatusClass('completion', userData.metrics?.completion?.avg_days || 0)}"
                   style="display: inline-block; padding: 4px 8px; border-radius: 4px; text-align: center; font-weight: 500; margin: 0;">
                ${getStatusText('completion', userData.metrics?.completion?.avg_days || 0)}
              </div>
            </td>
            <td style="padding: 12px; border: 1px solid ${colors.softGray}; vertical-align: top;">${getRemark('completion', userData.metrics?.completion?.avg_days || 0)}</td>
          </tr>
          <tr>
            <td style="padding: 12px; border: 1px solid ${colors.softGray}; vertical-align: top;">Task Aging</td>
            <td style="padding: 12px; border: 1px solid ${colors.softGray}; vertical-align: top;">${userData.metrics?.aging?.avg_days || 0} days (${userData.metrics?.aging?.overdue_tasks || 0} overdue tasks)</td>
            <td style="padding: 12px; border: 1px solid ${colors.softGray}; vertical-align: top;">
              <div class="status-badge ${getStatusClass('aging', userData.metrics?.aging?.avg_days || 0)}"
                   style="display: inline-block; padding: 4px 8px; border-radius: 4px; text-align: center; font-weight: 500; margin: 0;">
                ${getStatusText('aging', userData.metrics?.aging?.avg_days || 0)}
              </div>
            </td>
            <td style="padding: 12px; border: 1px solid ${colors.softGray}; vertical-align: top;">${getRemark('aging', userData.metrics?.aging?.avg_days || 0)}</td>
          </tr>
        </tbody>
      </table>
    </div>
  `;
};

// Function to format user report data as HTML
export const formatUserReportAsHTML = (reportText: string, userData: UserReportData) => {
  // Format the current date according to the requirements
  const formattedDate = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  // Clean the report text from any HTML tags the AI might have generated
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

      // Handle subsection headers (plain text subsection headers like "Quick Wins" or "Long-Term Focus")
      // Subsections will typically be shorter phrases at the start of paragraphs
      if (line.length < 30 && line.match(/^[A-Z][a-z]+(\s+[A-Z][a-z]+){0,3}\s*(:|$)/)) {
        if (currentParagraph !== '') {
          paragraphs.push(currentParagraph);
          currentParagraph = '';
        }
        paragraphs.push(line);
        continue;
      }
      
      // Handle list items - simplified without emoji detection
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

  // Create the user info section
  const userInfoSection = `
    <div class="user-info">
      <div class="user-detail"><strong>Full Name:</strong> ${userData.name}</div>
      <div class="user-detail"><strong>Email:</strong> ${userData.email}</div>
      <div class="user-detail"><strong>Role Status:</strong> <span class="status-badge status-success">${userData.status || 'Active'}</span></div>
    </div>
  `;

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
      
      // Special handling for the Key Performance Metrics section
      if (number === '2' && title.toLowerCase().includes('performance')) {
        // Add the metrics table here for section 2
        formattedReportText += createMetricsTable(userData);
      }
      
      let inList = false;
      
      // Process the rest of the paragraphs
      for (let j = 1; j < paragraphs.length; j++) {
        const paragraph = paragraphs[j];
        
        // Check for subsection headers (text-based like "Quick Wins")
        // Look for short phrases that are likely subsection titles
        const isSubheader = paragraph.length < 30 && paragraph.match(/^[A-Z][a-z]+(\s+[A-Z][a-z]+){0,3}\s*(:|$)/);
        
        if (isSubheader) {
          // Close any open list
          if (inList) {
            inList = false;
            formattedReportText += '</ul>';
          }
          
          // Format subsection header (removing any trailing colon)
          const title = paragraph.replace(/:$/, '');
          formattedReportText += `<h3 style="color: ${colors.richRed}; font-family: 'ABC Arizona Flare'; font-size: 20px; margin-top: 24px; margin-bottom: 16px; display: block; clear: both;">${title}</h3>`;
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
          
          formattedReportText += `<li style="font-family: 'ABC Arizona Flare Sans'; font-size: 15px; margin-bottom: 10px; color: ${colors.charcoalGray};">${itemContent}</li>`;
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
        
        .user-info {
          background-color: ${colors.softGray};
          padding: 20px;
          border-radius: 8px;
          margin-bottom: 24px;
        }
        
        .user-detail {
          margin-bottom: 8px;
          font-size: 15px;
          color: ${colors.charcoalGray};
        }
        
        .metrics-table {
          margin: 20px 0 30px 0;
          width: 100%;
        }
        
        .metrics-table table {
          width: 100%;
          border-collapse: collapse;
          border: 1px solid ${colors.softGray};
        }
        
        .metrics-table th {
          background-color: ${colors.softGray};
          color: ${colors.darkEarth};
          text-align: left;
          padding: 12px;
          font-weight: 500;
          font-family: 'ABC Arizona Flare', serif;
        }
        
        .metrics-table td {
          padding: 12px;
          border-bottom: 1px solid ${colors.softGray};
          color: ${colors.charcoalGray};
          font-size: 14px;
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
          margin-bottom: 8px;
          font-size: 14px;
          white-space: nowrap;
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
          <h1 class="report-title">User Performance Report – ${userData.name}</h1>
          <p class="report-date">Reporting Period: ${formattedDate}</p>
        </div>
        
        <div class="report-content">
          ${userInfoSection}
          ${formattedReportText}
        </div>
        
        <div class="report-footer">
          <p>Generated by Beforest Team Metrics Dashboard</p>
        </div>
      </div>
    </body>
    </html>
  `;
}; 