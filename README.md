# Job Application Tracker

A zero-friction job application tracker with automatic parsing and intelligent tracking. Built with React, TypeScript, Tailwind CSS, and Claude AI.

## Features

### Core Functionality
- **Automatic Job Parsing**: Paste a job posting URL and automatically extract:
  - Job title
  - Company name
  - Compensation range
  - Work environment (Remote/Hybrid/In-Office)
  - Work type (Full-time/Part-time/Contract/Internship)
  - Location
  - Benefits
  - Job description summary

- **Smart Tracking**: Keep track of all your applications with:
  - Application status updates
  - Timeline view of your job search journey
  - Custom notes for each application
  - Follow-up reminders (automatically suggests follow-ups after 2 weeks)

- **AI-Powered Follow-ups**: Generate personalized follow-up emails using Claude AI that:
  - Reference your original notes about the position
  - Maintain a professional yet warm tone
  - Are fully editable before sending

- **Data Visualization**: Analyze your job search with:
  - Applications over time (line chart)
  - Status breakdown (pie chart)
  - Platform distribution (bar chart)
  - Work environment preferences
  - Compensation ranges
  - Response rate and average response time

- **Job Search** (NEW): Find jobs without leaving the tracker:
  - **Search Job Boards** — keyword + location search via JSearch API (aggregates LinkedIn, Indeed, Glassdoor, ZipRecruiter)
  - **AI Suggestions** — fill in your profile and Claude generates smart search queries, then runs them through JSearch for real listings
  - **Manual Import** — paste one or more raw job descriptions, Claude parses them into structured results
  - Single-click preview-and-import or batch-select multiple results
  - Duplicate detection by URL and title+company match

- **Export Functionality**: Never lose your data with:
  - JSON export (full backup)
  - CSV export (spreadsheet-compatible)

### Supported Platforms
- LinkedIn
- Indeed
- ZipRecruiter
- Glassdoor
- Company career pages

## Tech Stack

- **Frontend**: React 19 with TypeScript
- **Styling**: Tailwind CSS 4
- **Charts**: Recharts
- **Animations**: Framer Motion
- **AI Integration**: Anthropic Claude API (`@anthropic-ai/sdk`)
- **Job Search API**: JSearch via RapidAPI
- **Build Tool**: Vite 7
- **Storage**: Browser localStorage / Chrome extension storage

## Getting Started

### Prerequisites
- Node.js 16+ and npm
- An Anthropic API key (get one at [console.anthropic.com](https://console.anthropic.com/)) — optional, only needed for AI parsing and email generation

### Installation

1. Clone the repository:
```bash
git clone https://github.com/jsech3/Simple-Job-Application-Tracker.git
cd Simple-Job-Application-Tracker
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file in the root directory:
```bash
cp .env.example .env
```

4. Add your API keys to `.env`:
```
VITE_ANTHROPIC_API_KEY=your_anthropic_api_key_here
VITE_JSEARCH_API_KEY=your_rapidapi_key_here
```

| Variable | Required | Description |
|----------|----------|-------------|
| `VITE_ANTHROPIC_API_KEY` | For AI features | Anthropic API key for Claude (parsing, emails, AI suggestions, bulk import) |
| `VITE_JSEARCH_API_KEY` | For job search | RapidAPI key subscribed to [JSearch](https://rapidapi.com/letscrape-6bRBa3QguO5/api/jsearch) (free tier: 200 req/month) |

5. Start the development server:
```bash
npm run dev
```

6. Open your browser and navigate to the URL shown in the terminal (usually `http://localhost:5173`)

> **Note:** The app works without an API key — you can add jobs manually. AI parsing and email generation require a valid Anthropic API key.

### Loading the Chrome Extension

1. Build the extension:
```bash
npm run build
```

2. Open Chrome and go to `chrome://extensions/`
3. Enable **Developer mode** (toggle in the top right)
4. Click **Load unpacked** and select the `dist/` folder
5. The extension icon will appear in your toolbar

### Building for Production

```bash
npm run build
```

The built files will be in the `dist` directory.

### Preview Production Build

```bash
npm run preview
```

### Deploy to Vercel

1. Push your code to a GitHub repository
2. Go to [vercel.com](https://vercel.com) and import your repo
3. Set the environment variable `VITE_ANTHROPIC_API_KEY` in Vercel's project settings
4. Deploy — the included `vercel.json` handles SPA routing automatically

## Usage Guide

### Adding a New Application

1. Click the "Add Application" button on the dashboard
2. Paste the job posting URL
3. Click "Parse Job Posting" and wait a few seconds
4. Review and edit the automatically extracted data
5. Add any personal notes about why you're interested
6. Click "Save Application"

**Alternative**: Click "Manual Entry" to skip parsing and enter all details manually.

### Updating Application Status

1. Click on any job card in the dashboard
2. Click "Add Status Update"
3. Check "Have you heard back?" if applicable
4. Select the next step (e.g., Phone Screen Scheduled, Interview, etc.)
5. Add optional notes
6. Click "Save Update"

### Generating Follow-up Emails

1. Wait for a follow-up reminder to appear (2 weeks after applying)
2. Click "Generate Email" in the reminder, or
3. Open a job detail and click "Generate Follow-up Email"
4. Review and edit the generated email
5. Click "Copy to Clipboard"
6. Paste into your email client and send

### Viewing Statistics

1. Click "Statistics" in the top navigation
2. Explore various charts and metrics about your job search
3. Use insights to adjust your strategy

### Exporting Data

1. Click "Export" in the top navigation
2. Choose "Export as JSON" for a full backup
3. Choose "Export as CSV" for spreadsheet compatibility

### Searching for Jobs

1. Click **Search** in the top navigation
2. Choose one of three tabs:

**Search Job Boards:**
1. Enter keywords (e.g. "frontend developer") and optionally a location
2. Adjust filters (work environment, type, date posted, remote-only)
3. Click **Search** or press Enter
4. Click any result card to preview — edit fields, add notes, then "Import to Tracker"
5. Or check multiple cards and use the sticky bottom bar to **Import Selected**

**AI Suggestions:**
1. Fill in your profile (skills, desired titles, locations, experience level, etc.)
2. Click **Generate Search Suggestions**
3. Claude returns 5 targeted queries — click any to search JSearch
4. Review and import results the same way as the Search tab

**Manual Import:**
1. Paste one or more raw job descriptions into the text area
2. Click **Parse with AI** — Claude extracts each posting
3. Parsed results appear in the grid below for review and import

**Duplicate detection:** Results already in your tracker are dimmed and marked "Imported". During batch import, duplicates are automatically skipped.

## Project Structure

```
src/
├── components/
│   ├── search/                      # Job Search sub-components
│   │   ├── SearchFilters.tsx        # Keyword, location, and dropdown filters
│   │   ├── SearchResultCard.tsx     # Result card with batch-select checkbox
│   │   ├── SearchResultPreview.tsx  # Edit-and-import modal
│   │   └── BulkImportPanel.tsx      # Paste & parse with Claude
│   ├── JobSearch.tsx                # Main search page (3-tab container)
│   ├── Dashboard.tsx                # Application list with filtering/sorting
│   ├── AddJobForm.tsx               # AI-parse or manual entry form
│   ├── JobCard.tsx                  # Application card in the dashboard grid
│   ├── JobDetail.tsx                # Full application detail modal
│   ├── Statistics.tsx               # Charts and analytics
│   ├── EmailGenerator.tsx           # AI follow-up email composer
│   ├── FollowUpReminders.tsx        # Reminder banner
│   └── ...                          # Onboarding, dark mode, demo panel
├── services/
│   ├── claude.ts                    # All Claude AI interactions
│   ├── jobSearch.ts                 # JSearch API client
│   └── storage.ts                   # localStorage / chrome.storage CRUD
├── types/
│   └── index.ts                     # All TypeScript interfaces and enums
├── hooks/                           # useDarkMode, useOnboarding
├── animations/
│   └── variants.ts                  # Framer Motion animation presets
├── extension/                       # Chrome extension entry points
├── App.tsx                          # Root component and view router
└── main.tsx                         # Vite entry point
```

## Important Notes

### CORS and Job Parsing

Due to browser security restrictions (CORS), some job posting URLs may not be accessible for automatic parsing. In these cases:

1. The app will show an error message
2. You can use the "Manual Entry" option instead
3. For production use, consider implementing a backend proxy server

### API Costs

**Claude API** (Anthropic) — pay-per-use:
- Job parsing: ~1-2 cents per parse
- Email generation: ~0.5-1 cent per email
- AI search suggestions: ~0.5-1 cent per generation
- Bulk import parsing: ~1-3 cents per batch (depends on text length)

Monitor your usage at [console.anthropic.com](https://console.anthropic.com/).

**JSearch API** (RapidAPI) — free tier: 200 requests/month. Each search or AI-suggested query uses 1 request. Paid plans available for higher volume.

### Data Privacy

All your data is stored locally in your browser's localStorage:
- Data never leaves your computer unless you explicitly export it
- Clearing browser data will delete all applications
- Regular exports are recommended for backup

## Future Enhancements (Phase 2)

- User accounts with cloud sync
- Gmail integration for auto-detecting responses
- Calendar integration for interview scheduling
- Application materials tracker
- Company research notes
- Salary negotiation calculator
- Mobile app

## Troubleshooting

### "API key not found" error
Make sure you've created a `.env` file with `VITE_ANTHROPIC_API_KEY=your_key`

### Parsing fails for most URLs
This is likely due to CORS. Consider:
- Using manual entry
- Setting up a backend proxy (future enhancement)

### Tailwind styles not working
Run `npm install` to ensure all dependencies are installed

### Build errors
Clear node_modules and reinstall:
```bash
rm -rf node_modules package-lock.json
npm install
```

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

ISC

## Acknowledgments

- Built with [Claude AI](https://www.anthropic.com/claude) by Anthropic
- Charts powered by [Recharts](https://recharts.org/)
- UI styled with [Tailwind CSS](https://tailwindcss.com/)
