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

// Get API key from environment variable
const getApiKey = (): string => {
  const apiKey = import.meta.env.VITE_ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error('VITE_ANTHROPIC_API_KEY environment variable is not set');
  }
  return apiKey;
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
  private static client: Anthropic | null = null;

  // Initialize Claude client
  private static getClient(): Anthropic {
    if (!this.client) {
      this.client = new Anthropic({
        apiKey: getApiKey(),
        dangerouslyAllowBrowser: true, // Note: For production, move this to a backend
      });
    }
    return this.client;
  }

  // Parse job posting from URL
  static async parseJobPosting(url: string): Promise<JobParseResponse> {
    try {
      // Fetch webpage content
      const content = await fetchWebpageContent(url);

      // Detect platform
      const platform = detectPlatform(url);

      // Create prompt for Claude
      const prompt = `You are a job posting parser. Extract structured information from the following job posting content.

Job Posting URL: ${url}
Platform: ${platform}

Content:
${content.substring(0, 10000)} // Limit to first 10k chars

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
- For workEnvironment and workType, use exact strings from the options provided`;

      const client = this.getClient();

      const message = await client.messages.create({
        model: 'claude-3-5-sonnet-20241022',
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

      const client = this.getClient();

      const message = await client.messages.create({
        model: 'claude-3-5-sonnet-20241022',
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
