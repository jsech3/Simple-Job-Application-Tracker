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
- **Styling**: Tailwind CSS
- **Charts**: Recharts
- **AI Integration**: Anthropic Claude API
- **Build Tool**: Vite
- **Storage**: Browser localStorage

## Getting Started

### Prerequisites
- Node.js 16+ and npm
- An Anthropic API key (get one at [console.anthropic.com](https://console.anthropic.com/))

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

4. Add your Anthropic API key to `.env`:
```
VITE_ANTHROPIC_API_KEY=your_api_key_here
```

5. Start the development server:
```bash
npm run dev
```

6. Open your browser and navigate to the URL shown in the terminal (usually `http://localhost:5173`)

### Building for Production

```bash
npm run build
```

The built files will be in the `dist` directory.

### Preview Production Build

```bash
npm run preview
```

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

## Project Structure

```
job-tracking-dashboard/
├── src/
│   ├── components/          # React components
│   │   ├── AddJobForm.tsx
│   │   ├── Dashboard.tsx
│   │   ├── EmailGenerator.tsx
│   │   ├── FollowUpReminders.tsx
│   │   ├── JobCard.tsx
│   │   ├── JobDetail.tsx
│   │   └── Statistics.tsx
│   ├── services/            # Business logic
│   │   ├── claude.ts        # Claude API integration
│   │   └── storage.ts       # localStorage management
│   ├── types/              # TypeScript definitions
│   │   └── index.ts
│   ├── App.tsx             # Main application
│   ├── main.tsx            # Entry point
│   └── index.css           # Global styles
├── index.html
├── package.json
├── tsconfig.json
├── tailwind.config.js
├── vite.config.ts
├── .env.example
└── README.md
```

## Important Notes

### CORS and Job Parsing

Due to browser security restrictions (CORS), some job posting URLs may not be accessible for automatic parsing. In these cases:

1. The app will show an error message
2. You can use the "Manual Entry" option instead
3. For production use, consider implementing a backend proxy server

### API Costs

This app uses the Claude API which has associated costs:
- Job parsing: ~1-2 cents per parse
- Email generation: ~0.5-1 cent per email

Monitor your usage at [console.anthropic.com](https://console.anthropic.com/).

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
