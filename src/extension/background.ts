/**
 * Background Service Worker
 * Handles extension icon clicks, context menus, and messages from content scripts
 */

import { v4 as uuidv4 } from 'uuid';

// Listen for extension icon click - open side panel
chrome.action.onClicked.addListener(async (tab) => {
  if (chrome.sidePanel && tab.windowId) {
    await chrome.sidePanel.open({ windowId: tab.windowId });
  }
});

// Create context menu item
chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: 'add-job-to-tracker',
    title: 'Add to Job Tracker',
    contexts: ['page'],
    documentUrlPatterns: [
      '*://*.linkedin.com/jobs/*',
      '*://*.indeed.com/viewjob*',
      '*://*.indeed.com/rc/clk*',
      '*://*.ziprecruiter.com/c/*',
      '*://*.glassdoor.com/job-listing/*',
      '*://*.glassdoor.com/partner/jobListing*',
    ],
  });
});

// Handle context menu clicks
chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === 'add-job-to-tracker' && tab?.id) {
    // Send message to content script to extract and add job
    chrome.tabs.sendMessage(tab.id, { type: 'EXTRACT_AND_ADD_JOB' });

    // Open side panel
    if (chrome.sidePanel && tab.windowId) {
      chrome.sidePanel.open({ windowId: tab.windowId });
    }
  }
});

// Listen for messages from content scripts and other parts of the extension
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'ADD_JOB_FROM_PAGE') {
    handleAddJobFromPage(message.data)
      .then((result) => sendResponse(result))
      .catch((error) =>
        sendResponse({ success: false, error: error.message })
      );
    return true; // Keep channel open for async response
  }

  if (message.type === 'OPEN_SIDE_PANEL') {
    if (chrome.sidePanel && sender.tab?.windowId) {
      chrome.sidePanel
        .open({ windowId: sender.tab.windowId })
        .then(() => sendResponse({ success: true }))
        .catch((error) =>
          sendResponse({ success: false, error: error.message })
        );
    } else {
      sendResponse({ success: false, error: 'Side panel not available' });
    }
    return true;
  }

  return false;
});

// Handle adding job from content script
async function handleAddJobFromPage(data: {
  content: string;
  url: string;
}): Promise<{ success: boolean; error?: string }> {
  try {
    // Import ClaudeService dynamically (can't use at top level in service worker)
    const { ClaudeService } = await import('../services/claude');
    const { StorageService } = await import('../services/storage');
    const { ApplicationStatus } = await import('../types');

    // Initialize storage
    await StorageService.initialize();

    // Parse job posting using Claude
    const parseResult = await ClaudeService.parseJobDescriptionText(
      data.content,
      data.url
    );

    if (!parseResult.success || !parseResult.data) {
      throw new Error(parseResult.error || 'Failed to parse job posting');
    }

    // Create job application object
    const newApplication = {
      id: uuidv4(),
      url: data.url,
      parsedData: parseResult.data,
      userNotes: '',
      hasApplied: true,
      applicationDate: new Date().toISOString(),
      statusUpdates: [
        {
          date: new Date().toISOString(),
          nextStep: ApplicationStatus.Applied,
          heardBack: false,
        },
      ],
      followUpReminderShown: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // Save to storage
    await StorageService.saveApplication(newApplication);

    return { success: true };
  } catch (error) {
    console.error('Error adding job from page:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

// Log that background script is running
console.log('Job Tracker background service worker loaded');
