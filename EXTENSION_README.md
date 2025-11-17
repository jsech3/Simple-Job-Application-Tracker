# Job Application Tracker - Browser Extension

A zero-friction job application tracker with AI-powered parsing and intelligent tracking, now as a browser extension!

## Features

- **Auto-Detect Job Postings**: Automatically detects when you're viewing a job on LinkedIn, Indeed, ZipRecruiter, or Glassdoor
- **One-Click Add**: Click the floating button to instantly add jobs to your tracker
- **AI-Powered Parsing**: Extracts company, title, compensation, location, and more using Claude AI
- **Smart Tagging**: Auto-generates relevant tags for easy filtering
- **Side Panel Dashboard**: Full-featured dashboard in your browser's side panel
- **Follow-Up Reminders**: Get notified when it's time to follow up
- **Export Data**: Download as CSV or JSON
- **Privacy First**: All data stored locally on your device

## Installation

### From Source (Development)

1. **Build the extension**:
   ```bash
   npm install
   npm run build:ext
   ```

2. **Load in Chrome**:
   - Open Chrome and go to `chrome://extensions/`
   - Enable "Developer mode" (top right)
   - Click "Load unpacked"
   - Select the `dist` folder

3. **Load in Firefox**:
   - Open Firefox and go to `about:debugging#/runtime/this-firefox`
   - Click "Load Temporary Add-on"
   - Select any file in the `dist` folder (e.g., `manifest.json`)

### From Chrome Web Store (Coming Soon)

Once published, you'll be able to install directly from the Chrome Web Store.

## Setup

1. **Configure API Key**:
   - Right-click the extension icon → Options
   - Or go to extension settings
   - Enter your Anthropic API key
   - Get one at https://console.anthropic.com/

2. **Start Tracking**:
   - Visit any job posting on supported platforms
   - Click the "Add to Job Tracker" button that appears
   - Or right-click → "Add to Job Tracker"
   - The job will be automatically parsed and added

3. **View Dashboard**:
   - Click the extension icon to open the side panel
   - View all your applications, statistics, and reminders

## Supported Platforms

- LinkedIn Jobs
- Indeed
- ZipRecruiter
- Glassdoor
- Any website (manual text paste)

## Usage

### Adding Jobs

**Method 1: Auto-Detect (Recommended)**
1. Visit a job posting
2. Click the floating "Add to Job Tracker" button
3. Wait for AI to parse the details
4. Review and edit in the dashboard

**Method 2: Context Menu**
1. Right-click anywhere on a job posting page
2. Select "Add to Job Tracker"

**Method 3: Manual Entry**
1. Open the dashboard (click extension icon)
2. Click "Add Job" button
3. Paste job description or enter details manually

### Managing Applications

- **Update Status**: Click dropdown to change application status
- **Add Notes**: Click on any job to add custom notes
- **Follow-Up**: Generate AI-powered follow-up emails
- **Delete**: Click delete icon to remove applications
- **Export**: Download all data as CSV or JSON

### Filtering and Search

- Filter by status, platform, work environment, or work type
- Filter by custom tags
- Search by company name or job title

## Keyboard Shortcuts

- `Cmd/Ctrl + K`: Quick search
- `Esc`: Close modals

## Privacy & Security

- ✅ All data stored locally on your device
- ✅ API key stored in browser sync storage (encrypted)
- ✅ No telemetry or tracking
- ✅ Open source - audit the code yourself
- ✅ Only sends job text to Anthropic's API (when you use AI features)

See [PRIVACY.md](PRIVACY.md) for full privacy policy.

## Development

### Project Structure

```
├── public/
│   ├── manifest.json       # Extension manifest
│   ├── icons/              # Extension icons
│   └── content-script.css  # Content script styles
├── src/
│   ├── extension/
│   │   ├── background.ts   # Service worker
│   │   ├── content-script.ts # Job detection
│   │   ├── sidepanel.tsx   # Main app entry
│   │   ├── options.tsx     # Settings page
│   │   └── browser-polyfill.ts # Cross-browser API
│   ├── services/
│   │   ├── storage.ts      # Chrome storage wrapper
│   │   └── claude.ts       # AI parsing
│   └── components/         # React components
├── sidepanel.html          # Side panel entry point
└── options.html            # Options page entry point
```

### Build Commands

```bash
# Development build
npm run build:ext

# Watch mode (auto-rebuild on changes)
npm run watch:ext

# Regular web app (for testing)
npm run dev
```

### Testing

1. Make changes to source files
2. Run `npm run build:ext`
3. Go to `chrome://extensions/` and click refresh on the extension
4. Test the changes

## Troubleshooting

### Extension won't load
- Make sure you ran `npm run build:ext`
- Check that you selected the `dist` folder
- Look for errors in `chrome://extensions/`

### API key not working
- Verify key starts with `sk-ant-`
- Check you have API credits in Anthropic Console
- Try removing and re-adding the key

### Jobs not parsing correctly
- Try copying the text manually and pasting
- Check browser console for errors
- Verify API key is set correctly

### Side panel not opening
- Side panel requires Chrome 114+
- Try right-clicking extension icon → Inspect popup
- Check for JavaScript errors

## Contributing

Contributions welcome! Please:
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## License

ISC License - see LICENSE file

## Support

- **Issues**: https://github.com/jsech3/Simple-Job-Application-Tracker/issues
- **Discussions**: https://github.com/jsech3/Simple-Job-Application-Tracker/discussions

## Disclaimer

This extension is not affiliated with or endorsed by LinkedIn, Indeed, ZipRecruiter, Glassdoor, or Anthropic. Job posting content is processed according to each platform's Terms of Service. Use responsibly and ensure compliance with platform policies.

---

**Happy Job Hunting! 🎯**
