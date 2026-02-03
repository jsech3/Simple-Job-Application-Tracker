/**
 * Browser API Polyfill
 * Provides a unified interface for Chrome and Firefox extension APIs
 */

// Type definitions for browser API
interface BrowserAPI {
  storage: {
    local: {
      get: (keys?: string | string[] | null) => Promise<Record<string, any>>;
      set: (items: Record<string, any>) => Promise<void>;
      remove: (keys: string | string[]) => Promise<void>;
      clear: () => Promise<void>;
    };
    sync: {
      get: (keys?: string | string[] | null) => Promise<Record<string, any>>;
      set: (items: Record<string, any>) => Promise<void>;
      remove: (keys: string | string[]) => Promise<void>;
      clear: () => Promise<void>;
    };
  };
  runtime: {
    sendMessage: (message: any) => Promise<any>;
    onMessage: {
      addListener: (callback: (message: any, sender: any, sendResponse: (response?: any) => void) => void | boolean | Promise<any>) => void;
    };
    getURL: (path: string) => string;
  };
  tabs: {
    query: (queryInfo: any) => Promise<any[]>;
    sendMessage: (tabId: number, message: any) => Promise<any>;
  };
  contextMenus?: {
    create: (createProperties: any) => void;
    onClicked: {
      addListener: (callback: (info: any, tab: any) => void) => void;
    };
  };
  sidePanel?: {
    open: (options: { windowId?: number }) => Promise<void>;
  };
  scripting?: {
    executeScript: (injection: any) => Promise<any[]>;
  };
}

// Declare Firefox browser global
declare const browser: any;

// Detect browser and wrap APIs
const getBrowserAPI = (): BrowserAPI => {
  // Firefox uses 'browser' namespace (promises-based)
  if (typeof browser !== 'undefined' && browser.runtime) {
    return browser as unknown as BrowserAPI;
  }

  // Chrome uses 'chrome' namespace (callbacks-based, but newer versions support promises)
  if (typeof chrome !== 'undefined' && chrome.runtime) {
    // Wrap Chrome API to use promises
    return {
      storage: {
        local: {
          get: (keys) => new Promise((resolve) => chrome.storage.local.get(keys as any, resolve)),
          set: (items) => new Promise((resolve) => chrome.storage.local.set(items, resolve)),
          remove: (keys) => new Promise((resolve) => chrome.storage.local.remove(keys, resolve)),
          clear: () => new Promise((resolve) => chrome.storage.local.clear(resolve)),
        },
        sync: {
          get: (keys) => new Promise((resolve) => chrome.storage.sync.get(keys as any, resolve)),
          set: (items) => new Promise((resolve) => chrome.storage.sync.set(items, resolve)),
          remove: (keys) => new Promise((resolve) => chrome.storage.sync.remove(keys, resolve)),
          clear: () => new Promise((resolve) => chrome.storage.sync.clear(resolve)),
        },
      },
      runtime: {
        sendMessage: (message) =>
          new Promise((resolve) => chrome.runtime.sendMessage(message, resolve)),
        onMessage: chrome.runtime.onMessage,
        getURL: chrome.runtime.getURL,
      },
      tabs: {
        query: (queryInfo) => new Promise((resolve) => chrome.tabs.query(queryInfo, resolve)),
        sendMessage: (tabId, message) =>
          new Promise((resolve) => chrome.tabs.sendMessage(tabId, message, resolve)),
      },
      contextMenus: chrome.contextMenus ? {
        create: chrome.contextMenus.create.bind(chrome.contextMenus),
        onClicked: chrome.contextMenus.onClicked,
      } : undefined,
      sidePanel: chrome.sidePanel ? {
        open: (options) => chrome.sidePanel.open(options as any),
      } : undefined,
      scripting: chrome.scripting ? {
        executeScript: (injection) => chrome.scripting.executeScript(injection),
      } : undefined,
    };
  }

  // In non-extension context (dev mode), return a no-op stub so modules
  // that import `storage` can load without crashing. The services use
  // `isExtension` guards and fall back to localStorage at runtime.
  return {
    storage: {
      local: {
        get: async () => ({}),
        set: async () => {},
        remove: async () => {},
        clear: async () => {},
      },
      sync: {
        get: async () => ({}),
        set: async () => {},
        remove: async () => {},
        clear: async () => {},
      },
    },
    runtime: {
      sendMessage: async () => {},
      onMessage: { addListener: () => {} },
      getURL: (path: string) => path,
    },
    tabs: {
      query: async () => [],
      sendMessage: async () => {},
    },
  };
};

export const browserAPI = getBrowserAPI();

// Export convenience functions
export const storage = browserAPI.storage;
export const runtime = browserAPI.runtime;
export const tabs = browserAPI.tabs;
export const contextMenus = browserAPI.contextMenus;
export const sidePanel = browserAPI.sidePanel;
export const scripting = browserAPI.scripting;
