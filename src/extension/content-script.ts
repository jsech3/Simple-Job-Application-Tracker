/**
 * Content Script - Detects job posting pages and adds quick-add button
 */

// Check if current page is a job posting
function isJobPostingPage(): boolean {
  const url = window.location.href;
  return (
    url.includes('linkedin.com/jobs/') ||
    url.includes('indeed.com/viewjob') ||
    url.includes('indeed.com/rc/clk') ||
    url.includes('ziprecruiter.com/c/') ||
    url.includes('glassdoor.com/job-listing/') ||
    url.includes('glassdoor.com/partner/jobListing')
  );
}

// Extract job posting text content
function extractJobContent(): string {
  // Remove scripts and styles
  const clone = document.body.cloneNode(true) as HTMLElement;
  clone.querySelectorAll('script, style, nav, header, footer').forEach(el => el.remove());

  // Get text content
  const text = clone.innerText || '';

  // Clean up whitespace
  return text.replace(/\s+/g, ' ').trim();
}

// Create and inject the floating button
function injectQuickAddButton() {
  // Check if button already exists
  if (document.getElementById('job-tracker-quick-add')) {
    return;
  }

  // Create button
  const button = document.createElement('div');
  button.id = 'job-tracker-quick-add';
  button.innerHTML = `
    <button class="job-tracker-btn">
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M10 5v10M5 10h10" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
      </svg>
      <span>Add to Job Tracker</span>
    </button>
  `;

  // Add click handler
  button.addEventListener('click', handleQuickAdd);

  // Append to body
  document.body.appendChild(button);
}

// Handle quick add button click
async function handleQuickAdd() {
  const button = document.querySelector('#job-tracker-quick-add button') as HTMLButtonElement;
  if (!button) return;

  // Show loading state
  const originalContent = button.innerHTML;
  button.disabled = true;
  button.innerHTML = `
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" class="animate-spin">
      <circle cx="10" cy="10" r="8" stroke="currentColor" stroke-width="2" stroke-dasharray="50" opacity="0.25"/>
    </svg>
    <span>Extracting...</span>
  `;

  try {
    // Extract job content
    const content = extractJobContent();
    const url = window.location.href;

    // Send to background script
    chrome.runtime.sendMessage({
      type: 'ADD_JOB_FROM_PAGE',
      data: {
        content,
        url,
      },
    }, (response) => {
      if (response && response.success) {
        // Show success
        button.innerHTML = `
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <path d="M5 10l3 3 7-7" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
          <span>Added!</span>
        `;
        button.style.background = '#10b981';

        // Reset after delay
        setTimeout(() => {
          button.innerHTML = originalContent;
          button.style.background = '';
          button.disabled = false;
        }, 2000);

        // Open side panel
        chrome.runtime.sendMessage({ type: 'OPEN_SIDE_PANEL' });
      } else {
        throw new Error(response?.error || 'Failed to add job');
      }
    });
  } catch (error) {
    console.error('Error adding job:', error);

    // Show error
    button.innerHTML = `
      <span>❌ Error</span>
    `;
    button.style.background = '#ef4444';

    // Reset after delay
    setTimeout(() => {
      button.innerHTML = originalContent;
      button.style.background = '';
      button.disabled = false;
    }, 2000);
  }
}

// Initialize
if (isJobPostingPage()) {
  // Wait for page to load
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', injectQuickAddButton);
  } else {
    injectQuickAddButton();
  }
}

// Listen for URL changes (SPA navigation)
let lastUrl = window.location.href;
new MutationObserver(() => {
  const currentUrl = window.location.href;
  if (currentUrl !== lastUrl) {
    lastUrl = currentUrl;

    // Remove old button if exists
    const oldButton = document.getElementById('job-tracker-quick-add');
    if (oldButton) {
      oldButton.remove();
    }

    // Check if new page is job posting
    if (isJobPostingPage()) {
      setTimeout(injectQuickAddButton, 500);
    }
  }
}).observe(document.body, { childList: true, subtree: true });
