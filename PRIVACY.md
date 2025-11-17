# Privacy Policy - Job Application Tracker

**Last Updated:** November 16, 2025

## Overview

The Job Application Tracker browser extension is designed with privacy as a core principle. We are committed to protecting your personal information and being transparent about data handling.

## Data Collection and Storage

### What Data We Collect

The extension collects and stores:
- Job application information you add (company name, job title, location, compensation, notes)
- Your Anthropic API key (if you provide one)
- Application status updates and follow-up reminders
- Tags and custom notes you add to applications

### Where Data is Stored

- **All application data** is stored locally on your device using your browser's storage API
- **API Key** is stored using browser sync storage (syncs across your devices where you're signed in)
- **No cloud storage**: We do not maintain any servers or databases. Your data never leaves your control.

## Data Usage

### How We Use Your Data

- To display your job applications in the dashboard
- To generate statistics about your job search
- To send job posting content to Anthropic's API for parsing (only when you use the AI features)

### Third-Party Services

The only third-party service we interact with is:

**Anthropic API**
- Purpose: Parse job postings and generate follow-up emails
- Data sent: Job posting text content only (when you use AI features)
- Your control: You provide your own API key and can remove it at any time
- Their privacy policy: https://www.anthropic.com/privacy

## Data Sharing

We DO NOT:
- Sell your data
- Share your data with advertisers
- Send your data to our servers (we don't have any)
- Track your browsing history beyond detecting job posting pages

## Your Rights

You have complete control over your data:

- **View**: All data is visible in the extension dashboard
- **Export**: Download your data as JSON or CSV at any time
- **Delete**: Clear individual applications or all data
- **Portability**: Export and import data freely

## Permissions Explained

The extension requests these permissions:

- **storage**: Store your applications locally
- **sidePanel**: Display the dashboard in a side panel
- **activeTab**: Read job posting content when you click "Add to Tracker"
- **contextMenus**: Add right-click menu option on job sites
- **scripting**: Inject the "Add to Tracker" button on job sites

We only access page content on job posting sites (LinkedIn, Indeed, etc.) and only when you explicitly click to add a job.

## Security

- API keys are stored in encrypted browser storage
- All data stays on your device
- Communication with Anthropic API uses HTTPS

## Changes to Privacy Policy

We may update this privacy policy. Significant changes will be noted in extension updates.

## Contact

For privacy questions or concerns:
- GitHub Issues: https://github.com/jsech3/Simple-Job-Application-Tracker/issues
- Email: [Your contact email]

## Compliance

This extension:
- Does not collect personal information for profiling
- Does not track users across websites
- Complies with browser extension store policies
- Is open source - you can audit the code

## Children's Privacy

This extension is not intended for children under 13 and we do not knowingly collect data from children.

---

**Summary**: Your job tracking data stays on your device. We don't collect, store, or share your personal information. The only external communication is with Anthropic's API when you explicitly use AI features, using your own API key.
