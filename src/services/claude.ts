import Anthropic from '@anthropic-ai/sdk';
import {
  ParsedJobData,
  JobParseResponse,
  EmailGenerationResponse,
  WorkEnvironment,
  WorkType,
  JobPlatform,
  JobApplication,
} from '../types';
import { storage } from '../extension/browser-polyfill';

const API_KEY_STORAGE_KEY = 'anthropic_api_key';
const isExtension = typeof chrome !== 'undefined' && chrome.storage;

// Get API key from chrome.storage or environment variable
const getApiKey = async (): Promise<string> => {
  if (isExtension) {
    // In extension context, get from storage
    const data = await storage.sync.get(API_KEY_STORAGE_KEY);
    const apiKey = data[API_KEY_STORAGE_KEY];
    if (!apiKey) {
      throw new Error('API key not configured. Please set it in the extension options.');
    }
    return apiKey;
  } else {
    // In development, get from environment variable
    const apiKey = import.meta.env.VITE_ANTHROPIC_API_KEY;
    if (!apiKey) {
      throw new Error('VITE_ANTHROPIC_API_KEY environment variable is not set');
    }
    return apiKey;
  }
};

// Detect platform from URL
const detectPlatform = (url: string): JobPlatform => {
  const urlLower = url.toLowerCase();

  if (urlLower.includes('linkedin.com')) return JobPlatform.LinkedIn;
  if (urlLower.includes('indeed.com')) return JobPlatform.Indeed;
  if (urlLower.includes('ziprecruiter.com')) return JobPlatform.ZipRecruiter;
  if (urlLower.includes('glassdoor.com')) return JobPlatform.Glassdoor;

  return JobPlatform.CompanyWebsite;
};

// Fetch webpage content (using a CORS proxy for client-side fetching)
const fetchWebpageContent = async (url: string): Promise<string> => {
  try {
    // For client-side apps, we need to use a CORS proxy or handle this server-side
    // Option 1: Use a public CORS proxy (not recommended for production)
    // const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`;

    // Option 2: Direct fetch (will work if the site allows CORS)
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`Failed to fetch URL: ${response.status} ${response.statusText}`);
    }

    const html = await response.text();

    // Extract text content from HTML (simple approach)
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');

    // Remove script and style elements
    const scripts = doc.querySelectorAll('script, style');
    scripts.forEach(el => el.remove());

    // Get text content
    const textContent = doc.body.textContent || '';

    // Clean up whitespace
    return textContent.replace(/\s+/g, ' ').trim();
  } catch (error) {
    console.error('Error fetching webpage:', error);
    throw new Error('Failed to fetch job posting. The URL may be invalid or blocked by CORS policy.');
  }
};

export class ClaudeService {
  // Initialize Claude client (removed caching since API key is async)
  private static async getClient(): Promise<Anthropic> {
    const apiKey = await getApiKey();
    return new Anthropic({
      apiKey,
      dangerouslyAllowBrowser: true, // Safe in extension context
    });
  }

  // Parse job posting from text content (NEW - bypasses CORS)
  static async parseJobDescriptionText(text: string, url?: string): Promise<JobParseResponse> {
    try {
      // Detect platform from URL if provided
      const platform = url ? detectPlatform(url) : JobPlatform.Other;

      // Create prompt for Claude
      const prompt = `You are a job posting parser. Extract structured information from the following job posting content.

${url ? `Job Posting URL: ${url}` : 'Source: User provided text'}
Platform: ${platform}

Content:
${text.substring(0, 10000)} // Limit to first 10k chars

Please extract the following information and return it as a JSON object:
{
  "title": "job title",
  "company": "company name",
  "compensation": {
    "min": number or null,
    "max": number or null,
    "currency": "USD" or other,
    "period": "annual" or "hourly"
  } or null if not found,
  "workEnvironment": "Remote" | "Hybrid" | "In-Office" | "Not Specified",
  "workType": "Full-time" | "Part-time" | "Contract" | "Internship" | "Not Specified",
  "location": "city, state, country",
  "benefits": ["benefit1", "benefit2", ...],
  "descriptionSummary": "brief 200-word summary of job description and requirements",
  "tags": ["tag1", "tag2", "tag3", ...],
  "confidence": {
    "title": 0-100,
    "company": 0-100,
    "workEnvironment": 0-100,
    "workType": 0-100
  }
}

Important:
- If compensation is not clearly stated, set it to null
- Be conservative with confidence scores
- Return ONLY valid JSON, no additional text
- For workEnvironment and workType, use exact strings from the options provided
- For tags, generate 3-8 relevant tags based on the job (e.g., industry, technologies, skills, seniority level, etc.)
  Examples: "JavaScript", "React", "Senior", "FinTech", "Healthcare", "Machine Learning", "Cloud", "Startup", "Enterprise"`;

      const client = await this.getClient();

      const message = await client.messages.create({
        model: 'claude-3-7-sonnet-20250219',
        max_tokens: 2000,
        messages: [
          {
            role: 'user',
            content: prompt,
          },
        ],
      });

      // Extract JSON from response
      const responseText = message.content[0].type === 'text' ? message.content[0].text : '';

      // Try to parse JSON from response
      let jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('Could not extract JSON from Claude response');
      }

      const parsedData = JSON.parse(jsonMatch[0]);

      // Add platform to parsed data
      const jobData: ParsedJobData = {
        ...parsedData,
        platform,
        workEnvironment: parsedData.workEnvironment as WorkEnvironment,
        workType: parsedData.workType as WorkType,
      };

      return {
        success: true,
        data: jobData,
      };
    } catch (error) {
      console.error('Error parsing job posting:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to parse job posting',
      };
    }
  }

  // Parse job posting from URL (legacy - tries to fetch, will hit CORS)
  static async parseJobPosting(url: string): Promise<JobParseResponse> {
    try {
      // Fetch webpage content
      const content = await fetchWebpageContent(url);

      // Use the text-based parser
      return this.parseJobDescriptionText(content, url);
    } catch (error) {
      console.error('Error parsing job posting from URL:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to parse job posting',
      };
    }
  }

  // Generate follow-up email
  static async generateFollowUpEmail(application: JobApplication): Promise<EmailGenerationResponse> {
    try {
      const daysSinceApplication = Math.floor(
        (Date.now() - new Date(application.applicationDate).getTime()) / (1000 * 60 * 60 * 24)
      );

      const prompt = `You are helping a job seeker write a professional follow-up email.

Job Details:
- Position: ${application.parsedData.title}
- Company: ${application.parsedData.company}
- Applied: ${daysSinceApplication} days ago
- User's notes about the role: ${application.userNotes || 'No specific notes provided'}

Generate a professional, warm follow-up email that:
1. Is concise and respectful of the recipient's time
2. References specific details from the user's notes if available
3. Expresses continued interest
4. Asks politely about application status

Return the response as JSON:
{
  "subject": "email subject line",
  "body": "email body text"
}

The email should be professional but personable. Use [Hiring Manager/Team] as the greeting placeholder.
Return ONLY valid JSON, no additional text.`;

      const client = await this.getClient();

      const message = await client.messages.create({
        model: 'claude-3-7-sonnet-20250219',
        max_tokens: 1000,
        messages: [
          {
            role: 'user',
            content: prompt,
          },
        ],
      });

      // Extract JSON from response
      const responseText = message.content[0].type === 'text' ? message.content[0].text : '';

      let jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('Could not extract JSON from Claude response');
      }

      const emailData = JSON.parse(jsonMatch[0]);

      return {
        success: true,
        email: {
          subject: emailData.subject,
          body: emailData.body,
        },
      };
    } catch (error) {
      console.error('Error generating email:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to generate email',
      };
    }
  }
}
